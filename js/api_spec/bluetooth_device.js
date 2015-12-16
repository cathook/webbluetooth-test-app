;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothDevice = module.exports;

  var booleanTestModule = require('build_in_type/boolean_test_module');
  var stringTestModule = require('build_in_type/string_test_module');

  var common = require('api_spec/common');

  var bluetoothClassOfDevice = require('api_spec/bluetooth_class_of_device');

  var interfaceSpecs = [{
    address: {type: 'attribute', testModule: common.addressTestModule},
    cod: {type: 'attribute', testModule: bluetoothClassOfDevice.testModule},
    name: {type: 'attribute', testModule: common.nameTestModule},
    paired: {type: 'attribute', testModule: booleanTestModule},
    uuids: {type: 'attribute', testModule: common.uuidsTestModule},
    type: {type: 'attribute', testModule: stringTestModule},
    attributechanged: {type: 'event'},
    fetchUuids: {type: 'method', returnValueTestModule: common.uuidsTestModule}
  }];

  bluetoothDevice.testModule = common.generateInterfaceTestModule(
      'BluetoothDevice',
      common.generateNonConstantAttributeDescriptionMaintainerClass('name'),
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
})('api_spec/bluetooth_device', this));
