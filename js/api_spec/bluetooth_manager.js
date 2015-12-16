;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothManager = module.exports;

  var nullTestModule = require('build_in_type/null_test_module');

  var common = require('api_spec/common');

  var bluetoothAdapter = require('api_spec/bluetooth_adapter');

  var interfaceSpecs = [{
    defaultAdapter: {
      type: 'attribute',
      testModules: [bluetoothAdapter.testModule, nullTestModule]
    },
    attributechanged: {type: 'event'},
    adapteradded: {type: 'event'},
    adapterremoved: {type: 'event'},
    getAdapters: {
      type: 'method',
      returnValueTestModule:
          common.generateArrayTestModule(bluetoothAdapter.testModule)
    }
  }];

  bluetoothManager.testModule = common.generateInterfaceTestModule(
      'BluetoothManager',
      common.generateNonConstantAttributeDescriptionMaintainerClass(
          'defaultAdapter'),
      interfaceSpecs,
      common.simplePreproc,
      common.AutoRefreshAttributeMetaController);

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
})('api_spec/bluetooth_manager', this));
