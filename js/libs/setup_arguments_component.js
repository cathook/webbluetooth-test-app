;(function(define) { 'use strict'; define(function(require, exports, module) {
  var setupArgumentsComponent = module.exports;

  var component = require('gaia-component');
  var math = require('libs/math');
  var touchGesture = require('libs/touch_gesture');
  var utils = require('libs/utils');

  /**
   * A custom html element for displaying an argument in the setup arguments
   * task.
   *
   * @class
   */
  setupArgumentsComponent.Argument =
      component.register('app-setup-arguments-argument', {
    EVENTS: new utils.Enum({
      /**
       * Fires if the user tries to enter the argument.
       */
      ENTER: 'enter',

      /**
       * Fires if the user want to remove this argument.
       */
      REMOVE: 'remove'
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      this._elements = {
        outer: shadowRoot.getElementById('outer'),
        name: shadowRoot.getElementById('name'),
        value: shadowRoot.getElementById('value')
      };

      this._touchGestures = {};

      this._name = '';

      this._value = '';

      utils.iterateArray(touchGesture.TOUCH_EVENTS, function(eventName) {
        this.addEventListener(eventName, function(evtObj) {
          evtObj.stopPropagation();
        });
      });
    },

    attached: function() {
      this._touchGestures.click = new touchGesture.Click(this._elements.outer);
      this._touchGestures.click.on(
          'click', this._dispatch.bind(this, this.EVENTS.ENTER));

      var xPos = new math.Vector2D(1, 0);
      var xNeg = new math.Vector2D(-1, 0);

      this._touchGestures.slideLeft =
          new touchGesture.Slide(this._elements.outer, xPos);
      this._touchGestures.slideLeft.on(
          'slide', this._dispatch.bind(this, this.EVENTS.REMOVE));

      this._touchGestures.slideRight =
          new touchGesture.Slide(this._elements.outer, xNeg);
      this._touchGestures.slideRight.on(
          'slide', this._dispatch.bind(this, this.EVENTS.REMOVE));
    },

    detached: function() {
      utils.iterateDict(this._touchGestures, function(name, touchGesture) {
        touchGesture.destroy();
      });
      this._touchGestures = {};
    },

    attrs: {
      /**
       * Name of the argument.
       *
       * @type {string}
       */
      name: {
        get: function() {
          return this._name;
        },
        set: function(name) {
          this._name = name;
          utils.fillHTMLElementText(this._elements.name, name);
        }
      },

      /**
       * Value of the argument.
       *
       * @type {string}
       */
      value: {
        get: function() {
          return this._value;
        },
        set: function(value) {
          this._value = value;
          utils.fillHTMLElementText(this._elements.value, value);
        }
      }
    },

    _dispatch: function(eventName) {
      this.dispatchEvent(new CustomEvent(eventName));
    },

    template: `
      <div id="outer">
        <span id="name"></span>
        :
        <span id="value"></span>
      </div>

      <style>
        #outer {
          -moz-user-select: none;
          cursor: pointer;
          height: 100%;
          text-align: left;
          width: 100%;
        }
      </style>
    `
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
})('libs/setup_arguments_component', this));
