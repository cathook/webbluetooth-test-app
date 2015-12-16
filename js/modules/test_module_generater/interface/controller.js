;(function(define) { 'use strict'; define(function(require) {
  var interfaceTestModule =
      require('modules/test_module_generater')._interfaceTestModule;

  var log = require('modules/log');
  var mode = require('modules/mode');
  var saveOrResetValueTask = require('modules/save_or_reset_value_task');
  var setupArgumentsTask = require('modules/setup_arguments_task');
  var testTaskMaterial = require('modules/test_task_material');
  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  /**
   * Creates a controller class's constructor.
   *
   * @returns {Function} The controller.
   */
  interfaceTestModule._createControllerClass =
      function(defaultAttrsPath, interfaceSpecs) {
    var Controller = function(taskManagerInterface, testObject, model) {
      this._model = model;
      this._taskManagerInterface = taskManagerInterface;
      this._testObject = testObject;
      this._onModeChanged = this._onModeChanged.bind(this);
      this._onElementReferenceChanged =
          this._onElementReferenceChanged.bind(this);
      this._eventHandlers = null;

      this._model.on(this._model.CUSTOM_EVENTS.ELEMENT_REFERENCE_CHANGED,
                     this._onElementReferenceChanged);
      mode.on(mode.EVENTS.MODE_CHANGED, this._onModeChanged);
      this._initEventListeners();
    };

    Controller.prototype = Object.setPrototypeOf({
      destroy: function() {
        this._removeEventListeners();
        this._model.off(this._model.CUSTOM_EVENTS.ELEMENT_REFERENCE_CHANGED,
                        this._onElementReferenceChanged);
        mode.off(mode.EVENTS.MODE_CHANGED, this._onModeChanged);

        this._eventHandlers = null;
        this._onElementReferenceChanged = null;
        this._onModeChanged = null;
        this._taskManagerInterface = null;
        this._testObject = null;
        this._model = null;
      },

      saveToVarTree: function() {
        this._taskManagerInterface.createPopupTask(
            varTree.createPutValueTask, [defaultAttrsPath, this._testObject],
            true);
      },

      editByVarTree: function() {
        var onKilled = (function() {
          this._model.refreshAllAttributes();
        }).bind(this);
        this._taskManagerInterface.createPopupTask(
            varTree.createTaskOnCustomRoot, [this._testObject, false, true],
            true, onKilled);
      },

      chooseOption: function(identifier, option) {
        var elementInfo = this._model.elements[identifier];
        var spec = interfaceSpecs[elementInfo.objectIndex][elementInfo.name];
        this._setAttributeValue(
            elementInfo.objectIndex, elementInfo.name, spec.options[option]);
      },

      turnOn: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        this._setAttributeValue(
            elementInfo.objectIndex, elementInfo.name, true);
      },

      turnOff: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        this._setAttributeValue(
            elementInfo.objectIndex, elementInfo.name, false);
      },

      removeAttribute: function(identifier) {
        this._model.removeElement(identifier);
      },

      refreshAttribute: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        this._model.refreshAttribute(elementInfo.objectIndex, elementInfo.name);
      },

      setupArguments: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        var onKilled = (function() {
          this._model.refreshMethodDescription(elementInfo.objectIndex,
                                               elementInfo.name);
        }).bind(this);
        this._taskManagerInterface.createPopupTask(
            setupArgumentsTask.createTask,
            [elementInfo.argsSpec, elementInfo.args], true, onKilled);
      },

      enterAttribute: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        if (elementInfo.callable) {
          return this._callMethod(
              elementInfo.objectIndex, elementInfo.name, elementInfo.args);
        }
        if (elementInfo.testModule) {
          if (!elementInfo.childTask) {
            this._createElementChildTask(elementInfo);
          }
          this._taskManagerInterface.switchToTask(elementInfo.childTask);
        }
      },

      selectAttribute: function(identifier) {
        var elementInfo = this._model.elements[identifier];
        if ('reference' in elementInfo) {
          this._saveReference(elementInfo);
        } else if ('objectIndex' in elementInfo) {
          this._saveOrResetAttribute(elementInfo);
        }
      },

      _callMethod: function(objectIndex, methodName, args) {
        try {
          var returnValue = this._model.objects[objectIndex][methodName].apply(
              this._model.objects[objectIndex], args);
          var id = this._model.appendMethodReturnValue(
              objectIndex, methodName, returnValue);
          if (mode.mode == mode.MODES.NORMAL) {
            this._model.shrinkMethodReturnValues(objectIndex, methodName, 1);
            this.enterAttribute(id);
          }
        } catch (e) {
          var ee = e instanceof window.Error ? utils.cloneError(e) : e;
          log.appendMessage(
              log.TYPES.ERROR, 'exception cought while calling method', ee);
        }
      },

      _initEventListeners: function() {
        this._eventHandlers = [];
        utils.iterateArray(interfaceSpecs, function(interfaceSpec) {
          var i = this._eventHandlers.length;
          this._eventHandlers.push({});
          utils.iterateDict(interfaceSpec, function(name, spec) {
            if (spec.type == 'event') {
              var handler = (function(eventObject) {
                this._model.appendEventObject(i, name, eventObject);
              }).bind(this);
              this._model.objects[i].addEventListener(name, handler);
              this._eventHandlers[i][name] = handler;
            }
          }, this);
        }, this);
      },

      _removeEventListeners: function() {
        var i = 0;
        utils.iterateArray(this._eventHandlers, function(eventHandlers) {
          utils.iterateDict(eventHandlers, function(name, eventHandler) {
            this._model.objects[i].removeEventListener(name, eventHandler);
          }, this);
          ++i;
        }, this);
      },

      _onModeChanged: function() {
        this._model.editable = (mode.mode === mode.MODES.ENGINEER);
      },

      _saveReference: function(elementInfo) {
        this._taskManagerInterface.createPopupTask(
            saveOrResetValueTask.createTask,
            [elementInfo.testModule.DEFAULT_ATTRS_PATH, elementInfo.reference],
            true);
      },

      _saveOrResetAttribute: function(elementInfo) {
        var objectIndex = elementInfo.objectIndex;
        var attrName = elementInfo.name;
        var spec = interfaceSpecs[objectIndex][attrName];
        var defaultAttrsPath;
        var value;
        if (spec.type == 'attribute') {
          defaultAttrsPath = elementInfo.testModule.DEFAULT_ATTRS_PATH;
          value = elementInfo.cachedValue;
        } else {
          defaultAttrsPath = [];
          value = this._model.objects[objectIndex][attrName];
        }
        var setValue = null;
        if (spec.writable || mode.mode == mode.MODES.ENGINEER) {
          setValue = (function(value) {
            if (spec.type == 'attribute') {
              this._setAttributeValue(objectIndex, attrName, value);
            } else {
              this._setValue(objectIndex, attrName, value);
            }
          }).bind(this);
        }
        this._taskManagerInterface.createPopupTask(
            saveOrResetValueTask.createTask,
            [defaultAttrsPath, value, setValue], true);
      },

      _setAttributeValue: function(objectIndex, attrName, value) {
        this._setValue(objectIndex, attrName, value);
        this._model.refreshAttribute(objectIndex, attrName);
      },

      _setValue: function(objectIndex, attrName, value) {
        try {
          this._model.objects[objectIndex][attrName] = value;
        } catch (e) {
          log.appendMessage(
              log.TYPES.ERROR,
              'exception cought while assigning value to attribute ' +
              '"' + attrName + '"',
              e instanceof window.Error ? utils.cloneError(e) : e);
        }
      },

      _onElementReferenceChanged: function(elementInfo) {
        if (elementInfo.testModule.needImmediateHandle) {
          this._createElementChildTask(elementInfo);
        }
      },

      _createElementChildTask: function(elementInfo) {
        var onKilled = function() {
          if (task === elementInfo.childTask) {
            elementInfo.childTask = null;
          }
        };

        var value;
        if ('reference' in elementInfo) {
          value = elementInfo.reference;
        } else {
          value = elementInfo.cachedValue;
        }

        var task = this._taskManagerInterface.createChildTask(
            elementInfo.testModule.createTask, [value],
            elementInfo.testModule.NAME, true, onKilled);
        elementInfo.childTask = task;
      }
    }, testTaskMaterial.ControllerInterface.prototype);

    return Controller;
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
