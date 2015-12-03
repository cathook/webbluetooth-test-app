;(function(define) { 'use strict'; define(function(require) {
  var testTaskMaterial = require('modules/test_task_material');

  var testTaskComponent = require('libs/test_task_component');
  var utils = require('libs/utils');

  /**
   * The view part of a test task.
   *
   * It listens the events triggered from the model and renders the data
   * to the front-end.  It also call the controller's methods while it
   * cought input signal from the user.
   *
   * @constructor
   * @param {Object} controller - The controller part of the whole task.  It
   *     should implements the interface `testTaskMaterial.ControllerInterface`.
   * @param {Object} model - The model part of the whole task.  It
   *     should implements the interface `testTaskMaterial.ModelInterface`.
   */
  testTaskMaterial.View = function(controller, model) {
    this._controller = controller;
    this._model = model;

    this._container = document.createElement('gaia-list');
    this._saveToVarTreeButton = document.createElement('gaia-button');
    this._editByVarTreeButton = document.createElement('gaia-button');

    this._onElementAdded = this._onElementAdded.bind(this);
    this._onElementRemoved = this._onElementRemoved.bind(this);
    this._onElementValueChanged = this._onElementValueChanged.bind(this);
    this._onEditableStateChanged = this._onEditableStateChanged.bind(this);

    this._model.on(this._model.EVENTS.ELEMENT_ADDED, this._onElementAdded);
    this._model.on(this._model.EVENTS.ELEMENT_REMOVED, this._onElementRemoved);
    this._model.on(this._model.EVENTS.ELEMENT_VALUE_CHANGED,
                   this._onElementValueChanged);
    this._model.on(this._model.EVENTS.EDITABLE_STATE_CHANGED,
                   this._onEditableStateChanged);

    this._saveToVarTreeButton.addEventListener(
        'click', this._controller.saveToVarTree.bind(this._controller));
    this._editByVarTreeButton.addEventListener(
        'click', this._controller.editByVarTree.bind(this._controller));

    this._saveToVarTreeButton.style.flex = '1 0 auto';
    this._editByVarTreeButton.style.flex = '1 0 auto';

    this._children = [];

    utils.fillHTMLElementText(this._saveToVarTreeButton, 'Save To Var-Tree');
    utils.fillHTMLElementText(this._editByVarTreeButton, 'Edit By Var-Tree');
    var div = document.createElement('div');
    div.style.display = 'flex';
    div.style['flex-direction'] = 'row';
    div.appendChild(this._saveToVarTreeButton);
    div.appendChild(this._editByVarTreeButton);
    this._container.appendChild(div);

    this._children.push(div);

    this._model.orderedIterate(this._onElementAdded);
    this._onEditableStateChanged();
  };

  testTaskMaterial.View.prototype = {
    destroy: function() {
      this._children = null;
      this._onEditableStateChanged = null;
      this._onElementValueChanged = null;
      this._onElementRemoved = null;
      this._onElementAdded = null;
      this._editByVarTreeButton = null;
      this._saveToVarTreeButton = null;
      this._container = null;
      this._model = null;
      this._controller = null;
    },

    get container() {
      return this._container;
    },

    _onElementAdded: function(identifier) {
      var elementInfo = this._model.elements[identifier];
      if (elementInfo.type == 'options') {
        this._addOption(elementInfo);
      } else if (elementInfo.type == 'switch') {
        this._addSwitch(elementInfo);
      } else {
        this._addAttribute(elementInfo);
      }
    },

    _addOption: function(elementInfo) {
      var e = new testTaskComponent.Buttons();
      utils.iterateArray(
          elementInfo.options, function(option) { e.addButton(option); });
      e.addEventListener(e.EVENTS.BUTTON_CLICKED, (function(evtObj) {
        this._controller.chooseOption(
            elementInfo.identifier, evtObj.detail.buttonTitle);
      }).bind(this));
      this._insertElement(elementInfo.index, e);
    },

    _addSwitch: function(elementInfo) {
      var e = new testTaskComponent.Switch();
      e.setTitle(elementInfo.name);
      if ('value' in elementInfo) {
        e.setDescription(utils.valueToString(elementInfo.value));
      } else if ('description' in elementInfo) {
        e.setDescription(elementInfo.description);
      }
      e.addEventListener(e.EVENTS.TURN_ON, (function() {
        this._controller.turnOn(elementInfo.identifier);
      }).bind(this));
      e.addEventListener(e.EVENTS.TURN_OFF, (function() {
        this._controller.turnOff(elementInfo.identifier);
      }).bind(this));
      this._insertElement(elementInfo.index, e);
    },

    _addAttribute: function(elementInfo) {
      var e = new testTaskComponent.Attribute();
      var icon;
      e.setTitle(elementInfo.name);
      if ('value' in elementInfo) {
        e.setDescription(utils.valueToString(elementInfo.value));
      } else if ('description' in elementInfo) {
        e.setDescription(elementInfo.description);
      }
      if (elementInfo.removable) {
        icon = testTaskComponent.createRemoveIcon();
        icon.addEventListener('click', (function() {
          this._controller.removeAttribute(elementInfo.identifier);
        }).bind(this));
        e.attachLeftButton(icon);
      }
      if (elementInfo.refreshable) {
        icon = testTaskComponent.createRefreshIcon();
        icon.addEventListener('click', (function() {
          this._controller.refreshAttribute(elementInfo.identifier);
        }).bind(this));
        e.attachLeftButton(icon);
      }
      if (elementInfo.callable) {
        icon = testTaskComponent.createSetupArgumentsIcon();
        icon.addEventListener('click', (function() {
          this._controller.setupArguments(elementInfo.identifier);
        }).bind(this));
        e.attachRightButton(icon);
      }
      e.addEventListener(e.EVENTS.ENTER, (function() {
        this._controller.enterAttribute(elementInfo.identifier);
      }).bind(this));
      e.addEventListener(e.EVENTS.LONG_PRESS, (function() {
        this._controller.selectAttribute(elementInfo.identifier);
      }).bind(this));
      this._insertElement(elementInfo.index, e);
    },

    _onElementRemoved: function(elementInfo) {
      var index = elementInfo.index;
      this._container.removeChild(this._children[index]);
      this._children.splice(index, 1);
    },

    _onElementValueChanged: function(identifier) {
      var elementInfo = this._model.elements[identifier];
      var index = elementInfo.index;
      if ('value' in elementInfo) {
        this._children[index].setDescription(
            utils.valueToString(elementInfo.value));
      } else if ('description' in elementInfo) {
        this._children[index].setDescription(elementInfo.description);
      }
    },

    _onEditableStateChanged: function() {
      this._editByVarTreeButton.style.display =
          this._model.editable ? '' : 'none';
    },

    _insertElement: function(index, element) {
      this._children.splice(index, 0, element);
      this._container.insertBefore(element, this._children[index + 1]);
    }
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
