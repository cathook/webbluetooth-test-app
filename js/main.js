;(function(define) { 'use strict'; define(function(require) {

  var taskManager = require('modules/task_manager');
  var testModuleUtils = require('modules/test_module_utils');

  var bluetoothManager = require('api_spec/bluetooth_manager');

  taskManager.on(taskManager.EVENTS.READY, function() {
    var testModule = testModuleUtils.getValidTestModule(
        [bluetoothManager.testModule], navigator.mozBluetooth);
    taskManager.createCategory('WebBluetooth API',
                               testModule.createTask, [navigator.mozBluetooth],
                               testModule.NAME);
    taskManager.switchToCategory('WebBluetooth API');
  });

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
