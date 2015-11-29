;(function(define) { 'use strict'; define(function(require, exports, module) {
  var instanceCreater = module.exports;

  var utils = require('libs/utils');
  var taskManager = require('modules/task_manager');

  /**
   * Default spec for an argument for the constructor of the class to be
   * registered.
   */
  instanceCreater.DEFAULT_ARGUMENT_SPEC = Object.freeze({
    name: 'arg',
    defaultValue: null,
    defaultAttrsPath: []
  });

  /**
   * Registers a class.
   *
   * @constructor
   *
   * @param {string} className - Name of the class.
   * @param {Array} defaultAttrsPath - The default attrs-path of the var tree
   *     when the user want to store the instance created into the var tree.
   * @param {Function} classConstructor - The constructor of the class.
   * @param {Array} argumentsSpec - The spec object of the arguments.
   */
  instanceCreater.registerClass = function(
      className, defaultAttrsPath, classConstructor, argumentsSpec) {
    utils.iterateArray(argumentsSpec, function(argumentSpec) {
      utils.fillDefaults(argumentSpec, instanceCreater.DEFAULT_ARGUMENT_SPEC);
    });

    instanceCreater._model.addClassInfo(
        className, defaultAttrsPath, classConstructor, argumentsSpec, null);

    instanceCreater._view.addClass(
        className, _enterCreateInstanceTask.bind(this, className));
  };

  /**
   * Creates a task for creating a specific type of instance.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @param {Function} classConstructor - The constructor of the class.
   *
   * @return {Object} A task.
   */
  instanceCreater.createCreateInstanceTask = function(
      taskManagerInterface, classConstructor) {
    var classInfo = instanceCreater._model.getClassInfoByClassConstructor(
        classConstructor);
    return new instanceCreater._controller.CreateInstanceTask(
        taskManagerInterface, classInfo);
  };

  /**
   * Enters a create instance task.
   *
   * If the task is closed, creates it first.
   *
   * @param {string} className - Name of the class of the instance which the
   *     task manage.
   */
  var _enterCreateInstanceTask = function(className) {
    var classInfo = instanceCreater._model.getClassInfoByClassName(className);
    if (!classInfo.task) {
      classInfo.task = _taskManagerInterface.createChildTask(
          _createCreateInstanceTask, [classInfo], className, true,
          function() { classInfo.task = null; });
    }
    _taskManagerInterface.switchToTask(classInfo.task);
  };

  /**
   * Creates a task for creating instance of a specific class.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @param {Object} classInfo - Information about the specific class.
   *
   * @return {instanceCreater._controller.CreateInstanceTask} A task.
   */
  var _createCreateInstanceTask = function(taskManagerInterface, classInfo) {
    return new instanceCreater._controller.CreateInstanceTask(
        taskManagerInterface, classInfo);
  };

  /**
   * Creates a long life task.
   *
   * The long life task here is a page contains number of buttons as entrance of
   * each kind of instance creater.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   *
   * @return {Object} A task.
   */
  var _longLifeTaskCreater = function(taskManagerInterface) {
    _taskManagerInterface = taskManagerInterface;

    return {view: instanceCreater._view.longLifeWindow};
  };

  /**
   * Interface to the task manager of the long life task.
   *
   * @type {Object?}
   * @private
   */
  var _taskManagerInterface = null;

  taskManager.on(taskManager.EVENTS.READY, function() {
    // Creates the long life task.
    taskManager.createCategory(
        'instanceCreater', _longLifeTaskCreater, [], 'Instance Creater');
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
})('modules/instance_creater', this));
