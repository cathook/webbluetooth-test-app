;(function(define) { 'use strict'; define(function(require, exports, module) {

  var tgm = require('modules/test_module_generater');
  var dmm = require('modules/description_maintainer_material');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  /**
   * Creates an object which maintains the description of an `Error` type data.
   *
   * It will fetch the attribute `message` from the test data.
   *
   * @class
   */
  var _DescriptionMaintainer =
      dmm.generateConstantDescriptionMaintainerClass(
          function(testData) {
            return 'message=' + utils.valueToString(testData.message);
          });

  var _interfaceSpec = [{
    message: {type: 'attribute'},
    name: {type: 'attribute'},
    fileName: {type: 'attribute'},
    lineNumber: {type: 'attribute'},
    columnNumber: {type: 'attribute'},
    stack: {type: 'attribute'},

    toSource: {type: 'method'},
    toString: {type: 'method'}
  }];

  /**
   * A test module which tests data which are instances of `Error`.
   */
  var errorTestModule = tgm.generateInterfaceTestModule(
      (testData) => testData instanceof window.Error,
      'Error',
      ['Error'],
      _DescriptionMaintainer,
      _interfaceSpec,
      (testData) => [testData],
      utils.createVoidClass('destroy'));

  varTree.putValue(errorTestModule.DEFAULT_ATTRS_PATH, []);

  return errorTestModule;

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
})('build_in_type/error_test_module', this));
