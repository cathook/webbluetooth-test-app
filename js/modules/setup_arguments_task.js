(function(define) { 'use strict'; define(function(require, exports, module) {
  var setupArgumentsTask = module.exports;

  var utils = require('libs/utils');

  /**
   * A task for modifying an argument list.
   *
   * @param {Object} taskManagerInteface - An interface to the task manager.
   * @param {Array} argumentsSpec - An array of argument spec.  Each argument
   *     spec should be a dictionary contains below attributes:
   *       - name: Name of that argument.
   *       - defaultAttrsPath: Default attrs-path in the global var tree if
   *           the user want to reset this argument by getting a value from
   *           the global var tree.
   * @param {Array} args - References to the arguments array.
   *
   * @returns {_Task} A task.
   */
  setupArgumentsTask.createTask =
      function(taskManagerInterface, argumentsSpec, args) {
    return new _Task(taskManagerInterface, argumentsSpec, args);
  };

  /**
   * A task for modifying an argument list.
   *
   * @constructor
   *
   * The parameters are equal to the one for `setupArgumentsTask.createTask`.
   * @see {setupArgumentsTask.createTask}
   */
  var _Task = function(taskManagerInterface, argumentsSpec, args) {
    this._model = new setupArgumentsTask._Model(args);

    var defaultAttrsPathes = [];
    utils.iterateArray(argumentsSpec, function(spec) {
      defaultAttrsPathes.push(utils.getDefault(spec, 'defaultAttrsPath', []));
    });
    this._controller = new setupArgumentsTask._Controller(
        taskManagerInterface, defaultAttrsPathes, this._model);

    var argumentNames = [];
    for (var i = 0; i < argumentsSpec.length; ++i) {
      argumentNames.push(utils.getDefault(argumentsSpec[i], 'name', 'arg' + i));
    }
    this._view = new setupArgumentsTask._View(
        argumentNames, this._controller, this._model);
  };

  _Task.prototype = {
    get view() {
      return this._view.container;
    },

    destroy: function() {
      this._model.destroy();
      this._view.destroy();
      this._controller.destroy();

      this._model = null;
      this._view = null;
      this._controller = null;
    }
  };

}); })((function(n, w) {
  /* global define, exports, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require, exports, module); } :
      function(c) {
        var m = {exports: {}};
        var r = function(n) { return w[n]; };
        w[n] = c(r, m.exports, m) || m.exports;
      };
})('modules/setup_arguments_task', this));
