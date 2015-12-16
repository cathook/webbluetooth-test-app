;(function(define) { 'use strict'; define(function(require) {
  var interfaceTestModule =
      require('modules/test_module_generater')._interfaceTestModule;

  var testModuleUtils = require('modules/test_module_utils');
  var testTaskMaterial = require('modules/test_task_material');
  var utils = require('libs/utils');

  var _emptyDescriptionMaintainer = {destroy: utils.noOperation};

  var _getArgumentsDescription = function(args) {
    var argsStr = [];
    utils.iterateArray(args, function(arg) {
      argsStr.push(utils.valueToSimpleString(arg));
    });
    return 'args: [' + argsStr.join(', ') + ']';
  };

  /**
   * Creates a model part's constructor.
   *
   * @returns {Function} The constructor.
   */
  interfaceTestModule._createModelClass = function(interfaceSpecs) {

    /**
     * Gets the valid test module of an attribute value.
     *
     * @param {number} objectIndex - Index of the object.
     * @param {string} attributeName - Name of the attribute.
     * @param {Object} attributeValue - Value of the attribute.
     *
     * @returns {Object} A test module.
     */
    var getAttributeTestModule = function(
        objectIndex, attributeName, attributeValue) {
      var testModules = interfaceSpecs[objectIndex][attributeName].testModules;
      return testModuleUtils.getValidTestModule(testModules, attributeValue);
    };

    /**
     * Gets the valid test module of a method's return value.
     *
     * @param {number} objectIndex - Index of the object.
     * @param {string} methodName - Name of the method.
     * @param {Object} returnValue - The method's return value.
     *
     * @returns {Object} A test module.
     */
    var getReturnValueTestModule = function(
        objectIndex, methodName, returnValue) {
      var testModules =
          interfaceSpecs[objectIndex][methodName].returnValueTestModules;
      return testModuleUtils.getValidTestModule(testModules, returnValue);
    };

    /**
     * Gets the valid test module of an event object.
     *
     * @param {number} objectIndex - Index of the object.
     * @param {string} eventName - Name of the event.
     * @param {Object} eventObject - The event object.
     *
     * @returns {Object} A test module.
     */
    var getEventObjectTestModule = function(
        objectIndex, eventName, eventObject) {
      var testModules =
          interfaceSpecs[objectIndex][eventName].eventObjectTestModules;
      return testModuleUtils.getValidTestModule(testModules, eventObject);
    };

    var Model = function(objects) {
      this._editable = false;
      this._objects = objects;
      this._elements = {};
      this._elementList = [];
      this._elementMap = [];
      this._uniqueIndex = 0;

      this._setupElements();
      this.refreshAllAttributes();
    };

    Model.prototype = Object.setPrototypeOf({
      CUSTOM_EVENTS: new utils.Enum(
        /**
         * Triggers if the reference in an element was changed.
         */
        'ELEMENT_REFERENCE_CHANGED'
      ),

      destroy: function() {
        utils.iterateArray(this._elementList, function(elementInfo) {
          if (elementInfo.descriptionMaintainer) {
            elementInfo.descriptionMaintainer.destroy();
          }
        });

        this._objects = null;
        this._elements = null;
        this._elementMap = null;
        this._elementList = null;
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

      get objects() {
        return this._objects;
      },

      orderedIterate: function(callback) {
        utils.iterateArray(this._elementList, function(elementInfo) {
          callback(elementInfo.identifier);
        });
      },

      /**
       * Refreshes a specific attribute.
       *
       * The value of each attribute will be cached and it will not be updated
       * automatically.
       *
       * @param {number} objectIndex - Index of the object.
       * @param {string} attrName - Name of the attribute.
       */
      refreshAttribute: function(objectIndex, attrName) {
        var elementInfo = this._elementMap[objectIndex][attrName];
        var currValue = this._objects[objectIndex][attrName];
        if (elementInfo.cachedValue !== currValue) {
          elementInfo.cachedValue = currValue;
          elementInfo.testModule =
              getAttributeTestModule(objectIndex, attrName, currValue);
          elementInfo.childTask = null;
          elementInfo.descriptionMaintainer.destroy();
          elementInfo.descriptionMaintainer =
              new elementInfo.testModule.DescriptionMaintainer(
                  currValue, elementInfo.descriptionSetter);
          this.fire(this.CUSTOM_EVENTS.ELEMENT_REFERENCE_CHANGED, elementInfo);
        }
      },

      /**
       * Refreshes all the attributes.
       */
      refreshAllAttributes: function() {
        utils.iterateArray(this._elementList, function(elementInfo) {
          if (elementInfo.refreshable) {
            this.refreshAttribute(elementInfo.objectIndex, elementInfo.name);
          }
        }, this);
      },

      /**
       * Refreshes a specific method's description.
       *
       * The description of a method is the arguments for that method.
       *
       * @param {number} objectIndex - Index of the object.
       * @param {string} methodName - Name of the method.
       */
      refreshMethodDescription: function(objectIndex, methodName) {
        var elementInfo = this._elementMap[objectIndex][methodName];
        elementInfo.description = _getArgumentsDescription(elementInfo.args);
        this.fire(this.EVENTS.ELEMENT_VALUE_CHANGED, elementInfo.identifier);
      },

      /**
       * Appends an method's return value.
       *
       * @param {number} objectIndex - Index of the object.
       * @param {string} methodName - Name of the method.
       * @param {Object} returnValue - The value to be appended.
       */
      appendMethodReturnValue: function(objectIndex, methodName, returnValue) {
        var elementInfo = this._elementMap[objectIndex][methodName];
        return this._appendRemovableElement(
            elementInfo,
            'return value ' + elementInfo.counter++,
            returnValue,
            getReturnValueTestModule(objectIndex, methodName, returnValue));
      },

      /**
       * Shrinks number of return values stored into a specific amount.
       *
       * @param {number} objectIndex - Index of the object.
       * @param {string} methodName - Name of the method.
       * @param {number} numReturnValues - The specific amount.
       */
      shrinkMethodReturnValues:
          function(objectIndex, methodName, numReturnValues) {
        this._shrinkRemovableElement(
            this._elementMap[objectIndex][methodName], numReturnValues);
      },

      /**
       * Appends an event object.
       *
       * @param {number} objectIndex - Index of the object.
       * @param {string} eventName - Name of the event.
       * @param {Object} eventObject - The value to be appended.
       */
      appendEventObject: function(objectIndex, eventName, eventObject) {
        var elementInfo = this._elementMap[objectIndex][eventName];
        return this._appendRemovableElement(
            elementInfo,
            'event object ' + elementInfo.counter++,
            eventObject,
            getEventObjectTestModule(objectIndex, eventName, eventObject));
      },

      /**
       * Shrinks number of event objects stored into a specific amount.
       *
       * @param {number} objectIndex - Index of the object.
       * @param {string} eventName - Name of the event.
       * @param {number} numEventObjects - The specific amount.
       */
      shrinkEventObjects: function(objectIndex, eventName, numEventObjects) {
        this._shrinkRemovableElement(
            this._elementMap[objectIndex][eventName], numEventObjects);
      },

      /**
       * Removes an element.
       *
       * @param {string} identifier - The identifier of the element to removed.
       */
      removeElement: function(identifier) {
        var elementInfo = this._elements[identifier];
        for (var i = elementInfo.index + 1; i < this._elementList.length; ++i) {
          this._elementList[i].index -= 1;
        }
        delete this._elements[identifier];
        this._elementList.splice(elementInfo.index, 1);
        if (elementInfo.owner) {
          elementInfo.owner.numChildElements -= 1;
        }

        this.fire(this.EVENTS.ELEMENT_REMOVED, elementInfo);
      },

      _appendRemovableElement: function(owner, name, value, testModule) {
        var elementInfo = {
          type: 'attribute',
          name: name,
          description: '',
          reference: value,
          removable: true,
          testModule: testModule,
          owner: owner,
          index: owner.index + 1,
        };
        this._insertElement(elementInfo);
        this.fire(this.EVENTS.ELEMENT_ADDED, elementInfo.identifier);
        owner.numChildElements += 1;

        var setDescription = (function(description) {
          elementInfo.description = description;
          this.fire(this.EVENTS.ELEMENT_VALUE_CHANGED, elementInfo.identifier);
        }).bind(this);
        elementInfo.descriptionMaintainer =
            new testModule.DescriptionMaintainer(value, setDescription);
        this.fire(this.CUSTOM_EVENTS.ELEMENT_REFERENCE_CHANGED, elementInfo);
        return elementInfo.identifier;
      },

      _shrinkRemovableElement: function(owner, numChildElements) {
        while (owner.numChildElements > numChildElements) {
          var index = owner.index + owner.numChildElements;
          this.removeElement(this._elementList[index].identifier);
        }
      },

      _appendTypeElement: {
        attribute: function(objectIndex, name, spec) {
          var elementInfo = {
            objectIndex: objectIndex,
            name: name,
            description: '',
            refreshable: true,
            cachedValue: this._objects[objectIndex][name] === null ? 0 : null,
            descriptionMaintainer: _emptyDescriptionMaintainer,
            descriptionSetter: (function(description) {
              elementInfo.description = description;
              this.fire(
                  this.EVENTS.ELEMENT_VALUE_CHANGED, elementInfo.identifier);
            }).bind(this)
          };
          if (spec.options) {
            elementInfo.type = 'options';
            elementInfo.options = Object.keys(spec.options);
          } else if (spec.switchable) {
            elementInfo.type = 'switch';
          } else {
            elementInfo.type = 'attribute';
          }
          this._appendElement(elementInfo);
          return elementInfo;
        },

        method: function(objectIndex, name, spec) {
          var args = [];
          var argsSpec = [];
          for (var i = 0; i < spec.argsSpec.length; ++i) {
            args.push(spec.argsSpec[i].defaultValue);
            argsSpec.push({
              name: utils.getDefault(spec.argsSpec[i], 'name', 'arg' + i),
              defaultAttrsPath:
                  utils.getDefault(spec.argsSpec[i], 'defaultAttrsPath', [])
            });
          }
          var elementInfo = {
            objectIndex: objectIndex,
            name: name,
            args: args,
            argsSpec: argsSpec,
            description: _getArgumentsDescription(args),
            callable: true,
            numChildElements: 0,
            counter: 0
          };
          this._appendElement(elementInfo);
          return elementInfo;
        },

        event: function(objectIndex, name, spec) {
          var elementInfo = {
            name: name + ' event objects:',
            numChildElements: 0,
            counter: 0
          };
          this._appendElement(elementInfo);
          return elementInfo;
        }
      },

      _appendElement: function(elementInfo) {
        elementInfo.index = this._elementList.length;
        this._elementList.push(elementInfo);

        elementInfo.identifier = this._getElementIdentifier();
        this._elements[elementInfo.identifier] = elementInfo;
      },

      _insertElement: function(elementInfo) {
        for (var i = elementInfo.index; i < this._elementList.length; ++i) {
          this._elementList[i].index += 1;
        }
        this._elementList.splice(elementInfo.index, 0, elementInfo);

        elementInfo.identifier = this._getElementIdentifier();
        this._elements[elementInfo.identifier] = elementInfo;
      },

      _getElementIdentifier: function() {
        this._uniqueIndex += 1;
        return '' + this._uniqueIndex;
      },

      _setupElements: function() {
        utils.iterateArray(interfaceSpecs, function(interfaceSpec) {
          var i = this._elementMap.length;
          this._elementMap.push({});
          utils.iterateDict(interfaceSpec, function(name, spec) {
            this._elementMap[i][name] =
                this._appendTypeElement[spec.type].call(this, i, name, spec);
          }, this);
        }, this);
      }
    }, testTaskMaterial.ModelInterface.prototype);

    return Model;
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
