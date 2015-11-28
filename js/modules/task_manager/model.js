;(function(define) { 'use strict'; define(function(require) {
  var taskManager = require('modules/task_manager');

  var utils = require('libs/utils');

  taskManager._model = {};

  /**
   * Stores a task's information.
   *
   * @param {string} taskId - An unique task id.
   * @param {Object} taskInstance - Instance of the task.
   * @param {HTMLElement} container - Container for the `taskInstance.view`.
   * @param {boolean} canBeKilledByUser - Whether the task can be killed by the
   *     user or not.
   * @param {Function} onKilled - Handler for onkill event.
   */
  var _TaskInfo = function(
      taskId, taskInstance, container, canBeKilledByUser, onKilled) {
    this.taskId = taskId;
    this.taskInstance = taskInstance;
    this.container = container;
    this.canBeKilledByUser = canBeKilledByUser;
    this.onKilled = onKilled;
  };

  /**
   * Initializes.
   */
  taskManager._model.init = function() {
    _taskInfos = {};
    _uniqueId = 0;
  };

  /**
   * Gets the task information by specifying the task instance.
   *
   * @param {Object} taskInstance - The task instance.
   *
   * @returns {_TaskInfo?} The task information.
   */
  taskManager._model.getTaskInfoByTaskInstance = function(taskInstance) {
    var ret = null;
    utils.iterateDict(_taskInfos, function(taskId, taskInfo) {
      if (taskInfo.taskInstance === taskInstance) {
        ret = taskInfo;
        return false;
      }
    });
    return ret;
  };

  /**
   * Gets the task information by specifying the container.
   *
   * @param {HTMLElement} container - The container.
   *
   * @returns {_TaskInfo?} The task information.
   */
  taskManager._model.getTaskInfoByContainer = function(container) {
    var ret = null;
    utils.iterateDict(_taskInfos, function(taskId, taskInfo) {
      if (taskInfo.container === container) {
        ret = taskInfo;
        return false;
      }
    });
    return ret;
  };

  /**
   * Gets the task information by specifying the task id.
   *
   * @param {HTMLElement} taskId - The task id.
   *
   * @returns {_TaskInfo?} The task information.
   */
  taskManager._model.getTaskInfoByTaskId = function(taskId) {
    return _taskInfos[taskId];
  };

  /**
   * Gets an unique task id.
   *
   * @returns {string} An unique string.
   */
  taskManager._model.getUniqueTaskId = function() {
    ++_uniqueId;
    return '' + _uniqueId;
  };

  /**
   * Stores a task with its relatived information.
   *
   * @param {string} taskId - An unique task id.
   * @param {Object} taskInstance - Instance of the task.
   * @param {HTMLElement} container - Container for the `taskInstance.view`.
   * @param {boolean} canBeKilledByUser - Whether the task can be killed by the
   *     user or not.
   * @param {Function} onKilled - Handler for onkill event.
   */
  taskManager._model.addTaskInfo = function(
      taskId, taskInstance, container, canBeKilledByUser, onKilled) {
    _taskInfos[taskId] = new _TaskInfo(
        taskId, taskInstance, container, canBeKilledByUser, onKilled);

    return _taskInfos[taskId];
  };

  /**
   * Removes a task from the memory.
   */
  taskManager._model.removeTaskInfo = function(taskInfo) {
    _taskInfos[taskInfo.taskId] = null;
    delete _taskInfos[taskInfo.taskId];
  };

  var _taskInfos = null;
  var _uniqueId = null;

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
