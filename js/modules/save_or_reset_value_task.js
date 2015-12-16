;(function(define) { 'use strict'; define(function(require, exports, module) {
  var saveOrResetValueTask = module.exports;

  var utils = require('libs/utils');
  var varTree = require('modules/var_tree');

  /**
   * Creates a task which asks user whether it should save a value to the
   * var tree or reset that value by a value got from the var tree.
   *
   * @param {Object} taskManagerInterface - Inteface to the task manager.
   * @param {Array} defaultAttrsPath - The default attrs-path of the var tree.
   * @param {Object} value - The value to be put into the var tree.
   * @param {Function?} setValue - The setter of that value for reseting the
   *     value.  If this argument is not callable, the reseting option will not
   *     be displayed.
   */
  saveOrResetValueTask.createTask = function(
      taskManagerInterface, defaultAttrsPath, value, setValue) {
    var container = document.createElement('gaia-list');

    container.appendChild(_createButton('Save to the VarTree', function() {
      taskManagerInterface.exec(
          varTree.createPutValueTask, [defaultAttrsPath, value]);
    }));

    if (setValue instanceof Function) {
      container.appendChild(_createButton('Reset from the VarTree', function() {
        taskManagerInterface.exec(
            varTree.createGetValueTask, [defaultAttrsPath, setValue]);
      }));
    }

    return {
      get view() {
        return container;
      },

      destroy: function() {
        taskManagerInterface = null;
        defaultAttrsPath = null;
        setValue = null;
        container = null;
      }
    };
  };

  var _createButton = function(title, onClickHandler) {
    var btn = document.createElement('gaia-button');
    utils.fillHTMLElementText(btn, title);
    btn.addEventListener('click', onClickHandler);
    btn.style.width = '100%';
    var a = document.createElement('a');
    a.appendChild(btn);
    return a;
  };

}); })((function(name, win) {
  /* global define, exports, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require, exports, module); } :
      function(c) {
        var module = {exports: {}};
        var require = function(name) { return win[name]; };
        win[name] = c(require, module.exports, module) || module.exports;
      };
})('modules/save_or_reset_value_task', this));
