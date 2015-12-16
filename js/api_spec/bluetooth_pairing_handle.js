;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothPairingHandle = module.exports;

  var common = require('api_spec/common');

  var interfaceSpecs = [{
    passkey: {type: 'attribute', testModule: common.passkeyTestModule},
    setPinCode: {
      type: 'method',
      argsSpec: common.createArgsSpec({name: 'pinCode', defaultValue: ''}),
      returnValueTestModule: common.voidPromiseTestModule
    },
    accept: {
      type: 'method',
      returnValueTestModule: common.voidPromiseTestModule
    },
    reject: {
      type: 'method',
      returnValueTestModule: common.voidPromiseTestModule
    }
  }];

  bluetoothPairingHandle.testModule = common.generateInterfaceTestModule(
      'BluetoothPairingHandle',
      common.generateConstantAttributeDescriptionMaintainerClass('passkey'),
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
})('api_spec/bluetooth_pairing_handle', this));
