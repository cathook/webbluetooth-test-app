;(function(define) { 'use strict'; define(function(require) {
  var instanceCreater = require('modules/instance_creater');

  var log = require('modules/log');
  var setupArgumentsTask = require('modules/setup_arguments_task');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  instanceCreater._controller = {};

  /**
   * Task for creating a specific class.
   *
   * @constructor
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @param {Object} classInfo - Information about the class.
   */
  instanceCreater._controller.CreateInstanceTask =
      function(taskManagerInterface, classInfo) {
    this._taskManagerInterface = taskManagerInterface;
    this._view = instanceCreater._view.createCreateInstanceTaskView(
        classInfo.className, this);
    this._classInfo = classInfo;

    this._args = [];
    this._argsName = [];

    utils.iterateArray(this._classInfo.argumentsSpec, function(argumentSpec) {
      this._argsName.push(argumentSpec.name);
    }, this);

    this.resetArgs();
  };

  instanceCreater._controller.CreateInstanceTask.prototype = {
    get view() { return this._view; },

    destroy: function() {
      this._taskManagerInterface = null;
      this._view = null;
      this._args = null;
      this._argsName = null;
      this._classInfo = null;
    },

    /**
     * Resets the arguments for the constructor to defaults.
     */
    resetArgs: function() {
      this._args = [];
      utils.iterateArray(this._classInfo.argumentsSpec, function(argumentSpec) {
        this._args.push(argumentSpec.defaultValue);
      }, this);
      this._resetViewArgs();
    },

    /**
     * Setups the arguments by a setup-arguments-task.
     */
    setupArgs: function() {
      this._taskManagerInterface.createPopupTask(
          setupArgumentsTask.createTask,
          [this._classInfo.argumentsSpec, this._args],
          true, this._resetViewArgs.bind(this));
    },

    /**
     * Creates the instance of the class.
     */
    createInstance: function() {
      var instance = null;
      try {
        var constructor =
            Function.prototype.bind.apply(this._classInfo.classConstructor,
                                          [null].concat(this._args));
        instance = new constructor();
      } catch (e) {
        var ee = e instanceof window.Error ? utils.cloneError(e) : e;
        log.appendMessage(log.TYPES.ERROR,
                          'Exception cought while creating an instance of ' +
                          this._classInfo.className,
                          ee);
        return;
      }
      this._taskManagerInterface.createPopupTask(
          varTree.createPutValueTask,
          [this._classInfo.defaultAttrsPath, instance], true);
    },

    /**
     * Resets the view's arguments list.
     */
    _resetViewArgs: function() {
      var argsSpec = [];
      var i;
      for (i = 0; i < Math.min(this._args.length, this._argsName.length); ++i) {
        argsSpec.push({name: this._argsName[i], value: this._args[i]});
      }
      for (; i < this._args.length; ++i) {
        argsSpec.push({name: 'arg' + i, value: this._args[i]});
      }
      this._view.resetArguments(argsSpec);
    }
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
