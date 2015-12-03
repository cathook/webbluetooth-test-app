;(function(define) { 'use strict'; define(function(require) {
  var testTaskMaterial = require('modules/test_task_material');

  var evt = require('evt');
  var utils = require('libs/utils');

  /**
   * An interface for a model part of the task.
   *
   * The method listed below will be called by the view or controller.
   */
  testTaskMaterial.ModelInterface = function() {};

  testTaskMaterial.ModelInterface.prototype = evt({
    EVENTS: new utils.Enum({
      /**
       * Fires if an element was added.
       */
      ELEMENT_ADDED: 'elementAdded',

      /**
       * Fires if an element was removed.
       */
      ELEMENT_REMOVED: 'elementRemoved',

      /**
       * Fires if a value of an element was changed.
       */
      ELEMENT_VALUE_CHANGED: 'elementValueChanged',

      /**
       * Fires if the editable state changed.
       */
      EDITABLE_STATE_CHANGED: 'editableStateChanged'
    }),

    /**
     * Iterates throught the elements in the index-ordered.
     *
     * @param {Function} callback - The callback function for each element.
     */
    orderedIterate: function(callback) {
      throw 'Unimplemented function called';
    },

    /**
     * @returns {Array} An array of elements.
     */
    get elements() {
      if (true) {  // Prevents jslint error.
        throw 'Unimplemented function called';
      }
      return [];
    },

    /**
     * @returns {boolean} Whether the elements is editable or not.
     */
    get editable() {
      if (true) {  // Prevents jslint error.
        throw 'Unimplemented function called';
      }
      return false;
    }
  });

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
