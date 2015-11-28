;(function(define) { 'use strict'; define(function(require) {
  var log = require('modules/log');

  var logComponent = require('libs/log_message');

  log._view = {};

  /**
   * Appends a message.
   *
   * @param {string} type - The message type.
   * @param {string} message - The message content.
   *
   * @returns {logComponent.LogMessage} A log message.
   */
  log._view.appendLogMessage = function(type, message) {
    var a = document.createElement('a');
    var messageRow = new logComponent.LogMessage();
    messageRow.prefix = logComponent.PREFIX[type];
    messageRow.content = message;

    a.appendChild(messageRow);

    log._view.logWindow.appendChild(a);

    return messageRow;
  };

  /**
   * Removes a message row.
   *
   * @param {logComponent.LogMessage} messageRow - A log message row.
   */
  log._view.removeMessage = function(messageRow) {
    log._view.logWindow.removeChild(messageRow.parentElement);
  };

  /**
   * HTMLElement for log message rows.
   *
   * @type {HTMLElement?}
   */
  log._view.logWindow = (function() {
    var list = document.createElement('gaia-list');

    list.style['max-height'] = '400px';
    list.style['max-width'] = '300px';
    list.style.overflow = 'auto';

    return list;
  })();

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
