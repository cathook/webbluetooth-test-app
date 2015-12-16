;(function(define) { 'use strict'; define(function(require) {
  var testModuleGenerater = require('modules/test_module_generater');

  var interfaceTestModule = testModuleGenerater._interfaceTestModule = {};

  var generalTestModule = require('build_in_type/general_test_module');
  var testModuleUtils = require('modules/test_module_utils');
  var testTaskMaterial = require('modules/test_task_material');
  var utils = require('libs/utils');

  /**
   * Generates a test module for testing an object which implements the
   * specified interfaces.
   *
   * An object to be test will be throwed into a pre-process function which
   * turns the object into a list of objects.  Each object generated from the
   * pre-process function must implements a specific interface, which spec
   * should be specified in the `interfaceSpecs` argument.
   *
   * @param {Function} isTestDataValid - A function which checks whether the
   *     test data is valid for this test module or not.
   * @param {string} taskName - The task name of the test task.
   * @param {Array} defaultAttrsPath - The default attrs-path of the global var
   *     tree if the user want to save the data into the global var tree.
   * @param {Object} DescriptionMaintainer - The description maintainer of this
   *     test module.
   * @param {Array} interfaceSpecs - A list of interface spec for each objects
   *     got from the `preproc` function.  Each spec info must be a dictionary
   *     which follows the format:
   *       {
   *         <attribute1 name>: <attribute1 information>,
   *         <attribute2 name>: <attribute2 information>,
   *         ...
   *       }
   *
   *     The `<attribute name>` means the name of the attribute you want to
   *     specify in the interface.
   *     The `<attribute information>` must be a dictionary follows the format:
   *       {
   *         type: 'attribute' | 'method' | 'event',
   *         <detail information>
   *       }
   *
   *     If the type is `attribute`, the <detail information> contains:
   *       writable: <boolean>  (default=false),
   *       testModule: <A test module>  (default=undefined),
   *       testModules: <An array of test modules>  (default=[])
   *     Note that if neither `testModule` nor `testModules` is specified, this
   *     generater will use `generalTestModule` to test the that attribute
   *     value.
   *
   *     If the type is `method`, which means this attribute is a callable
   *     function, the <detail information> contains:
   *       argsSpec: <A spec for the arguments of this method>
   *       returnValueTestModule: <A test module>  (default=undefined),
   *       returnValueTestModules: <An array of test modules>  (default=[])
   *     The <A spec for the arguments of this method> must be an array.  The
   *     i-th element in the array specifies the i-th argument's related
   *     information, which must be a dictionary follows the format:
   *       {
   *         name: <name of this argument>  (default='arg%d', where %d=i)
   *         defaultValue: <the default value of that argument>,
   *         defaultAttrsPath: <An attrs-path>
   *       }
   *     The `defaultAttrsPath` is for the case that the user may want to set
   *     that argument by selecting a value from the var tree.
   *     Note that if neither `returnValueTestModule` nor
   *     `returnValueTestModules` is specified, this generater will use the
   *     `generalTestModule` to test the return value of this method.
   *
   *     If the type is `event`, which means it is an event with type name be
   *     the `<attribute name>`, the <detail information> contains:
   *       eventObjectTestModule: <A test module>  (default=undefined),
   *       eventObjectTestModules: <An array of test modules>  (default=[])
   *     Note that if neither `eventObjectTestModule` nor
   *     `eventObjectTestModules` is specified, this generater will use the
   *     `generalTestModule` to test the event object.
   *
   * @param {Function} preproc - A function which turns the gived object into a
   *     list of objects.
   * @param {Function} MetaController - A class which handles some automatically
   *     process.  The constructor will be called with 2 parameters, the first
   *     one is the taskManagerInterface of the task and the second one is the
   *     model object of the task.  the model object contains follow attributes:
   *       - objects: An array of objects generated from the `preproc` function.
   *       - refreshAttribute(<object_index>, <attribute_name>)
   *       - refreshAllAttriubtes()
   * @param {boolean} needImmediateHandle - Whether this object needs to be
   *     handle immediately if the instance of it be created.
   *
   * @returns {Object} A test module.
   */
  testModuleGenerater.generateInterfaceTestModule = function(
      isTestDataValid, taskName, defaultAttrsPath,
      DescriptionMaintainer, interfaceSpecs, preproc, MetaController,
      needImmediateHandle) {

    needImmediateHandle = !!needImmediateHandle;

    // Fills default values in the specification data.
    utils.iterateArray(interfaceSpecs, function(spec) {
      utils.iterateDict(spec, function(attrName, attrValue) {
        utils.fillDefaults(attrValue, _TypeSpecDefaults[attrValue.type]);
        ['testModule', 'returnValueTestModule', 'eventObjectTestModule']
            .forEach(function(aa) {
              if (aa in attrValue) {
                attrValue[aa + 's'] =
                    [attrValue[aa]].concat(attrValue[aa + 's']);
              }
              aa += 's';
              if (aa in attrValue) {
                if (attrValue[aa].length === 0) {
                  attrValue[aa] = [generalTestModule];
                }
                if (!needImmediateHandle) {
                  needImmediateHandle =
                      testModuleUtils.checkTestModulesNeedImmediateHandle(
                          attrValue[aa]);
                }
              }
            });
      });
    });

    var Model = interfaceTestModule._createModelClass(interfaceSpecs);
    var Controller = interfaceTestModule._createControllerClass(
        defaultAttrsPath, interfaceSpecs);

    return {
      get NAME() {
        return taskName;
      },

      get DEFAULT_ATTRS_PATH() {
        return defaultAttrsPath;
      },

      get isTestDataValid() {
        return isTestDataValid;
      },

      needImmediateHandle: needImmediateHandle,

      get DescriptionMaintainer() {
        return DescriptionMaintainer;
      },

      createTask: function(taskManagerInterface, testData) {
        var model = new Model(preproc(testData));
        var controller = new Controller(taskManagerInterface, testData, model);
        var metaController = new MetaController(model);
        var view = new testTaskMaterial.View(controller, model);

        return {
          destroy: function() {
            view.destroy();
            metaController.destroy();
            model.destroy();

            view = null;
            metaController = null;
            controller = null;
            model = null;
          },

          get view() {
            return view.container;
          }
        };
      }
    };
  };

  var _TypeSpecDefaults = {
    attribute: Object.freeze({
      type: 'attribute',
      writable: false,
      testModules: []
    }),

    method: Object.freeze({
      type: 'method',
      argsSpec: [],
      returnValueTestModules: []
    }),

    event: Object.freeze({
      type: 'event',
      eventObjectTestModules: []
    })
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
