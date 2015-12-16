;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothClassOfDevice = module.exports;

  var common = require('api_spec/common');

  var tms = {};
  ['majorServiceClass', 'majorDeviceClass', 'minorDeviceClass'].forEach(
      function(a) { tms[a] = common.generateBasicTestModule(a, 'number'); });

  var interfaceSpecs = [{
    majorServiceClass: {type: 'attribute', testModule: tms.majorServiceClass},
    majorDeviceClass: {type: 'attribute', testModule: tms.majorDeviceClass},
    minorDeviceClass: {type: 'attribute', testModule: tms.minorDeviceClass}
  }];

  bluetoothClassOfDevice.testModule = common.generateInterfaceTestModule(
      'BluetoothClassOfDevice',
      common.generateConstantAttributeDescriptionMaintainerClass(
          'majorServiceClass'),
      interfaceSpecs,
      common.simplePreproc,
      common.VoidMetaController);

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
})('api_spec/bluetooth_class_of_device', this));
