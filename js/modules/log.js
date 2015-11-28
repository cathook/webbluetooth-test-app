;(function(define) { 'use strict'; define(function(require, exports, module) {
  var log = module.exports;

  var taskManager = require('modules/task_manager');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  /**
   * Types of the log messages.
   */
  log.TYPES = new utils.Enum({
    /**
     * Just for notification.
     */
    INFO: 'INFO',

    /**
     * A warning.
     */
    WARNING: 'WARNING',

    /**
     * Some error occured.
     */
    ERROR: 'ERROR'
  });

  /**
   * Appends a log message.
   *
   * @param {string} type - Type of the message.
   * @param {string} message - The message.
   * @param {Object?} detailObj - Detail object.
   */
  log.appendMessage = function(type, message, detailObj) {
    var msgRow = log._view.appendLogMessage(type, message);

    msgRow.addEventListener(msgRow.EVENTS.REMOVE, function() {
      log._view.removeMessage(msgRow);
    });

    if (detailObj !== undefined) {
      var objIndex = _objs.length;
      var task = null;
      _objs.push(detailObj);
      msgRow.addEventListener(msgRow.EVENTS.ENTER, function() {
        if (!task) {
          task = _taskManagerInterface.createPopupTask(
              varTree.createTaskOnCustomRoot, [_objs[objIndex], true, false],
              true, function() { task = null; });
        } else {
          _taskManagerInterface.switchToTask(task);
        }
      });
    }

    var shortMessage =
        message.length > 10 ? message.substring(0, 7) + '...' : message;
    taskManager.throwNotification('[log] received: ' + shortMessage);
  };

  /**
   * Creates the only log displayer task.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   */
  log.createLongLifeTask = function(taskManagerInterface) {
    _taskManagerInterface = taskManagerInterface;

    // Removes this function because it can be called once.
    log.createLongLifeTask = null;

    return {
      view: log._view.logWindow
    };
  };

  var _objs = [];

  var _ATTRS_PATH = Object.freeze(['logObjects']);

  var _taskManagerInterface = null;

  varTree.putValue(_ATTRS_PATH, _objs);

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
})('modules/log', this));
