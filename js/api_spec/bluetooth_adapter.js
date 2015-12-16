;(function(define) { 'use strict'; define(function(require, exports, module) {
  var bluetoothAdapter = module.exports;

  var booleanTestModule = require('build_in_type/boolean_test_module');
  var generalDOMRequestTestModule =
      require('build_in_type/general_dom_request_test_module');
  var nullTestModule = require('build_in_type/null_test_module');
  var stringTestModule = require('build_in_type/string_test_module');

  var common = require('api_spec/common');

  var bluetoothDevice = require('api_spec/bluetooth_device');
  var bluetoothDeviceEvent = require('api_spec/bluetooth_device_event');
  var bluetoothDiscoveryHandle = require('api_spec/bluetooth_discovery_handle');
  var bluetoothPairingListener = require('api_spec/bluetooth_pairing_listener');
  var mediaMetaData = require('api_spec/media_meta_data');
  var mediaPlayStatus = require('api_spec/media_play_status');

  var interfaceSpecs = [{
    state: {type: 'attribute', testModule: stringTestModule},
    address: {type: 'attribute', testModule: common.addressTestModule},
    name: {type: 'attribute', testModule: common.nameTestModule},
    discoverable: {type: 'attribute', testModule: booleanTestModule},
    discovering: {type: 'attribute', testModule: booleanTestModule},
    pairingReqs: {
      type: 'attribute',
      testModules: [bluetoothPairingListener.testModule, nullTestModule]
    },
    a2dpstatuschanged: {type: 'event'},
    hfpstatuschanged: {type: 'event'},
    scostatuschanged: {type: 'event'},
    requestmediaplaystatus: {type: 'event'},
    attributechanged: {type: 'event'},
    devicepaired: {
      type: 'event',
      eventObjectTestModule: bluetoothDeviceEvent.testModule
    },
    deviceunpaired: {
      type: 'event',
      eventObjectTestModule: bluetoothDeviceEvent.testModule
    },
    pairingaborted: {type: 'event'},
    enable: {
      type: 'method',
      returnValueTestModule: common.voidPromiseTestModule
    },
    disable: {
      type: 'method',
      returnValueTestModule: common.voidPromiseTestModule
    },
    setName: {
      type: 'method',
      argsSpec: common.createArgsSpec({name: 'name', defaultValue: ''}),
      returnValueTestModule: common.voidPromiseTestModule
    },
    setDiscoverable: {
      type: 'method',
      argsSpec:
          common.createArgsSpec({name: 'discoverable', defaultValue: false}),
      returnValueTestModule: common.voidPromiseTestModule
    },
    startDiscovery: {
      type: 'method',
      returnValueTestModule: common.generateBasicPromiseTestModule(
          bluetoothDiscoveryHandle.testModule)
    },
    stopDiscovery: {
      type: 'method',
      returnValueTestModule: common.voidPromiseTestModule
    },
    pair: {
      type: 'method',
      argsSpec: common.createArgsSpec({name: 'address', defaultValue: ''}),
      returnValueTestModule: common.voidPromiseTestModule
    },
    unpair: {
      type: 'method',
      argsSpec: common.createArgsSpec({name: 'address', defaultValue: ''}),
      returnValueTestModule: common.voidPromiseTestModule
    },
    getPairedDevices: {
      type: 'method',
      returnValueTestModule:
        common.generateArrayTestModule(bluetoothDevice.testModule)
    },
    getConnectedDevices: {
      type: 'method',
      argsSpec: common.createArgsSpec({name: 'uuid', defaultValue: 0}),
      returnValueTestModule: generalDOMRequestTestModule
    },
    connect: {
      type: 'method',
      argsSpec: common.createArgsSpec(
          {
            name: 'device',
            defaultValue: null,
            defaultAttrsPath: [bluetoothDevice.testModule.DEFAULT_ATTRS_PATH]
          },
          {
            name: 'uuid',
            defaultValue: 0
          }),
      returnValueTestModule: generalDOMRequestTestModule
    },
    disconnect: {
      type: 'method',
      argsSpec: common.createArgsSpec(
          {
            name: 'device',
            defaultValue: null,
            defaultAttrsPath: [bluetoothDevice.testModule.DEFAULT_ATTRS_PATH]
          },
          {
            name: 'uuid',
            defaultValue: 0
          }),
      returnValueTestModule: generalDOMRequestTestModule
    },
    sendFile: {
      type: 'method',
      argsSpec: common.createArgsSpec({name: 'address', defaultValue: ''},
                                      {name: 'blob', defaultValue: null}),
      returnValueTestModule: generalDOMRequestTestModule
    },
    stopSendingFile: {
      type: 'method',
      argsSpec: common.createArgsSpec({name: 'address', defaultValue: ''}),
      returnValueTestModule: generalDOMRequestTestModule
    },
    confirmReceivingFile: {
      type: 'method',
      argsSpec: common.createArgsSpec(
          {name: 'address', defaultValue: ''},
          {name: 'confirmation', defaultValue: true}),
      returnValueTestModule: generalDOMRequestTestModule
    },
    connectSco: {
      type: 'method',
      returnValueTestModule: generalDOMRequestTestModule
    },
    disconnectSco: {
      type: 'method',
      returnValueTestModule: generalDOMRequestTestModule
    },
    isScoConnected: {
      type: 'method',
      returnValueTestModule: generalDOMRequestTestModule
    },
    answerWaitingCall: {
      type: 'method',
      returnValueTestModule: generalDOMRequestTestModule
    },
    ignoreWaitingCall: {
      type: 'method',
      returnValueTestModule: generalDOMRequestTestModule
    },
    toggleCalls: {
      type: 'method',
      returnValueTestModule: generalDOMRequestTestModule
    },
    sendMediaMetaData: {
      type: 'method',
      argsSpec:
          common.createArgsSpec({name: mediaMetaData.NAME, defaultValue: null}),
      returnValueTestModule: generalDOMRequestTestModule
    },
    sendMediaPlayStatus: {
      type: 'method',
      argsSpec: common.createArgsSpec(
          {name: mediaPlayStatus.NAME, defaultValue: null}),
      returnValueTestModule: generalDOMRequestTestModule
    },
  }];

  bluetoothAdapter.testModule = common.generateInterfaceTestModule(
      'BluetoothAdapter',
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
})('api_spec/bluetooth_adapter', this));
