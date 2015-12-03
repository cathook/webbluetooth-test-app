(function(define) { 'use strict'; define(function(require) {
  var setupArgumentsTask = require('modules/setup_arguments_task');

  var evt = require('evt');
  var utils = require('libs/utils');

  /**
   * Model part of the task.
   *
   * @constructor
   * @param {Array} args - An reference of the argument.  All the modification
   *     will on this array.
   */
  setupArgumentsTask._Model = function(args) {
    this._values = args;
    this._canResize = true;
  };

  setupArgumentsTask._Model.prototype = evt({
    EVENTS: new utils.Enum({
      /**
       * Fired if the value in the argument array was changed.
       */
      VALUES_CHANGED: 'valueChanged',

      /**
       * Fired if the mode of whether the argument array can resize or not was
       * changed.
       */
      CAN_RESIZE_STATE_CHANGED: 'canResizeStateChanged'
    }),

    destroy: function() {
      this._values = null;
      this._canResize = null;
    },

    /**
     * Sets an argument's value.
     *
     * @param {number} index - The index of the argument to be changed.
     * @param {Object} value - The new argument value.
     */
    setArgumentValue: function(index, value) {
      this._values[index] = value;

      this.fire(this.EVENTS.VALUES_CHANGED);
    },

    /**
     * Appends an argument.
     *
     * @param {Object} value - The new argument value.
     */
    appendArgument: function(value) {
      this._values.push(value);

      this.fire(this.EVENTS.VALUES_CHANGED);
    },

    /**
     * Removes an argument.
     *
     * @param {number} index - The index of the argument to be removed.
     */
    removeArgument: function(index) {
      this._values.splice(index, 1);

      this.fire(this.EVENTS.VALUES_CHANGED);
    },

    /**
     * @returns {boolean} Whether the arguments array can resize or not.
     */
    get canResize() {
      return this._canResize;
    },

    set canResize(canResize) {
      this._canResize = canResize;

      this.fire(this.EVENTS.CAN_RESIZE_STATE_CHANGED, this._canResize);
    },

    /**
     * @returns {Array} Values of the arguments array.
     */
    get values() {
      return this._values;
    }
  });

}); })((function(w) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(n) { return w[n]; }); };
})(this));
