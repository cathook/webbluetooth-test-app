;(function(define) { 'use strict'; define(function(require, exports, module) {
  var logComponent = module.exports;

  var component = require('gaia-component');
  var math = require('libs/math');
  var touchGesture = require('libs/touch_gesture');
  var utils = require('libs/utils');

  /**
   * Enumerates kinds of prefix.
   */
  logComponent.PREFIX = new utils.Enum({
    INFO: '[INFO]',
    WARNING: '<span style="color: rgb(70, 70, 20);">[WARNING]</span>',
    ERROR: '<span style="color: rgb(130, 20, 20);">[ERROR]</span>'
  });

  /**
   * Custom HTMLElement for a row of log message.
   *
   * @class
   */
  logComponent.LogMessage = component.register('app-log-message', {
    EVENTS: new utils.Enum({
      /**
       * Fired if the user want to remove this message.
       */
      REMOVE: 'remove',

      /**
       * Fired if the user want to view/edit the details object of this message.
       */
      ENTER: 'enter'
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      /**
       * References to html elements.
       *
       * @type {Object}
       * @private
       */
      this._elements = {
        prefix: shadowRoot.getElementById('prefix'),
        content: shadowRoot.getElementById('content'),
        outer: shadowRoot.getElementById('outer')
      };

      /**
       * A dict of touch gesture detectors.
       *
       * @type {Object?}
       * @private
       */
      this._touchGestures = {};

      /**
       * Content.
       *
       * @type {string}
       * @private
       */
      this._content = '';
    },

    attached: function() {
      var xPos = new math.Vector2D(1, 0);
      var xNeg = new math.Vector2D(-1, 0);

      this._touchGestures.click = new touchGesture.Click(this._elements.outer);
      this._touchGestures.click.on(
          'click', this._dispatch.bind(this, this.EVENTS.ENTER));

      this._touchGestures.slideLeft =
          new touchGesture.Slide(this._elements.outer, xNeg);
      this._touchGestures.slideLeft.on(
          'slide', this._dispatch.bind(this, this.EVENTS.REMOVE));

      this._touchGestures.slideRight =
          new touchGesture.Slide(this._elements.outer, xPos);
      this._touchGestures.slideRight.on(
          'slide', this._dispatch.bind(this, this.EVENTS.REMOVE));
    },

    detached: function() {
      utils.iterateDict(this._touchGestures, function(name, instance) {
        instance.destroy();
      });
      this._touchGestures = {};
    },

    attrs: {
      prefix: {
        /**
         * @returns {string} The prefix string.
         */
        get: function() {
          return this._elements.prefix.innerHTML;
        },

        /**
         * Sets the prefix string.
         *
         * @param {string} value - The prefix string.
         */
        set: function(value) {
          this._elements.prefix.innerHTML = value;
        }
      },

      /**
       * The content string.
       *
       * @type {string}
       */
      content: {
        get: function() {
          return this._content;
        },

        set: function(value) {
          this._content = value;
          utils.fillHTMLElementText(this._elements.content, value);
        }
      }
    },

    /**
     * Dispatches a custom event.
     *
     * @param {string} eventName - Name of the event.
     */
    _dispatch: function(eventName) {
      this.dispatchEvent(new CustomEvent(eventName, {bubbles: true}));
    },

    template: `
      <div id="outer">
        <div id="prefix"></div>
        <div id="content"></div>
      </div>

      <style>
        #outer {
          display: flex;
          flex-direction: row;
          font-size: 80%;
        }

        #prefix {
          flex: 0 1 auto;
        }

        #content {
          flex: 1 1 auto;
          text-align: left;
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
})('libs/log_message', this));
