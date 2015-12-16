;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothPairingEvent = module.exports;

  var common = require('api_spec/common');

  var bluetoothPairingHandle =
      require('api_spec/bluetooth_pairing_handle');

  var interfaceSpecs = [{
    deviceName: {type: 'attribute', testModule: common.nameTestModule},
    handle: {
      type: 'attribute',
      testModule: bluetoothPairingHandle.testModule
    }
  }];

  bluetoothPairingEvent.testModule = common.generateInterfaceTestModule(
      'BluetoothPairingEvent',
      common.generateConstantAttributeDescriptionMaintainerClass('deviceName'),
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
})('api_spec/bluetooth_pairing_event', this));
