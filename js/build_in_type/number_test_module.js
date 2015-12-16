(function(define) { 'use strict'; define(function(require, exports, module) {

  var tmg = require('modules/test_module_generater');
  var varTree = require('modules/var_tree');

  var _TYPE_STRING = 'number';

  /**
   * A test module which can test (or to say, display) a number type data.
   */
  var numberTestModule =
      tmg.generatePrimitiveTestModule(
          _TYPE_STRING, _TYPE_STRING, [_TYPE_STRING]);

  varTree.putValue(numberTestModule.DEFAULT_ATTRS_PATH, []);

  return numberTestModule;

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
})('build_in_type/number_test_module', this));
