;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothPairingListener = module.exports;

  var common = require('api_spec/common');

  var bluetoothPairingEvent = require('api_spec/bluetooth_pairing_event');

  var _INTERFACE_NAME = 'BluetoothPairingListener';

  var interfaceSpecs = [{}];
  ['displaypasskey',
   'enterpincode',
   'pairingconfirmation',
   'pairingconsent'].forEach(function(type) {
    interfaceSpecs[0][type + 'req'] = {
      type: 'event',
      eventObjectTestModule: bluetoothPairingEvent.testModule
    };
  });

  bluetoothPairingListener.testModule = common.generateInterfaceTestModule(
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
})('api_spec/bluetooth_pairing_listener', this));
