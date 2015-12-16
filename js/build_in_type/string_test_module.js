(function(define) { 'use strict'; define(function(require, exports, module) {

  var tmg = require('modules/test_module_generater');
  var varTree = require('modules/var_tree');

  var _TYPE_STRING = 'string';

  /**
   * A test module which can test (or to say, display) a string type data.
   */
  var stringTestModule =
      tmg.generatePrimitiveTestModule(
          _TYPE_STRING, _TYPE_STRING, [_TYPE_STRING]);

  varTree.putValue(stringTestModule.DEFAULT_ATTRS_PATH, []);

  return stringTestModule;

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
})('build_in_type/string_test_module', this));
