(function(define) { 'use strict'; define(function(require) {
  var setupArgumentsTask = require('modules/setup_arguments_task');

  var mode = require('modules/mode');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  /**
   * Controller part of the task for modifying an arguments array.
   *
   * @constructor
   *
   * @param {Object} taskManagerInterface - An interface to the task manager.
   * @param {Array} defaultAttrsPathes - An array of default attrs path of
   *     each argument.
   * @param {setupArgumentsTask._Model} model - The model part of the task.
   */
  setupArgumentsTask._Controller = function(
      taskManagerInterface, defaultAttrsPathes, model) {
    this._taskManagerInterface = taskManagerInterface;
    this._model = model;
    this._defaultAttrsPathes = defaultAttrsPathes;

    this._onModeChanged = this._onModeChanged.bind(this);

    mode.on(mode.EVENTS.MODE_CHANGED, this._onModeChanged);

    this._onModeChanged();
  };

  setupArgumentsTask._Controller.prototype = {
    destroy: function() {
      mode.off(mode.EVENTS.MODE_CHANGED, this._onModeChanged);

      this._onModeChanged = null;

      this._defaultAttrsPathes = null;
      this._model = null;
      this._taskManagerInterface = null;
    },

    /**
     * Appends an argument.
     */
    appendArgument: function() {
      if (this._model.canResize) {
        this._model.appendArgument(undefined);
        this.resetArgument(this._model.values.length - 1);
      }
    },

    /**
     * Removes i-th argument.
     *
     * @param {number} index - The index of the argument to be removed.
     */
    removeArgument: function(index) {
      if (this._model.canResize) {
        this._model.removeArgument(index);
      }
    },

    /**
     * Resets an argument.
     *
     * @param {number} index - The index of the argument to be reseted.
     */
    resetArgument: function(index) {
      var defaultAttrsPath =
          utils.getDefault(this._defaultAttrsPathes, index, []);
      var onValueGot = this._model.setArgumentValue.bind(this._model, index);
      this._taskManagerInterface.createPopupTask(
          varTree.createResetValueTask, [defaultAttrsPath, onValueGot], true);
    },

    /**
     * Handler for the mode changed event.
     */
    _onModeChanged: function() {
      this._model.canResize = (mode.mode == mode.MODES.ENGINEER);
    }
  };

}); })((function(w) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(n) { return w[n]; }); };
})(this));
