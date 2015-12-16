;(function(define) { 'use strict'; define(function(require, exports, module) {
  var blob = module.exports;

  var varTree = require('modules/var_tree');

  var common = require('api_spec/common');

  blob.NAME = 'Blob';

  blob.Constructor = Blob;

  var argsSpec = [
    {
      name: 'blobParts',
      defaultValue: null,
      defaultAttrsPath: ['blobParts']
    },
    {
      name: 'options',
      defaultValue: null,
      defaultAttrsPath: ['blobOptions']
    }
  ];

  varTree.putValue(['blobParts'],
                   [
                     ['This is a test string!!!'],
                     ['This is another test string!!!'],
                     ['moew meow moew']
                   ]);

  varTree.putValue(['blobOptions'],
                   [
                     {type: 'text/plain'}
                   ]);

  common.registerExistClass(blob.Constructor, blob.NAME, argsSpec);

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
})('api_spec/blob', this));
