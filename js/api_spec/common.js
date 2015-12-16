;(function(define) { 'use strict'; define(function(require, exports, module) {
  /**
   * @file Contains utility functions and classes to make it easy to
   *     configure the specifications about the api.
   */
  var common = module.exports;

  var dmm = require('modules/description_maintainer_material');
  var instanceCreater = require('modules/instance_creater');
  var mode = require('modules/mode');
  var tmg = require('modules/test_module_generater');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  var errorTestModule = require('build_in_type/error_test_module');
  var undefinedTestModule = require('build_in_type/undefined_test_module');

  var _ATTRIBUTE_CHANGED = 'attributechanged';

  /**
   * Generates a function which checks if a data is valid for a test module.
   *
   * @param {string} typeName - Type name of the data the test module tests.
   *
   * @returns {Function} A function with only one argument, and it returns
   *     whether the gived test data (the first argument) is valid for the test
   *     module.
   */
  common.generateIsTestDataValidFunc = function(typeName) {
    if (!(typeName in window)) {
      return function(testData) { return false; };
    } else {
      return function(testData) {
        return testData instanceof window[typeName];
      };
    }
  };

  /**
   * Generates a class which maintains a constant description.
   *
   * @param {string} str - The constant description string.
   *
   * @returns {Function} A constructor of a class which can maintain an object's
   *     description by taking the description text as a constant.
   */
  common.generateConstantDescriptionMaintainerClass = function(str) {
    return dmm.generateConstantDescriptionMaintainerClass((testData) => str);
  };

  /**
   * Generates a class which maintains an object's description by getting an
   * attribute value from it.
   *
   * @param {string} attributeName - The attribute name.
   *
   * @returns {Function} A constructor of a class which can maintain an object's
   *     description by getting the attribute value from it.
   */
  common.generateConstantAttributeDescriptionMaintainerClass =
      function(attributeName) {
    return dmm.generateConstantDescriptionMaintainerClass(function(testData) {
      return attributeName + '=' + utils.valueToString(testData[attributeName]);
    });
  };

  /**
   * Generates a class which maintains an object's description by getting an
   * attribute value from it and updating the description if needs.
   *
   * The description maintainer will listen the `attributechanged` event on
   * the object.  Once the event is triggered, it checks whether the attribute
   * to got is changed to determind whether the description should be updated
   * or not.
   *
   * @param {string} attributeName - The attribute name.
   *
   * @returns {Function} A constructor of a class which can do above jobs.
   */
  common.generateNonConstantAttributeDescriptionMaintainerClass =
      function(attributeName) {
    return dmm.generateUpdateByDOMEventDescriptionMaintainerClass(
        _ATTRIBUTE_CHANGED, function(testData, eventObject, setDescription) {
          var shouldUpdate = (eventObject === null);
          if (eventObject !== null) {
            utils.iterateArray(eventObject.attrs, function(attrName) {
              if (attrName == attributeName) {
                shouldUpdate = true;
                return false;
              }
            });
          }
          if (shouldUpdate) {
            var valueString = utils.valueToString(testData[attributeName]);
            setDescription(attributeName + '=' + valueString);
          }
        });
  };

  /**
   * Does nothing one the gived test data.
   *
   * @param {Object} testData - The test to be processed.
   *
   * @returns {Array} An array with only one element be the first parameter.
   */
  common.simplePreproc = function(testData) { return [testData]; };

  /**
   * Creates a controller which does nothing.
   *
   * @class
   */
  common.VoidMetaController = utils.createVoidClass('destroy');

  /**
   * Creates a controller which updates the attributes automatically in normal
   * mode.
   *
   * It listens on the `attributchanged` event.
   *
   * @class
   */
  common.AutoRefreshAttributeMetaController = function(model) {
    this._model = model;
    this._eventHandler = this._eventHandler.bind(this);

    this._model.objects[0].addEventListener(
        _ATTRIBUTE_CHANGED, this._eventHandler);
  };

  common.AutoRefreshAttributeMetaController.prototype = {
    destroy: function() {
      this._model.objects[0].removeEventListener(
          _ATTRIBUTE_CHANGED, this._eventHandler);

      this._eventHandler = null;
      this._model = null;
    },

    _eventHandler: function(eventObject) {
      if (mode.mode == mode.MODES.NORMAL) {
        utils.iterateArray(eventObject.attrs, function(attrName) {
          this._model.refreshAttribute(0, attrName);
        }, this);
      }
    }
  };

  /**
   * Generates a test module for testing a primitive type data.
   *
   * @param {string} taskName - Name of the test task in the test module.
   * @param {string} typeString - Type string of the data to test.
   *
   * @returns {Object} A test module.
   */
  common.generateBasicTestModule = function(taskName, typeString) {
    varTree.putValue([taskName], []);
    return tmg.generatePrimitiveTestModule(typeString, taskName, [taskName]);
  };

  /**
   * Generates a test module for testing an array of specific type of test data.
   *
   * @param {Object} elementTestModule - Test module for testing the elements in
   *     the array.
   *
   * @returns {Object} A test module.
   */
  common.generateArrayTestModule = function(elementTestModule) {
    var defaultAttrsPath = [];
    utils.iterateArray(elementTestModule.DEFAULT_ATTRS_PATH,
                       function(attrName) { defaultAttrsPath.push(attrName); });
    defaultAttrsPath[defaultAttrsPath.length - 1] += 's';

    varTree.putValue(defaultAttrsPath, []);
    return tmg.generateArrayTestModule(defaultAttrsPath, elementTestModule);
  };

  /**
   * Generates a test module for testing a promise.
   *
   * The reject object of the promise test module will be tested by the
   * `errorTestModule`.
   *
   * @param {Array} resolveObjectTestModules - Test modules for testing the
   *     resolve object.
   *
   * @returns {Object} A test module.
   */
  common.generateBasicPromiseTestModule = function(resolveObjectTestModules) {
    return tmg.generatePromiseTestModule(
        [], resolveObjectTestModules, errorTestModule);
  };

  /**
   * Generates a test module for testing data which implement a specific
   * interface.
   *
   * @param {string} interfaceName - Name of the interface.
   * @param {Function} DescriptionMaintainer - A class which can maintain the
   *     test data's description.
   * @param {Array} interfaceSpecs - An array of specifications about each
   *     interfaces.
   * @param {Function} preproc - A function which transforms the input test data
   *     into an array of objects which fit the specified interfaces.
   * @param {Function} MetaController - A class which manages automatic
   *     operations on the test data.
   *
   * @returns {Object} A test module.
   */
  common.generateInterfaceTestModule = function(
      interfaceName, DescriptionMaintainer,
      interfaceSpecs, preproc, MetaController) {
    var defaultAttrsPath = [interfaceName];

    varTree.putValue(defaultAttrsPath, []);

    var isTestDataValid = common.generateIsTestDataValidFunc(interfaceName);

    return tmg.generateInterfaceTestModule(
        isTestDataValid, interfaceName, defaultAttrsPath,
        DescriptionMaintainer, interfaceSpecs, preproc, MetaController, true);
  };

  /**
   * Creates a specification about arguments from a relative simpler spec.
   *
   * It takes each argument as a specification about an argument.  In each
   * specification, the `defaultAttrsPath` will be assigned as `[name]` if
   * the attribute `defaultAttrsPath` is not found.
   *
   * @returns {Array} An full specification about arguments.
   */
  common.createArgsSpec = function() {
    var ret = [];
    utils.iterateArray(arguments, function(argSpec) {
      ret.push({
        name: argSpec.name,
        defaultValue: argSpec.defaultValue,
        defaultAttrsPath:
            utils.getDefault(argSpec, 'defaultAttrsPath', [argSpec.name])
      });
    });
    return ret;
  };

  /**
   * Creates a new type of structure and registers it.
   *
   * @param {string} structName - Name of the structure.
   * @param {Array} argsSpec - Specification of each arguments.
   *
   * @returns {Function} The consturctor of the created structure.
   */
  common.registerStruct = function(structName, argsSpec) {
    utils.iterateArray(argsSpec, function(argSpec) {
      utils.setDefault(argSpec, 'defaultAttrsPath', [argSpec.name]);
    });

    var Constructor = function() {
      for (var i = 0; i < argsSpec.length; ++i) {
        this[argsSpec[i].name] = arguments[i];
      }
    };

    common.registerExistClass(Constructor, structName, argsSpec);

    return Constructor;
  };

  /**
   * Registers an exist class.
   *
   * @param {Function} Constructor - Constructor of the class.
   * @param {string} className - Name of the class.
   * @param {Array} argsSpec - Specification of each arguments.
   */
  common.registerExistClass = function(Constructor, className, argsSpec) {
    instanceCreater.registerClass(
        className, [className], Constructor, argsSpec);

    varTree.putValue([className], []);
  };

  /**
   * A test module for testing data which represents an address of something.
   *
   * @type {Object}
   */
  common.addressTestModule =
      common.generateBasicTestModule('address', 'string');

  /**
   * A test module for testing data which represents a name.
   *
   * @type {Object}
   */
  common.nameTestModule = common.generateBasicTestModule('name', 'string');

  /**
   * A test module for testing data which represents an uuid.
   *
   * @type {Object}
   */
  common.uuidTestModule = common.generateBasicTestModule('uuid', 'string');

  /**
   * A test module for testing data which represents a passkey.
   *
   * @type {Object}
   */
  common.passkeyTestModule =
      common.generateBasicTestModule('passkey', 'string');

  /**
   * A test module for testing instances of promise without resolve object.
   *
   * @type {Object}
   */
  common.voidPromiseTestModule =
      common.generateBasicPromiseTestModule(undefinedTestModule);

  /**
   * A test module for testing an array of uuids.
   *
   * @type {Object}
   */
  common.uuidsTestModule =
      common.generateArrayTestModule(common.uuidTestModule);

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
})('api_spec/common', this));
