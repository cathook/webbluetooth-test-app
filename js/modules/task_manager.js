;(function(define) { 'use strict'; define(function(require, exports, module) {
  var evt = require('evt');
  var utils = require('libs/utils');

  var taskManager = evt({});

  taskManager.EVENTS = new utils.Enum({
    /**
     * Fired on the moment that the whole module is ready for use.
     */
    READY: 'ready'
  });

  /**
   * Switch the category to the specified one.
   *
   * @param {string} categoryName - Name of the category to be put into
   *     foreground.
   */
  taskManager.switchToCategory = function(categoryName) {
    taskManager._view.switchToCategory(categoryName);
  };

  /**
   * Creates a new category.
   *
   * @param {string} categoryName - Name of the new category.
   * @param {Function} taskCreater - Creater of the task.
   * @param {Array} args - Arguments for the taskCreater,
   * @param {string} taskName - Name of the task.
   *
   * @returns {Object} A task.
   */
  taskManager.createCategory = function(
      categoryName, taskCreater, args, taskName) {
    return _setupTask(taskManager._view.createCategory(categoryName),
                      taskCreater, args, taskName,
                      false, utils.noOperation);
  };

  /**
   * Creates a lone life popup task.
   *
   * @param {Function} taskCreater - Creater of the task.
   * @param {Array} args - Arguments for the taskCreater,
   *
   * @returns {Object} A task.
   */
  taskManager.createPopupTask = function(taskCreater, args) {
    return _setupTask(taskManager._view.createPopupPage(),
                      taskCreater, args, '',
                      false, utils.noOperation);
  };

  /**
   * Switches to the specified task.
   *
   * @param {Object} task - The task to be put into foreground.
   */
  taskManager.switchToTask = function(task) {
    var taskInfo = taskManager._model.getTaskInfoByTaskInstance(task);
    taskInfo.container.switchToForeground();
  };

  /**
   * Throws a notification to the user.
   *
   * @param {string} message - The notification message.
   */
  taskManager.throwNotification = function(message) {
    taskManager._view.throwNotification(message);
  };

  /**
   * Handles the close task operation caused by the user.
   */
  taskManager._containerCloseButtonClicked = function(container) {
    var taskInfo = taskManager._model.getTaskInfoByContainer(container);
    if (taskInfo.canBeKilledByUser) {
      _killTaskByTaskInfo(taskInfo);
    }
  };

  /**
   * Shows the log task.
   */
  taskManager._showLog = function() {
    taskManager.switchToTask(_logTask);
  };

  /**
   * An interface for the task, which supply each task some methods.
   */
  var _InterfaceForTask = function(taskId) {
    this._taskId = taskId;
  };

  _InterfaceForTask.prototype = {
    /**
     * Creates a child task.
     *
     * @param {Function} taskCreater - Creater of the child task.
     * @param {Array} args - Arguments for the creater.
     * @param {string} taskName - Name of the new task.
     * @param {bool} canBeKilledByUser - Whether this task can be killed by the
     *     user or not.
     * @param {Function} onKilled - The callback function to run at the end of
     *     the task.
     */
    createChildTask: function(
        taskCreater, args, taskName, canBeKilledByUser, onKilled) {
      var taskInfo = taskManager._model.getTaskInfoByTaskId(this._taskId);
      return _setupTask(taskManager._view.createChildPage(taskInfo.container),
                        taskCreater, args, taskName,
                        canBeKilledByUser, onKilled || utils.noOperation);
    },

    /**
     * Creates a same generation task.
     *
     * @param {Function} taskCreater - Creater of the child task.
     * @param {Array} args - Arguments for the creater.
     * @param {string} taskName - Name of the new task.
     * @param {bool} canBeKilledByUser - Whether this task can be killed by the
     *     user or not.
     * @param {Function} onKilled - The callback function to run at the end of
     *     the task.
     */
    createBrotherTask: function(
        taskCreater, args, taskName, canBeKilledByUser, onKilled) {
      var taskInfo = taskManager._model.getTaskInfoByTaskId(this._taskId);
      return _setupTask(taskManager._view.createBrotherPage(taskInfo.container),
                        taskCreater, args, taskName,
                        canBeKilledByUser, onKilled || utils.noOperation);
    },

    /**
     * Creates a popup task.
     *
     * @param {Function} taskCreater - Creater of the child task.
     * @param {Array} args - Arguments for the creater.
     * @param {bool} immediateKilledWhenClosed - Whether this task will be
     *     killed if the use click the side of the task.
     * @param {Function} onKilled - The callback function to run at the end of
     *     the task.
     */
    createPopupTask: function(
        taskCreater, args, immediateKilledWhenClosed, onKilled) {
      return _setupTask(taskManager._view.createPopupPage(),
                        taskCreater, args, '',
                        immediateKilledWhenClosed,
                        onKilled || utils.noOperation);
    },

    /**
     * Kills a task.
     *
     * @param {Object} task - The task to kill.
     */
    killTask: function(task) {
      _killTaskByTaskInfo(taskManager._model.getTaskInfoByTaskInstance(task));
    },

    switchToTask: function(task) { taskManager.switchToTask(task); },

    /**
     * Exits the task.
     */
    exit: function() {
      _killTaskByTaskInfo(taskManager._model.getTaskInfoByTaskId(this._taskId));
    },

    /**
     * Replaces the current task with another task.
     *
     * @param {Function} taskCreater - Creater of the new task.
     * @param {Array} args - Arguments for the creater.
     */
    exec: function(taskCreater, args) {
      var taskInfo = taskManager._model.getTaskInfoByTaskId(this._taskId);

      var oldTask = taskInfo.taskInstance;
      var newTask = taskCreater.apply(window, [this].concat(args));

      var oldOnKilled = taskInfo.onKilled;

      taskInfo.taskInstance = newTask;
      taskInfo.container.attach(newTask.view);
      taskInfo.onKilled = function() {
        oldTask.destroy();
        oldOnKilled(oldTask);
      };
    },

    /**
     * Set this task's name.
     *
     * @param {string} name - The new name of the task.
     */
    setName: function(name) {
      var taskInfo = taskManager._model.getTaskInfoByTaskId(this._taskId);
      taskInfo.container.title = name;
    }
  };

  /**
   * A simple wrapper which can auto restart a task if it was killed.
   *
   * @constructor
   *
   * @param {Object} taskCreater - Creater of the task.
   */
  taskManager.SmartRestartTaskManager = function(taskCreater) {
    this._taskCreater;
    this._task = null;
  };

  taskManager.SmartRestartTaskManager.prototype = {
    /**
     * @returns {Object} The task.
     */
    get task() {
      if (this._task === null) {
        var onKilled = (function(task) {
          if (task === this._task) {
            this._task = null;
          }
        }).bind(this);
        this._task = this._taskCreater(onKilled);
      }
      return this._task;
    },

    /**
     * Forces to restart the task next time.
     */
    notifyNeedRestart: function() {
      this._task = null;
    }
  };

  var _setupTask = function(
      container, taskCreater, args, taskName, canBeKilledByUser, onKilled) {
    var taskId = taskManager._model.getUniqueTaskId();

    var taskInfo = taskManager._model.addTaskInfo(
        taskId, null, container, canBeKilledByUser, onKilled);

    container.title = taskName;

    var interfaceForTask = new _InterfaceForTask(taskId);
    taskInfo.taskInstance =
        taskCreater.apply(this, [interfaceForTask].concat(args));

    container.attach(taskInfo.taskInstance.view);

    if (taskInfo.taskInstance.attached instanceof Function) {
      taskInfo.taskInstance.attached();
    }

    return taskInfo.taskInstance;
  };

  var _killTaskByTaskInfo = function(taskInfo) {
    taskInfo.container.detach();
    taskInfo.container.destroy();

    if (taskInfo.taskInstance.destroy instanceof Function) {
      taskInfo.taskInstance.destroy();
    }

    taskInfo.onKilled(taskInfo.taskInstance);

    taskManager._model.removeTaskInfo(taskInfo);
  };

  var _logTask = null;

  /**
   * Initializes the whole module.
   */
  window.addEventListener('load', function() {
    taskManager._model.init();
    taskManager._view.init();

    var log = require('modules/log');

    // Creates long life log task.
    _logTask = (function() {
      var logTask = taskManager.createPopupTask(log.createLongLifeTask, []);
      var container =
        taskManager._model.getTaskInfoByTaskInstance(logTask).container;
      container.switchToBackground();
      return logTask;
    })();

    taskManager.fire(taskManager.EVENTS.READY);
  });

  return taskManager;

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
})('modules/task_manager', this));
