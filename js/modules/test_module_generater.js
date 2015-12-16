;(function(define) { 'use strict'; define(function(require, exports, module) {
  var testModuleGenerater = module.exports;

  /**
   * Wraps the gived object into an array if it is not an instance of array.
   *
   * @param {Object} arr - The gived object.
   *
   * @returns {Array} An array with only element be the gived object if that
   *     object is not an Array;  otherwise just returns the object without
   *     modified.
   */
  testModuleGenerater._wrapIntoArrayIfNeed = function(arr) {
    if (arr instanceof Array) {
      return arr;
    }
    return [arr];
  };

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
})('modules/test_module_generater', this));
