(function(define) { 'use strict'; define(function(require) {
  var testModuleUtils = require('modules/test_module_utils');

  var dmm = require('modules/description_maintainer_material');
  var testTaskMaterial = require('modules/test_task_material');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  var _DEFAULT_ATTRS_PATH = Object.freeze(['invalidTestData']);
  varTree.putValue(_DEFAULT_ATTRS_PATH, []);

  var _Model = function(testData, testModules) {
    this._testData = testData;
    this._numElements = 0;
    this._elements = {};

    this._allocAttribute('Error').description =
        this._getErrorMessage(testModules);
    this._allocAttribute('Value').value = testData;
  };

  _Model.prototype = Object.setPrototypeOf({
    destroy: function() {
      this._testData = null;
      this._elements = null;
    },

    orderedIterate: function(callback) {
      ['Error', 'Value'].forEach(callback);
    },

    get elements() {
      return this._elements;
    },

    get editable() {
      return false;
    },

    get testData() {
      return this._testData;
    },

    _allocAttribute: function(name) {
      this._elements[name] = {
        identifier: name,
        name: name,
        index: this._numElements,
        type: 'attribute',
      };
      this._numElements += 1;
      return this._elements[name];
    },

    _getErrorMessage: function(testModules) {
      var errorMessage = 'The test data is not valid';
      if (testModules.length > 0) {
        errorMessage += ' to the all test modules: ';
        for (var i = 0; i < testModules.length; ++i) {
          errorMessage += testModules[i].NAME;
          if (i + 1 < testModules.length) {
            errorMessage += ', ';
          }
        }
      }
      errorMessage += '.';
      return errorMessage;
    }
  }, testTaskMaterial.ModelInterface.prototype);

  var _Controller = function(taskManagerInterface, model) {
    this._taskManagerInterface = taskManagerInterface;
    this._model = model;
  };

  _Controller.prototype = Object.setPrototypeOf({
    destroy: function() {
      this._taskManagerInterface = null;
      this._model = null;
    },

    saveToVarTree: function() {
      this._taskManagerInterface.createPopupTask(
          varTree.createPutValueTask,
          [_DEFAULT_ATTRS_PATH, this._model.testData], true);
    }
  }, testTaskMaterial.ControllerInterface.prototype);

  /**
   * A test module for displaying error message about an invalid test data.
   *
   * @type {Object}
   */
  testModuleUtils.invalidTypeDataTestModule = {
    get NAME() {
      return 'Invalid Test Data';
    },

    get DEFAULT_ATTRS_PATH() {
      return _DEFAULT_ATTRS_PATH;
    },

    isTestDataValid: function(testData) {
      return true;
    },

    DescriptionMaintainer:
        dmm.generateConstantDescriptionMaintainerClass(
            function(testData) {
              return '[invalid] ' + utils.valueToSimpleString(testData);
            }),

    createTask: function(taskManagerInterface, testData, testModules) {
      testModules = testModules || [];

      var model = new _Model(testData, testModules);
      var controller = new _Controller(taskManagerInterface, model);
      var view = new testTaskMaterial.View(controller, model);

      return {
        get view() {
          return view.container;
        },

        destroy: function() {
          view.destroy();
          controller.destroy();
          model.destroy();

          model = null;
          controller = null;
          view = null;
        }
      };
    }
  };

}); })((function(w) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(n) { return w[n]; }); };
})(this));
