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
   * Generates a array data test module with specifying test modules for each
   * elements.
   *
   * @param {Array} defaultAttrsPath - The default attrs-path of the global var
   *     tree if the user want to save the data into the global var tree.
   * @param {Array} elementTestModules - Test modules for the child elements.
   *
   * @returns {Object} A test module.
   */
  testModuleGenerater.generateArrayTestModule =
      function(defaultAttrsPath, elementTestModules) {
    elementTestModules =
        testModuleGenerater._wrapIntoArrayIfNeed(elementTestModules);

    var testModuleName =
        'array<' + testModuleUtils.getTestModulesName(elementTestModules) + '>';

    var getDescription = function(testData) {
      return testModuleName + '(' + testData.length + ')';
    };

    var getValidElementTestModule = function(elementValue) {
      return testModuleUtils.getValidTestModule(elementTestModules,
                                                elementValue);
    };

    var appendLogMessageIfElementValueInvalid = function(name, elementValue) {
      testModuleUtils.appendLogMessageIfTestDataInvalid(
          name, elementTestModules, elementValue);
    };

    var _Model = function(testData) {
      this._testData = testData;
      this._elements = {
        length: {
          identifier: 'length',
          index: 0,
          type: 'attribute',
          name: 'length',
          value: 0
        },
        refresh: {
          identifier: 'refresh',
          index: 1,
          type: 'options',
          options: ['Refresh']
        }
      };
      this._elementDescriptionMaintainers = [];
      this._editable = false;

      this.refreshAll();
    };

    _Model.prototype = Object.setPrototypeOf({
      CUSTOM_EVENTS: new utils.Enum('ELEMENT_REFERENCE_CHANGED'),

      destroy: function() {
        utils.iterateArray(this._elementDescriptionMaintainers, function(dm) {
          dm.destroy();
        });

        this._testData = null;
        this._elements = null;
        this._elementDescriptionMaintainers = null;
      },

      orderedIterate: function(callback) {
        callback('length');
        for (var i = 0; i < this._testData.length; ++i) {
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

      /**
       * @returns {Array} The test data.
       */
      get testData() {
        return this._testData;
      },

      /**
       * Re-scan the whole array to refresh the whole model.
       */
      refreshAll: function() {
        var i;
        var identifier;

        // Removes all the cached elements first.
        for (i = this._elementDescriptionMaintainers.length - 1; i >= 0; --i) {
          identifier = this._getElementIdentifier(i);
          this._elementDescriptionMaintainers[i].destroy();
          var elementInfo = this._elements[identifier];
          delete this._elements[identifier];
          this._elements.refresh.index -= 1;
          this.fire(this.EVENTS.ELEMENT_REMOVED, elementInfo);
        }
        this._elements.length.value = this._testData.length;
        this.fire(this.EVENTS.ELEMENT_VALUE_CHANGED, 'length');
        this._elementDescriptionMaintainers = [];

        // Gets all the elements.
        for (i = 0; i < this._testData.length; ++i) {
          identifier = this._getElementIdentifier(i);
          var reference = this._testData[i];
          this._elements[identifier] = {
            identifier: identifier,
            index: i + 1,
            i: i,
            type: 'attribute',
            refreshable: true,
            name: identifier,
            description: '',
            reference: reference,
            testModule: getValidElementTestModule(reference),
            childTask: null
          };
          this._elements.refresh.index += 1;
          this.fire(this.EVENTS.ELEMENT_ADDED, identifier);
          this._elementDescriptionMaintainers.push(
              this._setElementDescription(identifier, reference));
          this.fire(this.CUSTOM_EVENTS.ELEMENT_REFERENCE_CHANGED, identifier);
        }
      },

      /**
       * Re-fetch a specific element in the array.
       *
       * @param {string} identifier - The identifier of the element in the
       *     elements object.
       */
      refreshElement: function(identifier) {
        var index = this._getElementIndex(identifier);
        var elementInfo = this._elements[identifier];
        var reference = this._testData[index];
        if (reference !== elementInfo.reference) {
          this._elementDescriptionMaintainers[index].destroy();
          elementInfo.reference = reference;
          elementInfo.testModule = getValidElementTestModule(reference);
          elementInfo.childTask = null;
          this._elementDescriptionMaintainers[index] =
              this._setElementDescription(identifier, this._testData[index]);
          this.fire(this.CUSTOM_EVENTS.ELEMENT_REFERENCE_CHANGED, identifier);
        }
      },

      _setElementDescription(identifier, elementValue) {
        appendLogMessageIfElementValueInvalid(identifier, elementValue);

        var testModule = this._elements[identifier].testModule;
        var setDescription = (function(description) {
          this._elements[identifier].description = description;
          this.fire(this.EVENTS.ELEMENT_VALUE_CHANGED, identifier);
        }).bind(this);
        return new testModule.DescriptionMaintainer(elementValue,
                                                    setDescription);
      },

      _getElementIdentifier: function(index) {
        return 'element_' + index;
      },

      _getElementIndex: function(identifier) {
        return Number(identifier.substr('element_'.length));
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
      this._onElementReferenceChanged =
          this._onElementReferenceChanged.bind(this);

      mode.on(mode.EVENTS.MODE_CHANGED, this._onModeChanged);
      this._model.on(this._model.CUSTOM_EVENTS.ELEMENT_REFERENCE_CHANGED,
                     this._onElementReferenceChanged);
    };

    _Controller.prototype = Object.setPrototypeOf({
      destroy: function() {
        this._model.off(this._model.CUSTOM_EVENTS.ELEMENT_REFERENCE_CHANGED,
                        this._onElementReferenceChanged);
        mode.off(mode.EVENTS.MODE_CHANGED, this._onModeChanged);

        this._onElementReferenceChanged = null;
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
            this._createAttributeTask(elementInfo);
          }
          this._taskManagerInterface.switchToTask(elementInfo.childTask);
        }
      },

      selectAttribute(identifier) {
        var elementInfo = this._model.elements[identifier];
        if ('reference' in elementInfo) {
          var setValue = null;
          if (mode.mode == mode.MODES.ENGINEER) {
            setValue = (function(value) {
              try {
                this._model.testData[elementInfo.i] = value;
              } catch (e) {
                log.appendMessage(
                    log.TYPES.ERROR,
                    'exception cought while assigning value to ' +
                    'an element of an array',
                    e instanceof window.Error ? utils.cloneError(e) : e);
              }
              this._model.refreshElement(identifier);
            }).bind(this);
          }
          this._taskManagerInterface.createPopupTask(
              saveOrResetValueTask.createTask, [
                elementInfo.testModule.DEFAULT_ATTRS_PATH,
                elementInfo.reference,
                setValue
              ], true);
        }
      },

      _createAttributeTask: function(elementInfo) {
        var onKill = function() {
          if (task === elementInfo.childTask) {
            elementInfo.childTask = null;
          }
        };
        var task = this._taskManagerInterface.createChildTask(
            elementInfo.testModule.createTask, [elementInfo.reference],
            elementInfo.testModule.NAME, true, onKill);
        elementInfo.childTask = task;
      },

      _onElementReferenceChanged: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        if (elementInfo.testModule.needImmediateHandle) {
          this._createAttributeTask(elementInfo);
        }
      },

      _onModeChanged: function() {
        this._model.editable = (mode.mode == mode.MODES.ENGINEER);
      }
    }, testTaskMaterial.ControllerInterface.prototype);

    return {
      get NAME() {
        return testModuleName;
      },

      isTestDataValid: function(testData) {
        return testData instanceof Array;
      },

      get DEFAULT_ATTRS_PATH() {
        return defaultAttrsPath;
      },

      needImmediateHandle: testModuleUtils.checkTestModulesNeedImmediateHandle(
          elementTestModules),

      DescriptionMaintainer:
          dmm.generateConstantDescriptionMaintainerClass(getDescription),

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
