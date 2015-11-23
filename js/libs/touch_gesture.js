;(function(define) { 'use strict'; define(function(require, exports, module) {
  var touchGesture = module.exports;

  var evt = require('evt');
  var math = require('libs/math');
  var stateMachine = require('libs/state_machine');
  var utils = require('libs/utils');

  /**
   * A template class for gesture handler which using only single touch point
   * and a state machine.
   *
   * The subclass only needs to supply `_createStateMachine` method.
   *
   * @constructor
   *
   * @param {EventTarget} eventTarget - The event target to listen.
   */
  var _SinglePointStatedHandlerTemplate = function(eventTarget) {
    /**
     * References to the event target to listen.
     *
     * @type {?EventTarget}
     * @private
     */
    this._eventTarget = eventTarget;

    /**
     * Event listeners for each touch point related events.
     *
     * @type {Object}
     * @private
     */
    this._eventListeners = {};
    this._eventListeners[touchGesture.TOUCH_EVENTS.START] =
        this._touchStartHandler.bind(this);
    this._eventListeners[touchGesture.TOUCH_EVENTS.MOVE] =
        this._touchMoveHandler.bind(this);
    this._eventListeners[touchGesture.TOUCH_EVENTS.END] =
        this._touchDoneHandler.bind(this);
    if (touchGesture.TOUCH_EVENTS.CANCEL) {
      this._eventListeners[touchGesture.TOUCH_EVENTS.CANCEL] =
          this._touchDoneHandler.bind(this);
    }

    /**
     * The current touch identifier to trace.
     *
     * @type {?number}
     * @private
     */
    this._touchId = null;

    /**
     * The main state machine.
     *
     * @type {stateMachine.StateMachine}
     * @private
     */
    this._stateMachine = this._createStateMachine();

    // binds each event listener on to the event target.
    utils.iterateDict(this._eventListeners, function(eventName, handler) {
      this._eventTarget.addEventListener(eventName, handler);
    }, this);
  };

  _SinglePointStatedHandlerTemplate.prototype = {
    /**
     * Destructor.
     */
    destroy: function() {
      // unbinds all event listeners.
      utils.iterateDict(this._eventListeners, function(eventName, handler) {
        this._eventTarget.removeEventListener(eventName, handler);
      }, this);

      // removes the useless reference.
      this._eventListeners = {};
      this._eventTarget = null;
      this._touchId = null;

      // destroys the state machine.
      this._stateMachine.destroy();
      this._stateMachine = null;
    },

    /**
     * Touch start event handler.
     *
     * @param {TouchEvent} evtObj - The touch event.
     * @private
     */
    _touchStartHandler: function(evtObj) {
      if (this._touchId === null) {
        evtObj = _transformToTouchEvent(evtObj);
        var touch = evtObj.changedTouches[0];

        this._touchId = touch.identifier;
        this._stateMachine.transform(evtObj.type, touch);
      }
    },

    /**
     * Touch move event handler.
     *
     * @param {TouchEvent} evtObj - The touch event.
     * @private
     */
    _touchMoveHandler: function(evtObj) {
      evtObj = _transformToTouchEvent(evtObj);
      this._handleIfTouchIdMatch(evtObj, function(evtObj, touch) {
        this._stateMachine.transform(evtObj.type, touch);
      });
    },

    /**
     * Touch end/cancel event handler.
     *
     * @param {TouchEvent} evtObj - The touch event.
     * @private
     */
    _touchDoneHandler: function(evtObj) {
      evtObj = _transformToTouchEvent(evtObj);
      this._handleIfTouchIdMatch(evtObj, function(evtObj, touch) {
        this._stateMachine.transform(evtObj.type, touch);
        this._touchId = null;
      });
    },

    /**
     * Calls the gived handler only if the currently traced touch point was
     * changed in the gived touch event.
     *
     * @param {TouchEvent} evtObj - The touch event.
     * @param {Function} handler - The handler function.
     * @private
     */
    _handleIfTouchIdMatch: function(evtObj, handler) {
      if (this._touchId !== null) {
        utils.iterateArray(evtObj.changedTouches, function(touch) {
          if (touch.identifier == this._touchId) {
            handler.call(this, evtObj, touch);
            return false;  // breaks the iteration
          }
        }, this);
      }
    }
  };

  /**
   * Click touch gesture detector.
   *
   * Inherits from `_SinglePointStatedHandlerTemplate`.
   *
   * @constructor
   * @param {EventTarget} eventTarget - The event target to listen.
   * @param {Object} options - Extra options of the gesture.
   */
  touchGesture.Click = function(eventTarget, options) {
    /**
     * Extra options of the gesture.
     *
     * @type {Object}
     * @private
     */
    this._options = utils.fillDefaults(options || {}, this.DEFAULT_OPTIONS);

    _SinglePointStatedHandlerTemplate.call(this, eventTarget);
  };

  touchGesture.Click.prototype = evt(Object.setPrototypeOf({
    /**
     * The default options.
     */
    DEFAULT_OPTIONS: Object.freeze({
      /**
       * The max acceptable moving distance after the touch start.
       *
       * @type {number}
       */
      maxLength: 10,

      /**
       * The max acceptable duration between the start time and the end time of
       * the touch.
       *
       * @type {number}
       */
      maxDuration: 1000,

      /**
       * The min acceptable duration between the start time and the end time of
       * the touch.
       *
       * @type {number}
       */
      minDuration: 0,

      /**
       * Whether this touch gesture detector should trigger the click event
       * right after the max duration reached.
       *
       * @type {boolean}
       */
      triggerOnMaxDurationReached: false,

      /**
       * The event name.
       *
       * @type {string}
       */
      eventName: 'click'
    }),

    _createStateMachine: function() {
      var STATES = new utils.Enum('NONE', 'PRESSED', 'IGNORED');

      var initPos = null;
      var startTime = 0;
      var setTimer = utils.noOperation;

      var sm = new stateMachine.StateMachine(this);

      sm.addState(STATES.NONE, utils.objToFunc({
        touchstart: function(touch) {
          initPos = _getTouchClientPos(touch);
          startTime = +(new Date());
          setTimer();
          return STATES.PRESSED;
        }
      }));

      sm.addState(STATES.PRESSED, utils.objToFunc({
        touchmove: function(touch) {
          // Checks whether the touch is still close to the touch start place.
          // If not, go to state `IGNORED`
          var len = _getTouchClientPos(touch).sub(initPos).length;
          if (len > this._options.maxLength) {
            return STATES.IGNORED;
          }
        },
        touchend: function(touch) {
          var duration = +(new Date()) - startTime;
          if (this._options.minDuration <= duration &&
              duration <= this._options.maxDuration) {
            window.setTimeout(
                this.fire.bind(this, this._options.eventName), 100);
          }
          return STATES.NONE;
        },
        touchcancel: touch => STATES.NONE
      }));

      sm.addState(STATES.IGNORED, utils.objToFunc({
        // The state `IGNORED` will return back to `NONE` only if the touch
        // event is either end or canceled.
        touchend: touch => STATES.NONE,
        touchcancel: touch => STATES.NONE
      }));

      sm.state = STATES.NONE;

      if (this._options.triggerOnMaxDurationReached) {
        var uniqueId = 0;
        setTimer = (function() {
          ++uniqueId;
          window.setTimeout((function(currUniqueId) {
            if (currUniqueId == uniqueId) {
              if (sm.state == STATES.PRESSED) {
                window.setTimeout(
                    this.fire.bind(this, this._options.eventName), 100);
                sm.state = STATES.IGNORED;
              }
            }
          }).bind(this, uniqueId), this._options.maxDuration);
        }).bind(this);
      }

      return sm;
    }
  }, _SinglePointStatedHandlerTemplate.prototype));

  /**
   * Gesture detector for touch moving along a specified axis.
   *
   * @constructor
   * @param {EventTarget} eventTarget - The event target to listen.
   * @param {math.Vector2D} axis - The axis to move alone.
   * @param {Object} options - Extra options of the gesture.
   */
  touchGesture.DirectionalMove = function(eventTarget, axis, options) {
    _SinglePointStatedHandlerTemplate.call(this, eventTarget);

    /**
     * Extra options of the gesture.
     *
     * @type {Object}
     * @private
     */
    this._options = utils.fillDefaults(options || {}, this.DEFAULT_OPTIONS);
    this._options.axis = axis;
    this._options.axisBounds = [axis.rotate(-this._options.angleRange),
                                axis.rotate(this._options.angleRange)];
  };

  touchGesture.DirectionalMove.prototype = evt(Object.setPrototypeOf({
    /**
     * The default options.
     */
    DEFAULT_OPTIONS: Object.freeze({
      /**
       * Acceptable angle rangle between the touch move direction and the axis.
       *
       * @type {number}
       */
      angleRange: Math.PI / 6,

      /**
       * Lower bound of the length of this gesture.  If the touch point is still
       * too close to the origin, the event will not be triggered.
       *
       * @type {number}
       */
      minLength: 10,

      /**
       * The start/move/end event name.
       *
       * @type {string}
       */
      startEventName: 'start',
      moveEventName: 'move',
      endEventName: 'end'
    }),

    _createStateMachine: function() {
      var STATES = new utils.Enum(
          'NONE', 'CLOSE_TO_ORIGIN', 'MOVING', 'IGNORED');

      var initPos = null;  // The place the touch start event happened.
      var origPos = null;  // The place the move start event happened.

      var sm = new stateMachine.StateMachine(this);

      sm.addState(STATES.NONE, utils.objToFunc({
        touchstart: function(touch) {
          initPos = _getTouchClientPos(touch);
          return STATES.CLOSE_TO_ORIGIN;
        }
      }));

      sm.addState(STATES.CLOSE_TO_ORIGIN, utils.objToFunc({
        touchmove: function(touch) {
          origPos = _getTouchClientPos(touch);
          var delta = origPos.sub(initPos);
          // If the current position is far enought from the original position,
          // it should check whether the direction is in range or not.
          if (delta.length >= this._options.minLength) {
            var crossValue = (this._options.axisBounds[0].cross(delta) *
                              this._options.axisBounds[1].cross(delta));
            if (crossValue < 0) {
              this.fire(this._options.startEventName, origPos);
              return STATES.MOVING;
            } else {
              return STATES.IGNORED;
            }
          }
        },
        touchend: touch => STATES.NONE,
        touchcancel: touch => STATES.NONE
      }));

      sm.addState(STATES.MOVING, utils.objToFunc({
        touchmove: function(touch) {
          var delta = _getTouchClientPos(touch).sub(origPos);
          this.fire(this._options.moveEventName, delta.dot(this._options.axis));
        },
        touchend: function(touch) {
          this.fire(this._options.endEventName);
          return STATES.NONE;
        },
        touchcancel: function(touch) {
          this.fire(this._options.endEventName);
          return STATES.NONE;
        }
      }));

      sm.addState(STATES.IGNORED, utils.objToFunc({
        touchend: touch => STATES.NONE,
        touchcancel: touch => STATES.NONE
      }));

      sm.state = STATES.NONE;

      return sm;
    }
  }, _SinglePointStatedHandlerTemplate.prototype));

  /**
   * Slide gesture detector.
   *
   * Inherits from `_SinglePointStatedHandlerTemplate`.
   *
   * @constructor
   * @param {EventTarget} eventTarget - The event target to listen.
   * @param {math.Vector2D} direction - The direction of the slide.
   * @param {Object} options - Extra options of the gesture.
   */
  touchGesture.Slide = function(eventTarget, direction, options) {
    _SinglePointStatedHandlerTemplate.call(this, eventTarget);

    options = utils.fillDefaults(options || {}, this.DEFAULT_OPTIONS);
    options.direction = direction;
    options.dirLowerBound = options.direction.rotate(-options.angleRange);
    options.dirUpperBound = options.direction.rotate(options.angleRange);

    /**
     * Extra options of the gesture.
     *
     * @type {Object}
     * @private
     */
    this._options = options;
  };

  touchGesture.Slide.prototype = evt(Object.setPrototypeOf({
    DEFAULT_OPTIONS: Object.freeze({
      /**
       * Acceptable angle rangle between the touch move direction and the axis.
       *
       * @type {number}
       */
      angleRange: Math.PI / 6,
      /**
       * Upper bound of the length of this gesture.  If the touch move over this
       * threshold, at the end no matter the speed is enought or not, the event
       * will always be triggered.
       *
       * @type {number}
       */
      maxLength: 120,

      /**
       * Lower bound of the length of this gesture.  If the touch point is still
       * too close to the origin, the event will not be triggered.
       *
       * @type {number}
       */
      minLength: 10,

      /**
       * The minimum acceptable speed while the touch event is end.
       *
       * @type {number}
       */
      minSpeed: 0.5,

      /**
       * The event name.
       *
       * @type {string}
       */
      eventName: 'slide',

      /**
       * A function to update the speed each time touch move event is cought.
       *
       * @type {Function}
       */
      speedUpdateFunc: function(oldSpeed, newSpeed) {
        return oldSpeed * 0.3 + newSpeed * 0.7;
      }
    }),

    _createStateMachine: function() {
      var STATES = new utils.Enum('NONE', 'MOVING', 'IGNORED');

      var initPos = null;
      var lastLen = null;
      var lastTime = null;
      var speed = null;

      var initStateInfo = function(pos) {
        initPos = pos;
        lastLen = 0;
        lastTime = +(new Date());
        speed = 0;
      };

      var updateStateInfo = function(pos) {
        var currTime = +(new Date());
        var currLen = pos.sub(initPos).dot(this._options.direction);
        speed = this._options.speedUpdateFunc(
            speed, (currLen - lastLen) / (currTime - lastTime));
        lastLen = currLen;
        lastTime = currTime;
      };

      var sm = new stateMachine.StateMachine(this);

      sm.addState(STATES.NONE, utils.objToFunc({
        touchstart: function(touch) {
          initStateInfo.call(this, _getTouchClientPos(touch));
          return STATES.MOVING;
        }
      }));

      sm.addState(STATES.MOVING, utils.objToFunc({
        touchmove: function(touch) {
          var pos = _getTouchClientPos(touch);
          if (!this._isMovementInRange(pos.sub(initPos))) {
            return STATES.IGNORED;
          } else {
            updateStateInfo.call(this, pos);
          }
        },
        touchend: function(touch) {
          var pos = _getTouchClientPos(touch);
          if (this._isGestureAcceptable(pos.sub(initPos), speed)) {
            this.fire(this._options.eventName);
          }
          return STATES.NONE;
        },
        touchcancel: touch => STATES.NONE
      }));

      sm.addState(STATES.IGNORED, utils.objToFunc({
        touchend: touch => STATES.NONE,
        touchcancel: touch => STATES.NONE
      }));

      sm.state = STATES.NONE;

      return sm;
    },

    /**
     * Checks whether the gesture is acceptable.
     *
     * The gesture is acceptable if either the move distance is large enought or
     * the final speed is fast enought.
     *
     * @param {math.Vector2D} vector - The offset between the end point and the
     *     start point of the touch event.
     * @param {number} speed - The final speed.
     * @returns {boolean} `true` if the gesture is acceptable.
     */
    _isGestureAcceptable: function(vector, speed) {
      var len = vector.dot(this._options.direction);
      return (len >= this._options.maxLength ||
              len > this._options.minLength && speed >= this._options.minSpeed);
    },

    /**
     * Checks whether the gesture is still acceptable.
     *
     * It ensures that at each moment, the touch point is always in the right
     * direction.
     *
     * @param {math.Vector2D} vector - The offset between the end point and the
     *     start point of the touch event.
     * @returns {boolean} `true` if the gesture is still acceptable.
     */
    _isMovementInRange: function(vector) {
      return (this._options.dirLowerBound.cross(vector) > 0 &&
              this._options.dirUpperBound.cross(vector) < 0);
    }
  }, _SinglePointStatedHandlerTemplate.prototype));

  /**
   * Returns (touch.clientX, touch.clientY)
   *
   * @param {TouchEvent} touch - The touch event.
   * @returns {math.Vector2D} The client touch point.
   */
  var _getTouchClientPos = function(touch) {
    return new math.Vector2D(touch.clientX, touch.clientY);
  };

  var _transformToTouchEvent;

  if ('ontouchstart' in document.documentElement) {
    /**
     * Enumerates types of touch event names.
     */
    touchGesture.TOUCH_EVENTS = new utils.Enum({
      START: 'touchstart',
      MOVE: 'touchmove',
      END: 'touchend',
      CANCEL: 'touchcancel'
    });

    _transformToTouchEvent = (evtObj) => evtObj;
  } else {
    // Makes this module compatible on browsers which are not fully support
    // the touch events.
    touchGesture.TOUCH_EVENTS = new utils.Enum({
      START: 'mousedown',
      MOVE: 'mousemove',
      END: 'mouseup'
    });

    var eventNameMap = {
      mousedown: 'touchstart',
      mousemove: 'touchmove',
      mouseup: 'touchend'
    };

    _transformToTouchEvent = function(evtObj) {
      return {
        type: eventNameMap[evtObj.type],
        target: evtObj.target,
        changedTouches: [{
          identifier: 0,
          target: evtObj.target,
          clientX: evtObj.clientX,
          clientY: evtObj.clientY,
          screenX: evtObj.screenX,
          screenY: evtObj.screenY,
          pageX: evtObj.pageX,
          pageY: evtObj.pageY,
        }]
      };
    };
  }

}); })((function(name, win) {
  /* global define, exports, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require, exports, module); } :
      function(c) {
        var module = {exports: {}};
        var require = function(name) { return win[name]; };
        win[name] = c(require, module.exports, module) || module.exports;
      };
})('libs/touch_gesture', this));
