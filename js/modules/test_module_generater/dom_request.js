;(function(define) { 'use strict'; define(function(require) {
  var testModuleGenerater = require('modules/test_module_generater');

  var testModuleUtils = require('modules/test_module_utils');

  /**
   * Generates a class for testing data which are instances of DOMRequest.
   *
   * @param {Array} defaultAttrsPath - The default attrs-path for the var tree
   *     on the case that the user want to store the data into the var tree.
   * @param {Array} resultObjectTestModules - The test modules for the result
   *     object.
   * @param {Array} errorObjectTestModules - The test modules for the error
   *     object.
   */
  testModuleGenerater.generateDOMRequestTestModule = function(
      defaultAttrsPath, resultObjectTestModules, errorObjectTestModules) {

    resultObjectTestModules =
        testModuleGenerater._wrapIntoArrayIfNeed(resultObjectTestModules);
    errorObjectTestModules =
        testModuleGenerater._wrapIntoArrayIfNeed(errorObjectTestModules);

    /**
     * Creates a object which maintains the description of a DOMRequest.
     *
     * It listens on the events `success` and `error` and updates the
     * description by the `readyState` value.
     *
     * @constructor
     */
    var DescriptionMaintainer = function(domRequest, setDescription) {
      this._domRequest = domRequest;
      this._eventHandler = this._eventHandler.bind(this);
      this._setDescription = setDescription;

      this._domRequest.addEventListener('success', this._eventHandler);
      this._domRequest.addEventListener('error', this._eventHandler);

      this._eventHandler();
    };

    DescriptionMaintainer.prototype = {
      destroy: function() {
        this._domRequest.removeEventListener('success', this._eventHandler);
        this._domRequest.removeEventListener('error', this._eventHandler);

        this._setDescription = null;
        this._eventHandler = null;
        this._domRequest = null;
      },

      _eventHandler: function() {
        this._setDescription('readyState=' + this._domRequest.readyState);
      }
    };

    var readyStateTestModule = testModuleGenerater.generatePrimitiveTestModule(
        'string', 'readyState', []);

    var interfaceSpecs = [{
      readyState: {type: 'attribute', testModule: readyStateTestModule},
      result: {type: 'attribute', testModules: resultObjectTestModules},
      error: {type: 'attribute', testModules: errorObjectTestModules}
    }];

    var preproc = function(domRequest) { return [domRequest]; };

    /**
     * Creates an object which automatically updates the cached attributes in
     * the model part.
     *
     * @constructor
     */
    var MetaController = function(model) {
      this._model = model;
      this._eventHandler = this._eventHandler.bind(this);

      this._model.objects[0].addEventListener('success', this._eventHandler);
      this._model.objects[0].addEventListener('error', this._eventHandler);
    };

    MetaController.prototype = {
      destroy: function() {
        var obj = this._model.objects[0];
        obj.removejEventListener('success', this._eventHandler);
        obj.removejEventListener('error', this._eventHandler);

        this._eventHandler = null;
        this._model = null;
      },

      _eventHandler: function() {
        this._model.refreshAllAttributes();
      }
    };

    var taskName = (function() {
      var name1 = testModuleUtils.getTestModulesName(resultObjectTestModules);
      var name2 = testModuleUtils.getTestModulesName(errorObjectTestModules);
      return 'DOMRequest<' + name1 + ', ' + name2 + '>';
    })();

    var isTestDataValid = function(testData) {
      return testData instanceof window.DOMRequest;
    };

    return testModuleGenerater.generateInterfaceTestModule(
        isTestDataValid, taskName, defaultAttrsPath,
        DescriptionMaintainer, interfaceSpecs, preproc, MetaController);
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
