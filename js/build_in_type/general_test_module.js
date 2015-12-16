;(function(define) { 'use strict'; define(function(require, exports, module) {

  var booleanTestModule = require('build_in_type/boolean_test_module');
  var nullTestModule = require('build_in_type/null_test_module');
  var numberTestModule = require('build_in_type/number_test_module');
  var stringTestModule = require('build_in_type/string_test_module');
  var testModuleUtils = require('modules/test_module_utils');
  var tmg = require('modules/test_module_generater');
  var undefinedTestModule = require('build_in_type/undefined_test_module');
  var varTree = require('modules/var_tree');

  /**
   * A test module for testing data without restricts valid types.
   */
  var generalTestModule = {
    NAME: 'general',

    DEFAULT_ATTRS_PATH: Object.freeze(['GeneralTestData']),

    isTestDataValid: (testData) => true,

    DescriptionMaintainer: (function() {
      var Constructor = function(testData, setDescription) {
        // delegates to the description maintainer of the valid test module
        this._realDescriptionMaintainer =
            new (_getValidTestModule(testData).DescriptionMaintainer)(
                testData, setDescription);
      };
      Constructor.prototype = {
        destroy: function() {
          this._realDescriptionMaintainer.destroy();
        }
      };
      return Constructor;
    })(),

    createTask: function(taskManagerInterface, testData) {
      // delegates to the `createTask` function of the valid test module
      var testModule = _getValidTestModule(testData);
      taskManagerInterface.setName(testModule.NAME);
      return testModule.createTask(taskManagerInterface, testData);
    }
  };

  varTree.putValue(generalTestModule.DEFAULT_ATTRS_PATH, []);

  var _generalArrayTestModule =
      tmg.generateArrayTestModule(['GeneralArray'], generalTestModule);

  varTree.putValue(_generalArrayTestModule.DEFAULT_ATTRS_PATH, []);

  var _generalObjectTestModule =
      tmg.generateObjectTestModule(['GeneralObject'], {}, generalTestModule);

  varTree.putValue(_generalObjectTestModule.DEFAULT_ATTRS_PATH, []);

  /**
   * List of all possible test modules.
   */
  var _possibleTestModules = [
    undefinedTestModule,
    nullTestModule,
    booleanTestModule,
    numberTestModule,
    stringTestModule,
    _generalArrayTestModule,
    _generalObjectTestModule
  ];

  /**
   * Finds the test module which can test the gived test data.
   *
   * @param {Object} testData - The test data.
   *
   * @returns {Object} A test module.
   */
  var _getValidTestModule = function(testData) {
    return testModuleUtils.getValidTestModule(_possibleTestModules, testData);
  };

  return generalTestModule;

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
})('build_in_type/general_test_module', this));
