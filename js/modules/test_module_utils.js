(function(define) { 'use strict'; define(function(require, exports, module) {
  var testModuleUtils = module.exports;

  var log = require('modules/log');
  var utils = require('libs/utils');

  /**
   * Gets the valid test module for a specific data from a list of test modules.
   *
   * If the test data is not valid for each of the test modules, it will return
   * a test module to show error messages.
   *
   * @param {Array} testModules - A list of candiate test modules.
   * @param {Object} testData - The test data.
   *
   * @returns {Object} A test module.
   */
  testModuleUtils.getValidTestModule = function(testModules, testData) {
    var validTestModule = testModuleUtils.invalidTypeDataTestModule;
    utils.iterateArray(testModules, function(testModule) {
      if (testModule.isTestDataValid(testData)) {
        validTestModule = testModule;
        return false;
      }
    });
    return validTestModule;
  };

  /**
   * Gets a name string represents to a list of test modules.
   *
   * @param {Array} testModules - A list of test modules.
   *
   * @returns {string} The name string.
   */
  testModuleUtils.getTestModulesName = function(testModules) {
    var ret = '';
    utils.iterateArray(testModules, function(testModule) {
      ret += testModule.NAME + '|';
    });
    return ret.substr(0, ret.length - 1);
  };

  /**
   * Checks whether one of the gived test modules has the `immediateHandle`
   * function.
   *
   * @param {Array} testModules - A list of test modules.
   *
   * @return {boolean} True if one of the gived test modules has the
   * `immediateHandle` function.
   */
  testModuleUtils.checkTestModulesNeedImmediateHandle = function(testModules) {
    var ret = false;
    utils.iterateArray(testModules, function(testModule) {
      if (testModule.needImmediateHandle) {
        ret = true;
        return false;
      }
    });
    return ret;
  };

  /**
   * Appends a log message if test data is invalid to all the test modules.
   *
   * @param {string} name - The name of the test data.
   * @param {Array} testModules - A list of test modules.
   * @param {Object} testData - The test data.
   */
  testModuleUtils.appendLogMessageIfTestDataInvalid =
      function(name, testModules, testData) {
    var invalid = true;
    utils.iterateArray(testModules, function(testModule) {
      if (testModule.isTestDataValid(testData)) {
        invalid = false;
        return false;
      }
    });
    if (invalid) {
      log.appendMessage(
          log.TYPES.WARNING, name + ' is an invalid test data', testData);
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
})('modules/test_module_utils', this));
