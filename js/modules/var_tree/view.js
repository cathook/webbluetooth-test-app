(function(define) { 'use strict'; define(function(require) {
  var varTree = require('modules/var_tree');

  var varTreeComponent = require('libs/var_tree_component');

  varTree._view = {};

  varTree._view.createVarTreeTaskView = function(controller) {
    var view = new varTreeComponent.VarTreeTask();

    view.addEventListener(
        view.EVENTS.ATTR_ADDED, controller.viewAttrAdded.bind(controller));
    view.addEventListener(
        view.EVENTS.ATTR_REMOVED, controller.viewAttrRemoved.bind(controller));
    view.addEventListener(
        view.EVENTS.ATTR_CLICKED, controller.viewAttrClicked.bind(controller));
    view.addEventListener(
        view.EVENTS.ATTRS_PATH_CLICKED,
        controller.viewAttrsPathClicked.bind(controller));
    view.addEventListener(
        view.EVENTS.RESETED, controller.viewReseted.bind(controller));
    view.addEventListener(
        view.EVENTS.SELECTED, controller.viewSelected.bind(controller));
    view.addEventListener(
        view.EVENTS.CANCELED, controller.viewCanceled.bind(controller));

    return view;
  };

  varTree._view.createResetValueTaskView = function(controller) {
    var view = varTreeComponent.ResetValueTask();

    view.addEventListener(
        view.EVENTS.VALUE_SELECTED, controller.valueSelected.bind(controller));
    view.addEventListener(
        view.EVENTS.SELECT_FROM_VAR_TREE,
        controller.selectFromVarTree.bind(controller));

    return view;
  };

}); })((function(w) {
  /* global define, require, module */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(n) { return w[n]; }); };
})(this));
