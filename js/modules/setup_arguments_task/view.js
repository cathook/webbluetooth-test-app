(function(define) { 'use strict'; define(function(require) {
  var setupArgumentsTask = require('modules/setup_arguments_task');

  var setupArgumentsComponent = require('libs/setup_arguments_component');
  var utils = require('libs/utils');

  /**
   * View for the task for modifying an argument list.
   *
   * @constructor
   *
   * @param {Array} argumentNames - Name of the arguments.
   * @param {setupArgumentsTask._Controller} controller - Controller part of
   *     the task.
   * @param {setupArgumentsTask._Model} model - Model part of the task.
   */
  setupArgumentsTask._View = function(argumentNames, controller, model) {
    this._argumentNames = argumentNames;
    this._controller = controller;
    this._model = model;

    this._onModelValuesChanged = this._onModelValuesChanged.bind(this);
    this._onModelCanResizeStateChanged =
        this._onModelCanResizeStateChanged.bind(this);

    this._container = document.createElement('gaia-list');

    var btn = document.createElement('gaia-button');
    utils.fillHTMLElementText(btn, 'Add Argument');
    btn.addEventListener('click', controller.appendArgument.bind(controller));
    btn.style.width = '100%';

    this._addButton = document.createElement('div');
    this._addButton.appendChild(btn);
    this._container.appendChild(this._addButton);

    this._argumentElements = [];

    this._model.on(this._model.EVENTS.VALUES_CHANGED,
                   this._onModelValuesChanged);
    this._model.on(this._model.EVENTS.CAN_RESIZE_STATE_CHANGED,
                   this._onModelCanResizeStateChanged);

    this._onModelValuesChanged();
    this._onModelCanResizeStateChanged();
  };

  setupArgumentsTask._View.prototype = {
    destroy: function() {
      this._onModelCanResizeStateChanged = null;
      this._onModelValuesChanged = null;

      this._addButton = null;
      this._container = null;

      this._model = null;
      this._controller = null;
      this._argumentNames = null;
    },

    get container() {
      return this._container;
    },

    /**
     * Updates the view if the arguments array was changed.
     */
    _onModelValuesChanged: function() {
      this._resizeArgumentElements(this._model.values.length);
      for (var i = 0; i < this._model.values.length; ++i) {
        this._argumentElements[i].value =
            utils.valueToSimpleString(this._model.values[i]);
      }
    },

    /**
     * Updates the view if the state for whether the arguments array is
     * resizable was changed.
     */
    _onModelCanResizeStateChanged: function() {
      this._addButton.style.display = this._model.canResize ? '' : 'none';
    },

    /**
     * Resizes the array of elements for displaying arguments.
     *
     * @param {nubmer} length - Length of the array of elements.
     */
    _resizeArgumentElements: function(length) {
      while (this._argumentElements.length > length) {
        this._container.removeChild(
            this._argumentElements[this._argumentElements.length - 1]);
        this._argumentElements.pop();
      }
      var addArgumentElement = (function(i) {
        var name = utils.getDefault(this._argumentNames, i, 'arg' + i);

        var element = new setupArgumentsComponent.Argument();
        element.name = name;
        element.addEventListener(
            element.EVENTS.ENTER,
            this._controller.resetArgument.bind(this._controller, i));
        element.addEventListener(
            element.EVENTS.REMOVE,
            this._controller.removeArgument.bind(this._controller, i));
        this._container.insertBefore(element, this._container.lastChild);

        this._argumentElements.push(element);
      }).bind(this);
      while (this._argumentElements.length < length) {
        addArgumentElement(this._argumentElements.length);
      }
    }
  };

}); })((function(w) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(n) { return w[n]; }); };
})(this));
