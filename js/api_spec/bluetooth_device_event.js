;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothDeviceEvent = module.exports;

  var testModuleUtils = require('modules/test_module_utils');

  var nullTestModule = require('build_in_type/null_test_module');

  var common = require('api_spec/common');

  var bluetoothDevice = require('api_spec/bluetooth_device');

  var deviceTestModules = [bluetoothDevice.testModule, nullTestModule];

  var interfaceSpecs = [{
    device: {
      type: 'attribute',
      testModules: deviceTestModules
    },
    address: {
      type: 'attribute',
      testModules: [common.addressTestModule, nullTestModule]
    }
  }];

  var DescriptionMaintainer = function(testTarget, setDescription) {
    var testModule = new testModuleUtils.getValidTestModule(deviceTestModules,
                                                            testTarget.device);
    this._realDescriptionMaintainer =
        new testModule.DescriptionMaintainer(testTarget.device, setDescription);
  };

  DescriptionMaintainer.prototype = {
    destroy: function() {
      this._realDescriptionMaintainer.destroy();
      this._realDescriptionMaintainer = null;
    }
  };

  bluetoothDeviceEvent.testModule = common.generateInterfaceTestModule(
      'BluetoothDeviceEvent',
      DescriptionMaintainer,
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
})('api_spec/bluetooth_device_event', this));
