;(function(define) { 'use strict'; define(function(require) {
  var testModuleGenerater = require('modules/test_module_generater');

  var dmm = require('modules/description_maintainer_material');
  var testTaskMaterial = require('modules/test_task_material');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  /**
   * Generates a test module for testing a primitive data of a specified type.
   *
   * @param {string} typeString - Type of the data.
   * @param {string} taskName - The task name of the test task.
   * @param {Array} defaultAttrsPath - The default attrs-path of the global var
   *     tree if the user want to save the data into the global var tree.
   *
   * @returns {Object} A test module.
   */
  testModuleGenerater.generatePrimitiveTestModule = function(
      typeString, taskName, defaultAttrsPath) {

    var _Model = function(testData) {
      this._elements = {
        type: {
          identifier: 'type',
          index: 0,
          type: 'attribute',
          name: 'Type',
          description: typeString
        },
        value: {
          identifier: 'value',
          index: 1,
          type: 'attribute',
          name: 'Value',
          value: testData
        }
      };
    };

    _Model.prototype = Object.setPrototypeOf({
      destroy: function() {
        this._elements = null;
      },

      orderedIterate: function(callback) {
        ['type', 'value'].forEach(callback);
      },

      get elements() {
        return this._elements;
      },

      get editable() {
        return false;
      }
    }, testTaskMaterial.ModelInterface.prototype);

    var _Controller = function(model, taskManagerInterface) {
      this._model = model;
      this._taskManagerInterface = taskManagerInterface;
    };

    _Controller.prototype = Object.setPrototypeOf({
      destroy: function() {
        this._model = null;
        this._taskManagerInterface = null;
      },

      saveToVarTree: function() {
        var value = this._model.elements.value.value;
        this._taskManagerInterface.createPopupTask(
            varTree.createPutValueTask, [defaultAttrsPath, value], true);
      }
    }, testTaskMaterial.ControllerInterface.prototype);

    return {
      get NAME() {
        return taskName;
      },

      get DEFAULT_ATTRS_PATH() {
        return defaultAttrsPath;
      },

      isTestDataValid: function(testData) {
        return utils.typeToString(testData) == typeString;
      },

      DescriptionMaintainer:
          dmm.generateConstantDescriptionMaintainerClass(utils.valueToString),

      createTask: function(taskManagerInterface, testData) {
        var model = new _Model(testData);
        var controller = new _Controller(model, taskManagerInterface);
        var view = new testTaskMaterial.View(controller, model);

        return {
          get view() {
            return view.container;
          },

          destroy: function() {
            model.destroy();
            controller.destroy();
            view.destroy();

            model = null;
            controller = null;
            view = null;
          }
        };
      }
    };
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
