;(function(define) { 'use strict'; define(function(require) {
  var testTaskMaterial = require('modules/test_task_material');

  /**
   * An interface for a controller part of the task.
   *
   * The method listed below will be called by the view if it cought a
   * corrosponding signal from the UI.
   */
  testTaskMaterial.ControllerInterface = function() {};

  testTaskMaterial.ControllerInterface.prototype = {
    /**
     * Saves the data into the global var tree.
     */
    saveToVarTree: function() {
    },

    /**
     * Edits the data by the var tree module.
     */
    editByVarTree: function() {
    },

    /**
     * Chooses an option from the UI.
     */
    chooseOption: function(identifier, option) {
    },

    /**
     * Turns on a switch.
     */
    turnOn: function(identifier) {
    },

    /**
     * Turns off a switch.
     */
    turnOff: function(identifier) {
    },

    /**
     * Removes an attribute.
     */
    removeAttribute: function(identifier) {
    },

    /**
     * Refreshes an attribute.
     */
    refreshAttribute: function(identifier) {
    },

    /**
     * Setups an argument list of a callable attribute.
     */
    setupArguments: function(identifier) {
    },

    /**
     * Enters an attribute.
     */
    enterAttribute: function(identifier) {
    },

    /**
     * Selectes an attribute.
     */
    selectAttribute: function(identifier) {
    }
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
