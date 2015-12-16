;(function(define) { 'use strict'; define(function(require) {
  var testModuleGenerater = require('modules/test_module_generater');

  var evt = require('evt');
  var testModuleUtils = require('modules/test_module_utils');

  /**
   * Generates a test module for testing data which are instance of `Promise`
   *
   * @param {Array} defaultAttrsPath - The default attrs-path for the var tree
   *     on the case that the user want to save the test data into the var tree.
   * @param {Object} resultObjectTestModules - The test modules for the result
   *     object.
   * @param {Object} rejectObjectTestModules - The test modules for the reject
   *     object.
   *
   * @returns {Object} A test module.
   */
  testModuleGenerater.generatePromiseTestModule = function(
      defaultAttrsPath, resultObjectTestModules, rejectObjectTestModules) {

    resultObjectTestModules =
        testModuleGenerater._wrapIntoArrayIfNeed(resultObjectTestModules);
    rejectObjectTestModules =
        testModuleGenerater._wrapIntoArrayIfNeed(rejectObjectTestModules);

    /**
     * Creates an object maintains the description of an instance of Primise.
     *
     * The description contains the state of the test data.
     *
     * @constructor
     */
    var DescriptionMaintainer = function(promiseObject, setDescription) {
      setDescription('state=pending');
      this._promiseObject = promiseObject;

      this._promiseObject.then((function() {
        if (this._promiseObject) {
          setDescription('state=fulfilled');
        }
      }).bind(this), (function() {
        if (this._promiseObject) {
          setDescription('state=rejected');
        }
      }).bind(this));
    };

    DescriptionMaintainer.prototype = {
      destroy: function() {
        this._promiseObject = null;
      }
    };

    var stateTestModule =
        testModuleGenerater.generatePrimitiveTestModule('string', 'state', []);

    var interfaceSpecs = [{
      state: {type: 'attribute', testModule: stateTestModule},

      resolved: {
        type: 'event',
        eventObjectTestModules: resultObjectTestModules
      },

      rejected: {
        type: 'event',
        eventObjectTestModules: rejectObjectTestModules
      }
    }];

    var preproc = function(promiseObject) {
      var state = 'pending';
      var onResolve = function(resolveObject) {
        state = 'fulfilled';
        obj.fire('resolved', resolveObject);
      };
      var onReject = function(rejectReason) {
        state = 'rejected';
        obj.fire('rejected', rejectReason);
      };
      var obj = evt({
        get state() {
          return state;
        },

        addEventListener: function() {
          this.on.apply(this, arguments);
        },

        removeEventListener: function() {
          this.off.apply(this, arguments);
        }
      });
      promiseObject.then(onResolve, onReject);
      return [obj];
    };

    /**
     * Creates an object which automatically updates the state attribute.
     *
     * @constructor
     */
    var MetaController = function(model) {
      this._model = model;
      this._eventHandler = this._eventHandler.bind(this);

      this._model.objects[0].addEventListener('resolved', this._eventHandler);
      this._model.objects[0].addEventListener('rejected', this._eventHandler);
    };

    MetaController.prototype = {
      destroy: function() {
        var obj = this._model.objects[0];
        obj.removejEventListener('resolved', this._eventHandler);
        obj.removejEventListener('rejected', this._eventHandler);

        this._eventHandler = null;
        this._model = null;
      },

      _eventHandler: function() {
        this._model.refreshAttribute(0, 'state');
      }
    };

    var taskName = (function() {
      var name1 = testModuleUtils.getTestModulesName(resultObjectTestModules);
      var name2 = testModuleUtils.getTestModulesName(rejectObjectTestModules);
      return 'Promise<' + name1 + ', ' + name2 + '>';
    })();

    var isTestDataValid = function(testData) {
      return testData instanceof window.Promise;
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
