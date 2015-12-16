;(function(define) { 'use strict'; define(function(require, exports, module) {
  var mediaMetaData = module.exports;

  var common = require('api_spec/common');

  var _argsSpec = [
    {name: 'title', defaultValue: ''},
    {name: 'artist', defaultValue: ''},
    {name: 'album', defaultValue: ''},
    {name: 'mediaNumber', defaultValue: -1},
    {name: 'totalMediaCount', defaultValue: -1},
    {name: 'duration', defaultValue: -1}
  ];

  mediaMetaData.NAME = 'MediaMetaData';

  mediaMetaData.Constructor =
      common.registerStruct(mediaMetaData.NAME, _argsSpec);

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
})('api_spec/media_meta_data', this));
