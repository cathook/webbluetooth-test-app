;(function(define) { 'use strict'; define(function(require) {
  var instanceCreater = require('modules/instance_creater');

  var instanceCreaterComponent = require('libs/instance_creater_component');
  var utils = require('libs/utils');

  instanceCreater._view = {};

  /**
   * The view element for the long life task.
   *
   * @type {HTMLElement}
   */
  instanceCreater._view.longLifeWindow = document.createElement('div');

  /**
   * Adds a class.
   *
   * @param {string} className - Name of the class.
   * @param {Function} onClickHandler - Handler handles the case that the user
   *     want to create this kind of instance.
   */
  instanceCreater._view.addClass = function(className, onClickHandler) {
    var button = document.createElement('gaia-button');
    button.addEventListener('click', onClickHandler);
    utils.fillHTMLElementText(button, className);
    instanceCreater._view.longLifeWindow.appendChild(button);
  };

  /**
   * Creates the create instance task's view.
   *
   * @param {string} className - Name of the class.
   * @param {instanceCreater._controller.CreateInstanceTask} controller -
   *     Controller part of the task.
   *
   * @return {HTMLElement} The view.
   */
  instanceCreater._view.createCreateInstanceTaskView =
      function(className, controller) {
    var view = new instanceCreaterComponent.InstanceCreater();

    view.addEventListener(view.EVENTS.RESET_ARGS,
                          controller.resetArgs.bind(controller));
    view.addEventListener(view.EVENTS.SETUP_ARGS,
                          controller.setupArgs.bind(controller));
    view.addEventListener(view.EVENTS.CREATE_INSTANCE,
                          controller.createInstance.bind(controller));

    return view;
  };

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
