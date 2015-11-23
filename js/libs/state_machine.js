;(function(define) { 'use strict'; define(function(require, exports, module) {
  var stateMachine = module.exports;

  var evt = require('evt');
  var utils = require('libs/utils');

  /**
   * A simple finite state machine.
   *
   * @constructor
   * @param {Object} [thisObj=this] - `this` object to be bound while calling
   *     the transition function.
   */
  stateMachine.StateMachine = function(thisObj) {
    /**
     * Current state.
     *
     * @type {?string}
     * @private
     */
    this._state = null;

    /**
     * Transition functions of each state.
     *
     * @type {Object}
     * @private
     */
    this._transitionFuncs = {};

    /**
     * `this` object for transition functions.
     *
     * @type {?Object}
     * @private
     */
    this._thisObj = thisObj || this;
  };

  stateMachine.StateMachine.prototype = evt({
    /**
     * Enumerates of events which might be fire from the state machine.
     */
    EVENTS: new utils.Enum({
      /**
       * Fired when the state is changed.
       */
      STATE_CHANGED: 'stateChanged'
    }),

    /**
     * Custom destructor.  It cleans up the references to transition functions
     * to prevent memory leak caused by cross reference.
     */
    destroy: function() {
      this._state = null;
      this._transitionFuncs = null;
      this._defaultThisObj = null;
    },

    /**
     * Adds a state and setups its transition function.
     *
     * @param {string} stateName - Name of the state.
     * @param {Function} transitionFunc - Transition function of the state.
     * @returns {stateMachine.StateMachine} `this`.
     *
     * @see StateMachine.prototype.transform for arguments and return type of
     *     the transition function.
     */
    addState: function(stateName, transitionFunc) {
      this._transitionFuncs[stateName] = (function(args) {
        return transitionFunc.apply(this._thisObj, args);
      }).bind(this);

      return this;
    },

    /**
     * Transforms by calling the current state's transition function.
     *
     * The gived arguments will be passed to the transition function as its
     * arguments.
     * If the transition function returns an Array (called `arr` here), the next
     * state will be `arr[0]` and the return value of this function call will
     * be `arr[1]`.  Otherwise the state will change to the return value of
     * the transition function only if it is not `undefined`.
     */
    transform: function() {
      var args = Array.prototype.slice.call(arguments);
      var ret = this._transitionFuncs[this.state](args);
      if (!(ret instanceof Array)) {
        ret = [ret, undefined];
      }
      if (ret[0] !== undefined) {
        this.state = ret[0];
      }
      return ret[1];
    },

    /**
     * @returns {?string} The current state.
     */
    get state() {
      return this._state;
    },

    /**
     * Sets the current state.
     *
     * @param {string} state - The state name.
     */
    set state(state) {
      if (this._state !== state) {
        this._state = state;

        this.fire(this.EVENTS.STATE_CHANGED, state);
      }
    },
  });

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
})('libs/state_machine', this));
