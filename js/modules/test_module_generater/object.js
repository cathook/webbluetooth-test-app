;(function(define) { 'use strict'; define(function(require) {
  var testModuleGenerater = require('modules/test_module_generater');

  var dmm = require('modules/description_maintainer_material');
  var log = require('modules/log');
  var mode = require('modules/mode');
  var saveOrResetValueTask = require('modules/save_or_reset_value_task');
  var testModuleUtils = require('modules/test_module_utils');
  var testTaskMaterial = require('modules/test_task_material');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  /**
   * Generates a test module for an object type data.
   *
   * @param {Array} defaultAttrsPath - The default attrs-path of the global var
   *     tree if the user want to save the data into the global var tree.
   * @param {Object} attributesTestModules - A dictionary specifies the test
   *     modules of the child elements.
   * @param {Array} defaultAttributeTestModules - Test modules for the child
   *    elements which is not specified in the `attributesTestModules` argument.
   *
   * @returns {Object} A test module.
   */
  testModuleGenerater.generateObjectTestModule = function(
      defaultAttrsPath, attributesTestModules, defaultAttributeTestModules) {

    (function() {
      var tmp = attributesTestModules;
      attributesTestModules = {};
      utils.iterateDict(tmp, function(attrName, testModules) {
        attributesTestModules[attrName] =
            testModuleGenerater._wrapIntoArrayIfNeed(testModules);
      });
    })();

    defaultAttributeTestModules =
        testModuleGenerater._wrapIntoArrayIfNeed(defaultAttributeTestModules);

    /**
     * Gets the test modules for the specific attribute.
     *
     * @param {string} attributeName - The specific attribute.
     *
     * @returns {Array} A list of test modules.
     */
    var getAttributeTestModules = function(attributeName) {
      if (attributeName in attributesTestModules) {
        return attributesTestModules[attributeName];
      } else {
        return defaultAttributeTestModules;
      }
    };

    /**
     * Gets the test modules for the specific attribute value.
     *
     * @param {string} attributeName - The specific attribute.
     * @param {Object} attributeValue - Value of the specific attribute.
     *
     * @returns {Object} A test modules.
     */
    var getAttributeTestModule = function(attributeName, attributeValue) {
      return testModuleUtils.getValidTestModule(
          getAttributeTestModules(attributeName), attributeValue);
    };

    var appendLogMessageIfAttributeValueInvalid = function(attributeName,
                                                           attributeValue) {
      var testModules = getAttributeTestModules(attributeName);
      testModuleUtils.appendLogMessageIfTestDataInvalid(
          attributeName, testModules, attributeValue);
    };

    var _Model = function(testData) {
      this._testData = testData;
      this._elements = {
        refresh: {
          identifier: 'refresh',
          index: 0,
          type: 'options',
          options: ['Refresh']
        }
      };
      this._elementDescriptionMaintainers = {};
      this._numAttributes = 0;
      this._editable = false;

      this.refreshAll();
    };

    _Model.prototype = Object.setPrototypeOf({
      destroy: function() {
        utils.iterateDict(this._elementDescriptionMaintainers,
                          function(name, dm) { dm.destroy(); });

        this._testData = null;
        this._elements = null;
        this._elementDescriptionMaintainers = null;
      },

      orderedIterate: function(callback) {
        for (var i = 0; i < this._numAttributes; ++i) {
          callback(this._getElementIdentifier(i));
        }
        callback('refresh');
      },

      get editable() {
        return this._editable;
      },

      set editable(editable) {
        this._editable = editable;

        this.fire(this.EVENTS.EDITABLE_STATE_CHANGED);
      },

      get elements() {
        return this._elements;
      },

      get testData() {
        return this._testData;
      },

      /**
       * Re-scan the whole array to refresh the whole model.
       */
      refreshAll: function() {
        while (this._numAttributes > 0) {
          var identifier = this._getElementIdentifier(--this._numAttributes);
          var elementInfo = this._elements[identifier];
          delete this._elements[identifier];
          this._elementDescriptionMaintainers[identifier].destroy();
          this._elements.refresh.index -= 1;
          this.fire(this.EVENTS.ELEMENT_REMOVED, elementInfo);
        }
        this._elementDescriptionMaintainers = {};
        utils.iterateDict(this._testData, function(attrName, attrValue) {
          var index = this._numAttributes++;
          var identifier = this._getElementIdentifier(index);
          this._elements[identifier] = {
            identifier: identifier,
            index: index,
            type: 'attribute',
            refreshable: true,
            name: attrName,
            description: '',
            reference: attrValue,
            testModule: getAttributeTestModule(attrName, attrValue),
            childTask: null
          };
          this._elements.refresh.index += 1;
          this.fire(this.EVENTS.ELEMENT_ADDED, identifier);
          this._setElementDescription(identifier, attrName, attrValue);
        }, this);
      },

      /**
       * Re-fetch a specific element in the array.
       *
       * @param {string} identifier - The identifier of the element in the
       *     elements object.
       */
      refreshElement: function(identifier) {
        var elementInfo = this._elements[identifier];
        var attrName = elementInfo.name;
        var attrValue = this._testData[attrName];
        if (attrValue != elementInfo.reference) {
          elementInfo.reference = attrValue;
          elementInfo.childTask = null;
          elementInfo.testModule = getAttributeTestModule(attrName, attrValue);
          this._elementDescriptionMaintainers[identifier].destroy();
          this._setElementDescription(identifier, attrName, attrValue);
        }
      },

      _setElementDescription(identifier, attrName, attrValue) {
        appendLogMessageIfAttributeValueInvalid(attrName, attrValue);
        var setDesc = (function(value) {
          this._elements[identifier].description = value;
          this.fire(this.EVENTS.ELEMENT_VALUE_CHANGED, identifier);
        }).bind(this);
        this._elementDescriptionMaintainers[identifier] =
            new this._elements[identifier].testModule.DescriptionMaintainer(
                attrValue, setDesc);
      },

      _getElementIdentifier: function(index) {
        return 'element' + index;
      }
    }, testTaskMaterial.ModelInterface.prototype);

    /**
     * Controller part of the test task.
     *
     * @constructor
     * @param {Object} taskManagerInterface - Interface to the task manager.
     * @param {Object} model - The model part of the task manager.
     */
    var _Controller = function(taskManagerInterface, model) {
      this._taskManagerInterface = taskManagerInterface;
      this._model = model;
      this._onModeChanged = this._onModeChanged.bind(this);

      mode.on(mode.EVENTS.MODE_CHANGED, this._onModeChanged);
    };

    _Controller.prototype = Object.setPrototypeOf({
      destroy: function() {
        mode.off(mode.EVENTS.MODE_CHANGED, this._onModeChanged);

        this._onModeChanged = null;
        this._taskManagerInterface = null;
        this._model = null;
      },

      saveToVarTree: function() {
        this._taskManagerInterface.createPopupTask(
            varTree.createPutValueTask,
            [defaultAttrsPath, this._model.testData], true);
      },

      editByVarTree: function() {
        var onKilled = (function() { this._model.refreshAll(); }).bind(this);
        this._taskManagerInterface.createPopupTask(
            varTree.createTaskOnCustomRoot,
            [this._model.testData, false, true], true, onKilled);
      },

      chooseOption: function(identifier, option) {
        this._model.refreshAll();
      },

      refreshAttribute: function(identifier) {
        this._model.refreshElement(identifier);
      },

      enterAttribute: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        if ('reference' in elementInfo) {
          if (!elementInfo.childTask) {
            var onKill = function() {
              if (task === elementInfo.childTask) {
                elementInfo.childTask = null;
              }
            };
            var task = this._taskManagerInterface.createChildTask(
                elementInfo.testModule.createTask, [elementInfo.reference],
                elementInfo.testModule.NAME, true, onKill);
            elementInfo.childTask = task;
          }
          this._taskManagerInterface.switchToTask(elementInfo.childTask);
        }
      },

      selectAttribute: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        if ('reference' in elementInfo) {
          var value = this._model.testData[elementInfo.name];
          var setValue = null;
          if (mode.mode == mode.MODES.ENGINEER) {
            setValue = (function(value) {
              try {
                this._model.testData[elementInfo.name] = value;
              } catch (e) {
                log.appendMessage(
                    log.TYPES.ERROR,
                    'exception cought while assigning value to ' +
                    'an attribute of an object',
                    e instanceof window.Error ? utils.cloneError(e) : e);
              }
              this._model.refreshElement(identifier);
            }).bind(this);
          }
          this._taskManagerInterface.createPopupTask(
              saveOrResetValueTask.createTask,
              [elementInfo.testModule.DEFAULT_ATTRS_PATH, value, setValue],
              true);
        }
      },

      _onModeChanged: function() {
        this._model.editable = (mode.mode == mode.MODES.ENGINEER);
      }
    }, testTaskMaterial.ControllerInterface.prototype);

    return {
      get NAME() {
        return 'Object';
      },

      isTestDataValid: function(testData) {
        return testData instanceof Object;
      },

      get DEFAULT_ATTRS_PATH() {
        return defaultAttrsPath;
      },

      DescriptionMaintainer:
          dmm.generateConstantDescriptionMaintainerClass(() => 'Object'),

      createTask: function(taskManagerInterface, testData) {
        var model = new _Model(testData);
        var controller = new _Controller(taskManagerInterface, model);
        var view = new testTaskMaterial.View(controller, model);

        return {
          get view() {
            return view.container;
          },

          destroy: function() {
            model.destroy();
            controller.destroy();
            view.destroy();

            model = null;
            controller = null;
            view = null;
          }
        };
      }
    };
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
