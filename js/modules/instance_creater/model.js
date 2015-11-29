;(function(define) { 'use strict'; define(function(require) {
  var instanceCreater = require('modules/instance_creater');

  var utils = require('libs/utils');

  instanceCreater._model = {};

  /**
   * Gets the information about a class by the given class constructor.
   *
   * @param {Function} classConstructor - Constructor of the class.
   * @returns {_ClassInfo} class information.
   */
  instanceCreater._model.getClassInfoByClassConstructor =
      function(classConstructor) {
    var ret = null;
    utils.iterateDict(_classInfos, function(className, classInfo) {
      if (classInfo.classConstructor === classConstructor) {
        ret = classInfo;
        return false;
      }
    });
    return ret;
  };

  /**
   * Gets the information about a class by the given class name.
   *
   * @param {string} className - Name of the class.
   * @returns {_ClassInfo} class information.
   */
  instanceCreater._model.getClassInfoByClassName = function(className) {
    return _classInfos[className];
  };

  /**
   * Stores a class information.
   *
   * @param {string} className - Name of the class.
   * @param {Array} defaultAttrsPath - The default attrs-path of the var tree
   *     when the user want to store the instance created into the var tree.
   * @param {Function} classConstructor - Constructor of the class.
   * @param {Array} argumentsSpec - Spec of arguments of the constructor.
   * @param {Object?} task - Instance of the task for creating instance of this
   *     type of class.
   */
  instanceCreater._model.addClassInfo = function(
      className, defaultAttrsPath, classConstructor, argumentsSpec, task) {
    var classInfo = new _ClassInfo(
        className, defaultAttrsPath, classConstructor, argumentsSpec, task);
    _classInfos[classInfo.className] = classInfo;
  };

  /**
   * Structures for storing information about a class.
   *
   * @constructor
   * @param {string} className - Name of the class.
   * @param {Array} defaultAttrsPath - The default attrs-path of the var tree
   *     when the user want to store the instance created into the var tree.
   * @param {Function} classConstructor - Constructor of the class.
   * @param {Array} argumentsSpec - Spec of arguments of the constructor.
   * @param {Object?} task - Instance of the task for creating instance of this
   *     type of class.
   */
  var _ClassInfo = function(
      className, defaultAttrsPath, classConstructor, argumentsSpec, task) {
    this.className = className;
    this.defaultAttrsPath = defaultAttrsPath;
    this.classConstructor = classConstructor;
    this.argumentsSpec = argumentsSpec;
    this.task = task;
  };

  var _classInfos = {};

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
