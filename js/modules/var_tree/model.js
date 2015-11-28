(function(define) { 'use strict'; define(function(require) {
  var varTree = require('modules/var_tree');

  varTree._model = {};

  /**
   * @returns {Object} The global var tree root.
   */
  Object.defineProperty(varTree._model, 'root', {
    get: function() {
      return _root;
    }
  });

  /**
   * A pointer points to a node on a var tree.
   *
   * It stores whole path from the root to the node so if the tree structure
   * changed, it can detect something happened and do some update.
   *
   * @constructor
   * @param {Object} root - Tree root.
   */
  varTree._model.VarPointer = function(root) {
    this._attrsPath = [];
    this._instances = [{root: root}, root];
  };

  varTree._model.VarPointer.prototype = {
    /**
     * @returns {Array} The whole path from the root to the current node.
     */
    get attrsPath() {
      return this._attrsPath;
    },

    /**
     * @returns {Object} Current node value.
     */
    get value() {
      return this._instances[this._instances.length - 1];
    },

    /**
     * Sets the current node value.
     *
     * @param {Object} value - The new node value.
     */
    set value(value) {
      var attrName = 'root';
      if (this._attrsPath.length > 0) {
        attrName = this._attrsPath[this._attrsPath.length - 1];
      }
      this._instances[this._instances.length - 2][attrName] = value;
      this._instances[this._instances.length - 1] = value;
    },

    /**
     * @returns {Object} The tree root of the var pointer.
     */
    get root() {
      return this._instances[1];
    },

    /**
     * Destroys this var pointer.
     */
    destroy: function() {
      this._attrsPath = null;
      this._instances = null;
    },

    /**
     * Moves deeper.
     *
     * @param {string} attrName - The attribute to enter.
     * @returns {boolean} true if move successfully.
     */
    moveForward: function(attrName) {
      if (this._instances[this._instances.length - 1] instanceof Object) {
        var parentInstance = this._instances[this._instances.length - 1];
        if (attrName in parentInstance) {
          var childInstance = parentInstance[attrName];
          var index = 1;
          while (index < this._instances.length &&
                 this._instances[index] !== childInstance) {
            ++index;
          }
          if (index == this._instances.length) {
            this._attrsPath.push(attrName);
            this._instances.push(childInstance);
          } else {
            while (this._instances.length - 1 > index) {
              this.moveBackward();
            }
          }
          return true;
        }
      }
      return false;
    },

    /**
     * Moves toward root.
     *
     * @returns {boolean} true if move successfully.
     */
    moveBackward: function() {
      if (this._attrsPath.length > 0) {
        this._attrsPath.pop();
        this._instances.pop();
        return true;
      }
      return false;
    },

    /**
     * Creates a snapshot.
     *
     * @return {_VarPointerSnapShot} A snapshot.
     */
    createSnapShot: function() {
      return new _VarPointerSnapShot(this._attrsPath, this._instances);
    },

    /**
     * Checks whether the current state is equal to a snapshot or not.
     *
     * @return {boolean} True if it is equal to the snapshot.
     */
    isEqualToSnapShot: function(snapShot) {
      if (this._instances.length != snapShot.instances.length) {
        return false;
      }
      var i;
      for (i = 0; i < this._instances.length; ++i) {
        if (this._instances[i] !== snapShot.instances[i]) {
          return false;
        }
      }
      for (i = 0; i < this._attrsPath.length; ++i) {
        if (this._attrsPath[i] != snapShot.attrsPath[i]) {
          return false;
        }
      }
      return true;
    },

    /**
     * Checks whether there is something changed on the path from the tree root
     * to the node.  If yes, move backward and return false.
     *
     * @returns {boolean} True if nothing happened.
     */
    beforeStartOperationsCheck: function() {
      for (var i = 0; i < this._attrsPath.length; ++i) {
        var parentInstance = this._instances[i + 1];
        var childInstance = this._instances[i + 2];
        var attrName = this._attrsPath[i];
        if (parentInstance[attrName] !== childInstance) {
          this._attrsPath.splice(i, this._attrsPath.length - i);
          this._instances.splice(i + 2, this._instances.length - (i + 2));
          return false;
        }
      }
      return true;
    }
  };

  /**
   * A snapshot of a var pointer.
   *
   * @param {Array} attrsPath - The attributes path.
   * @param {Object} instances - Instances along the path.
   */
  var _VarPointerSnapShot = function(attrsPath, instances) {
    this.attrsPath = attrsPath.slice(0);
    this.instances = instances.slice(0);
  };

  /**
   * Global var tree root.
   *
   * @type {Object}
   * @private
   */
  var _root = {};

}); })((function(w) {
  /* global define, require, module */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(n) { return w[n]; }); };
})(this));
