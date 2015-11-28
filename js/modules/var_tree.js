(function(define) { 'use strict'; define(function(require, exports, module) {
  var varTree = module.exports;

  var taskManager = require('modules/task_manager');

  /**
   * Puts a value into the global var tree.
   *
   * @param {Array} attrsPath - path of the value.
   * @param {Object} valueToBePut - The value to be put.
   */
  varTree.putValue = function(attrsPath, valueToBePut) {
    var varPointer = new varTree._model.VarPointer(varTree._model.root);
    if (_tryForceMoveForwardTo(varPointer, attrsPath)) {
      varPointer.value = valueToBePut;
    }
  };

  /**
   * Gets a value into the global var tree.
   *
   * @param {Array} attrsPath - path of the value.
   */
  varTree.getValue = function(attrsPath) {
    var varPointer = new varTree._model.VarPointer(varTree._model.root);
    if (_tryMoveForwardTo(varPointer, attrsPath)) {
      return varPointer.value;
    }
  };

  /**
   * Creates a task for editing on the global var tree.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @param {Array} defaultAttrsPath - The default attrs path.
   * @param {boolean} defaultReadOnly - Read only in normal mode or not.
   *
   * @returns {Object} A task.
   */
  varTree.createTaskOnRoot = function(
      taskManagerInterface, defaultAttrsPath, defaultReadOnly) {
    var varPointer = new varTree._model.VarPointer(varTree._model.root);
    _tryMoveForwardTo(varPointer, defaultAttrsPath);

    var viewCreater = function(controller) {
      var view = varTree._view.createVarTreeTaskView(controller);
      view.canSelect = false;
      return view;
    };

    return new varTree._controller.VarTreeTask(
        taskManagerInterface,
        varPointer, viewCreater, false, defaultReadOnly);
  };

  /**
   * Creates a task for editing on a gived object.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @param {Object} rootVar - The root value.
   * @param {boolean} rootResetable - Whether the root value can be reset.
   * @param {boolean} defaultReadOnly - Read only in normal mode or not.
   *
   * @returns {Object} A task.
   */
  varTree.createTaskOnCustomRoot = function(
      taskManagerInterface, rootVar, rootResetable, defaultReadOnly) {
    var varPointer = new varTree._model.VarPointer(rootVar);

    var viewCreater = function(controller) {
      var view = varTree._view.createVarTreeTaskView(controller);
      view.canSelect = false;
      return view;
    };

    return new varTree._controller.VarTreeTask(
        taskManagerInterface,
        varPointer, viewCreater, rootResetable, defaultReadOnly);
  };

  /**
   * Creates a task for getting value from the global var tree.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @param {Array} defaultAttrsPath - The default attrs path.
   * @param {Function} onValueGot - Callback to be called after the value got.
   *
   * @returns {Object} A task.
   */
  varTree.createGetValueTask = function(
      taskManagerInterface, defaultAttrsPath, onValueGot) {
    var varPointer = new varTree._model.VarPointer(varTree._model.root);
    _tryMoveForwardTo(varPointer, defaultAttrsPath);

    var viewCreater = function(controller) {
      var view = varTree._view.createVarTreeTaskView(controller);
      view.canSelect = true;
      return view;
    };

    var onSelect = function(varPointer) {
      onValueGot(varPointer.value);
    };

    return new varTree._controller.VarTreeTask(
        taskManagerInterface,
        varPointer, viewCreater, false, false, onSelect);
  };

  /**
   * Creates a task for putting value into the global var tree.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @param {Array} defaultAttrsPath - The default attrs path.
   * @param {Object} valueToBePut - The value to be put into the var tree.
   *
   * @returns {Object} A task.
   */
  varTree.createPutValueTask = function(
      taskManagerInterface, defaultAttrsPath, valueToBePut) {
    var varPointer = new varTree._model.VarPointer(varTree._model.root);
    _tryMoveForwardTo(varPointer, defaultAttrsPath);

    var viewCreater = function(controller) {
      var view = varTree._view.createVarTreeTaskView(controller);
      view.canSelect = true;
      return view;
    };

    var onSelect = function(varPointer) {
      varPointer.value = valueToBePut;
    };

    return new varTree._controller.VarTreeTask(
        taskManagerInterface,
        varPointer, viewCreater, false, false, onSelect);
  };

  /**
   * Creates a task for resetting a value.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @param {Array} defaultAttrsPath - The default attrs path.
   * @param {Function} onReseted - Called on the value been reseted.
   *
   * @returns {Object} A task.
   */
  varTree.createResetValueTask = function(
      taskManagerInterface, defaultAttrsPath, onReseted) {
    return new varTree._controller.ResetValueTask(
        taskManagerInterface,
        varTree._view.createResetValueTaskView, defaultAttrsPath, onReseted);
  };

  /**
   * Creates the long life task for editing the global var tree.
   *
   * @param {Object} taskManagerInterface - Interface to the task manager.
   * @returns {Object} A task.
   */
  varTree.createLongLifeTask = function(taskManagerInterface) {
    varTree.createLongLifeTask = null;
    var task = varTree.createTaskOnRoot(taskManagerInterface, [], false);

    Object.defineProperty(varTree, 'longLifeTask', {
      get: function() { return task; }
    });

    return task;
  };

  var _tryForceMoveForwardTo = function(varPointer, attrsPath) {
    for (var i = 0; i < attrsPath.length; ++i) {
      if (!varPointer.moveForward(attrsPath[i])) {
        if (varPointer.value instanceof Object) {
          try {
            varPointer.value[attrsPath[i]] = {};
          } catch (e) {
            return false;
          }
        } else {
          return false;
        }
        varPointer.moveForward(attrsPath[i]);
      }
    }
    return true;
  };

  var _tryMoveForwardTo = function(varPointer, attrsPath) {
    for (var i = 0; i < attrsPath.length; ++i) {
      if (!varPointer.moveForward(attrsPath[i])) {
        return false;
      }
    }
    return true;
  };

  taskManager.on(taskManager.EVENTS.READY, function() {
    taskManager.createCategory(
        'varTree', varTree.createLongLifeTask, [], 'Global Var Tree');
  });

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
})('modules/var_tree', this));
