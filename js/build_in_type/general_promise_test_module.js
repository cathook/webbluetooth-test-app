(function(define) { 'use strict'; define(function(require, exports, module) {

  var tmg = require('modules/test_module_generater');
  var varTree = require('modules/var_tree');

  var generalTestModule = require('build_in_type/general_test_module');

  /**
   * A test module for testing data which are instance of `Promise`.
   *
   * Both of the resolve object and the reject reason object are tested
   * by the `generalTestModule`.
   */
  var generalPromiseTestModule = tmg.generatePromiseTestModule(
      ['promise'], generalTestModule, generalTestModule);

  varTree.putValue(generalPromiseTestModule.DEFAULT_ATTRS_PATH, []);

  return generalPromiseTestModule;

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
})('build_in_type/general_promise_test_module', this));
