(function(define) { 'use strict'; define(function(require) {
  var varTree = require('modules/var_tree');

  var mode = require('modules/mode');

  varTree._controller = {};

  /**
   * A task for editing the var tree.
   *
   * @param {Object} taskManagerInterface - The interface to the task manager.
   * @param {varTree._model.VarPointer} varPointer - The var pointer.
   * @param {Function} viewCreater - A function to create the view.
   * @param {boolean} rootCanReset - Whether the root can reset or not.
   * @param {boolean} defaultReadOnly - Read only in normal mode or not.
   * @param {Function} onSelect - Handler for user pressed the select button.
   */
  varTree._controller.VarTreeTask = function(taskManagerInterface,
                                             varPointer, viewCreater,
                                             rootCanReset, defaultReadOnly,
                                             onSelect) {
    this._taskManagerInterface = taskManagerInterface;
    this._view = viewCreater(this);
    this._varPointer = varPointer;
    this._rootCanReset = rootCanReset;
    this._defaultReadOnly = defaultReadOnly;
    this._onSelect = onSelect;
    this._destroyed = false;
    this._modeSwitched = this.modeSwitched.bind(this);

    this._resetView();

    mode.on(mode.EVENTS.MODE_CHANGED, this._modeSwitched);
  };

  varTree._controller.VarTreeTask.prototype = {
    /**
     * Cleans up the references.
     */
    destroy: function() {
      mode.off(mode.EVENTS.MODE_CHANGED, this._modeSwitched);

      this._appInterface = null;
      this._view = null;
      this._varPointer.destroy();
      this._varPointer = null;
      this._onSelect = null;

      this._destroyed = true;
    },

    get view() {
      return this._view;
    },

    /**
     * @returns {Object} The root of this var tree.
     */
    get root() {
      return this._varPointer.root;
    },

    /**
     * Kills this task.
     */
    kill: function() {
      this._taskManagerInterface.exit();
    },

    /**
     * Event handler for mode switched.
     */
    modeSwitched: function() {
      this._varPointer.beforeStartOperationsCheck();
      this._updateMode();
    },

    /**
     * Event handler for user pressed the select button on the view.
     */
    viewSelected: function() {
      if (!this._beforeStartOperationsCheck()) {
        return;
      }
      this._onSelect(this._varPointer);
      this._taskManagerInterface.exit();
    },

    /**
     * Event handler for user pressed the cancel button on the view.
     */
    viewCanceled: function() {
      this._taskManagerInterface.exit();
    },

    /**
     * Event handler for user pressed the reset button on the view.
     */
    viewReseted: function() {
      if (!this._beforeStartOperationsCheck()) {
        return;
      }
      var snapShot = this._varPointer.createSnapShot();
      var resetValueHandler = (function(value) {
        if (!this.destroyed) {
          if (!this._beforeStartOperationsCheck()) {
            return;
          }
          if (!this._varPointer.isEqualToSnapShot(snapShot)) {
            return false;
          }
          this._varPointer.value = value;
          this._resetView();
        }
      }).bind(this);
      this._taskManagerInterface.createPopupTask(
          varTree.createResetValueTask, [[], resetValueHandler], true);
    },

    /**
     * Event handler for user add an attribute on the view.
     *
     * @param {Object} evtObj - Event object.
     */
    viewAttrAdded: function(evtObj) {
      if (!this._beforeStartOperationsCheck()) {
        return;
      }
      var attrName = evtObj.detail.attrName;
      if (this._varPointer.value instanceof Array && attrName === '') {
        attrName = this._varPointer.value.length;
        this._varPointer.value.push(null);
      } else {
        this._varPointer.value[attrName] = null;
      }
      this._view.setDataAttr(attrName, null);
    },

    /**
     * Event handler for user removed an attribute on the view.
     *
     * @param {Object} evtObj - Event object.
     */
    viewAttrRemoved: function(evtObj) {
      if (!this._beforeStartOperationsCheck()) {
        return;
      }
      var attrName = evtObj.detail.attrName;
      delete this._varPointer.value[attrName];
      this._view.removeDataAttr(attrName);
    },

    /**
     * Event handler for user clicked an attribute on the view.
     *
     * @param {Object} evtObj - Event object.
     */
    viewAttrClicked: function(evtObj) {
      if (!this._beforeStartOperationsCheck()) {
        return;
      }
      var attrName = evtObj.detail.attrName;
      if (!this._varPointer.moveForward(attrName)) {
        return;
      }
      this._resetView();
    },

    /**
     * Event handler for user clicked an attributes path on the view.
     *
     * @param {Object} evtObj - Event object.
     */
    viewAttrsPathClicked: function(evtObj) {
      if (!this._beforeStartOperationsCheck()) {
        return;
      }
      var length = evtObj.detail.attrsPathLength;
      while (this._varPointer.attrsPath.length > length - 1) {
        this._varPointer.moveBackward();
      }
      this._view.cutAttrsPath(length);
      this._view.setDataValue(this._varPointer.value);
      this._updateMode();
    },

    /**
     * Checks whether the var tree is modified by someone else.
     */
    _beforeStartOperationsCheck: function() {
      if (!this._varPointer.beforeStartOperationsCheck()) {
        this._resetView();
        return false;
      }
      return true;
    },

    /**
     * Resets the whole view.
     */
    _resetView: function() {
      this._view.reset(this._varPointer.attrsPath, this._varPointer.value);
      this._updateMode();
    },

    /**
     * Updates the canModify/canReset/... modes.
     */
    _updateMode: function() {
      var isAtRoot = this._varPointer.root === this._varPointer.value;
      if (mode.mode == mode.MODES.NORMAL) {
        this._view.canModifyAttrs = !this._defaultReadOnly;
        this._view.canReset =
            !this._defaultReadOnly && (isAtRoot ? this._rootCanReset : true);
      } else {
        this._view.canModifyAttrs = true;
        this._view.canReset = isAtRoot ? this._rootCanRset : true;
      }
    }
  };

  /**
   * A task for reset a value.
   *
   * @param {Object} taskManagerInterface - The interface to the task manager.
   * @param {Function} viewCreater - A function to create the view.
   * @param {Array} defaultAttrsPath - The default attrs path.
   * @param {Function} onResetValue - Handler for user selected the value.
   */
  varTree._controller.ResetValueTask = function(
      taskManagerInterface, viewCreater, defaultAttrsPath, onResetValue) {
    this._taskManagerInterface = taskManagerInterface;
    this._view = viewCreater(this);
    this._onResetValue = onResetValue;
    this._defaultAttrsPath = defaultAttrsPath;
  };

  varTree._controller.ResetValueTask.prototype = {
    get view() {
      return this._view;
    },

    destroy: function() {
      this._taskManagerInterface = null;
      this._view = null;
      this._onResetValue = null;
      this._defaultAttrsPath = null;
    },

    /**
     * Event handlers for user select a value on view.
     *
     * @param {Object} evtObj - The event object.
     */
    valueSelected: function(evtObj) {
      var value = evtObj.detail.value;
      this._onResetValue(value);
      this._taskManagerInterface.exit();
    },

    /**
     * Event handlers for user choose to select value from the global var tree.
     */
    selectFromVarTree: function() {
      this._taskManagerInterface.exec(
          varTree.createGetValueTask,
          [this._defaultAttrsPath, this._onResetValue]);
    }
  };

}); })((function(w) {
  /* global define, require, module */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(n) { return w[n]; }); };
})(this));
