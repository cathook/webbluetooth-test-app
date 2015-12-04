;(function(define) { 'use strict'; define(function(require, exports, module) {
  var dmm = module.exports;

  var utils = require('libs/utils');

  /**
   * Generates a `DescriptionMaintainer` which will sets the description as a
   * constant.
   *
   * @param {Function} descriptionGetter - A function to get the description
   *     text from the first argument.
   *
   * @returns {Function} A constructor of the description maintainer class.
   */
  dmm.generateConstantDescriptionMaintainerClass = function(descriptionGetter) {
    var Constructor = function(data, setDescription) {
      setDescription(descriptionGetter(data));
    };

    Constructor.prototype = {
      destroy: utils.noOperation
    };

    return Constructor;
  };

  /**
   * Generates a description maintainer which will updates the description
   * if a specific event was triggered from the data.
   *
   * @param {string} eventName - The name of the event.
   * @param {Function} eventHandler - The handler function for handling the
   *     event object.  It will be called with three arguments, the first
   *     one is the `data` to fetch the description, the second one is the
   *     event object, and the last one is a function for setting the
   *     description.
   *
   * Note tha the `eventHandler` will be called while the instance is
   * initializing to setup the initial value of the description, and the
   * `eventObject` will be null at this call.
   *
   * @returns {Function} A constructor of the description maintainer class.
   */
  dmm.generateUpdateByDOMEventDescriptionMaintainerClass =
      function(eventName, eventHandler) {
    var Constructor = function(data, setDescription) {
      this._eventHandler = function(eventObject) {
        eventHandler(data, eventObject, setDescription);
      };
      this._data = data;

      this._data.addEventListener(eventName, this._eventHandler);
      this._eventHandler(null);
    };

    Constructor.prototype = {
      destroy: function() {
        this._data.removeEventListener(eventName, this._eventHandler);

        this._eventHandler = null;
        this._data = null;
      }
    };

    return Constructor;
  };

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
})('modules/description_maintainer_material', this));
