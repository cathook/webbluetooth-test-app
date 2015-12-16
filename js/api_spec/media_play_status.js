;(function(define) { 'use strict'; define(function(require, exports, module) {
  var mediaPlayStatus = module.exports;

  var common = require('api_spec/common');

  var _argsSpec = [
    {name: 'duration', defaultValue: -1},
    {name: 'position', defaultValue: -1},
    {name: 'playStatus', defaultValue: ''}
  ];

  mediaPlayStatus.NAME = 'MediaPlayStatus';

  mediaPlayStatus.Constructor =
      common.registerStruct(mediaPlayStatus.NAME, _argsSpec);

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
})('api_spec/media_play_status', this));
