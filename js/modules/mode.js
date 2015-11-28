;(function(define) { 'use strict'; define(function(require, exports, module) {

  var evt = require('evt');
  var utils = require('libs/utils');

  module.exports = evt({
    MODES: new utils.Enum({
      /**
       * It means that the test app will apply more safeguards.
       */
      NORMAL: 'normal',

      /**
       * No any safeguard, the user can do everything he/she want.
       */
      ENGINEER: 'engineer'
    }),

    EVENTS: new utils.Enum({
      /**
       * Fire iff the mode is changed.
       */
      MODE_CHANGED: 'modeChanged'
    }),

    /**
     * Switches to next mode.
     */
    toNextMode: function() {
      if (_currMode == this.MODES.NORMAL) {
        _currMode = this.MODES.ENGINEER;
      } else {
        _currMode = this.MODES.NORMAL;
      }
      this.fire(this.EVENTS.MODE_CHANGED);
    },

    /**
     * @returns {string} The current mode.
     */
    get mode() {
      return _currMode;
    },

    /**
     * Sets the mode.  It will fire the `MODE_CHANGED` event.
     *
     * @param {string} value - The new mode.
     */
    set mode(value) {
      var prevMode = _currMode;
      _currMode = value;
      if (prevMode != _currMode) {
        this.fire(this.EVENTS.MODE_CHANGED);
      }
    },

    /**
     * @returns {HTMLElement} A html element represents the current mode in
     *     beautiful style.
     */
    get htmlElement() {
      return _htmlElements[_currMode];
    }
  });

  var _currMode = module.exports.MODES.NORMAL;

  var _htmlElements = {};

  _htmlElements[module.exports.MODES.NORMAL] =
      utils.fillHTMLElementText(document.createElement('span'), 'NORMAL');

  _htmlElements[module.exports.MODES.ENGINEER] = (function() {
    var span = utils.fillHTMLElementText(
        document.createElement('span'), 'ENGINEER');
    span.style.color = 'red';
    return span;
  })();

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
})('modules/mode', this));
