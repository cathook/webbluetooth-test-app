;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothDiscoveryHandle = module.exports;

  var common = require('api_spec/common');

  var bluetoothDeviceEvent = require('api_spec/bluetooth_device_event');

  var _INTERFACE_NAME = 'BluetoothDiscoveryHandle';

  var interfaceSpecs = [{
    devicefound: {
      type: 'event',
      eventObjectTestModule: bluetoothDeviceEvent.testModule
    }
  }];

  bluetoothDiscoveryHandle.testModule = common.generateInterfaceTestModule(
      _INTERFACE_NAME,
      common.generateConstantDescriptionMaintainerClass(_INTERFACE_NAME),
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
})('api_spec/bluetooth_discovery_handle', this));
