;(function(define) { 'use strict'; define(function(require, exports, module) {
  var utils = module.exports;

  /**
   * Iterates throught an `Array` like object.
   *
   * It is similar to `Array.prototype.forEach` but the type of the object is
   * not restrict to `Array` and only needs to support `.length` method and
   * `[index]` method.
   *
   * @param {Object} arr - Object to be iterated throught.
   * @param {Function} callback - Callback handler for each element.  It will be
   *     called with only one parameter as the element in the array.  Returns
   *     false to break the iteration.
   * @param {Object} [thisObj=this] - `this` object to be bound to the callback
   *     function.
   * @returns {boolean} `false` if it iterates all elements without broken by
   *     the callback function.
   */
  utils.iterateArray = function(arr, callback, thisObj) {
    thisObj = thisObj || this;
    for (var i = 0; i < arr.length; ++i) {
      if (callback.call(thisObj, arr[i]) === false) {
        return true;
      }
    }
    return false;
  };

  /**
   * Iterates throught a dictionary.
   *
   * @param {Object} dict - Object to be iterated throught.
   * @param {Function} callback - Callback handler for each element.  It will be
   *     called with 2 parameters, the first one is the key of the current
   *     iteration and the second one is the corrosponding value.  Returns false
   *     to break the iteration.
   * @param {Object} [thisObj=this] - `this` object to be bound to the callback
   *     function.
   * @returns {boolean} `false` if it iterates throught all elements without
   *     broken by the callback function.
   */
  utils.iterateDict = function(dict, callback, thisObj) {
    thisObj = thisObj || this;
    for (var key in dict) {
      if (callback.call(thisObj, key, dict[key]) === false) {
        return true;
      }
    }
    return false;
  };

  /**
   * Gets the corrosponding value from an object by giving the key and returns
   * a default value if the key is not in that object.
   *
   * @param {Object} obj - The object.
   * @param {string} key - The key.
   * @param {Object} defaultValue - The default value.
   * @returns {Object} `obj[key]` if `key` is in `obj`;  Otherwise
   *     `defaultValue`.
   */
  utils.getDefault = function(obj, key, defaultValue) {
    return key in obj ? obj[key] : defaultValue;
  };

  /**
   * Sets the corrosponding value of an object by giving key if the key is not
   * in that object.
   *
   * @param {Object} obj - The object.
   * @param {string} key - The key.
   * @param {Object} defaultValue - The default value.
   * @returns {Object} `obj`
   */
  utils.setDefault = function(obj, key, defaultValue) {
    if (!(key in obj)) {
      obj[key] = defaultValue;
    }
    return obj;
  };

  /**
   * Mixins another object to the giving object without overwrite the existing
   * key-value pairs.
   *
   * @param {Object} obj - The object.
   * @param {Object} defaults - The default object.
   * @returns {Object} The result object.
   */
  utils.fillDefaults = function(obj, defaults) {
    utils.iterateDict(defaults, function(key, value) {
      utils.setDefault(obj, key, value);
    });
    return obj;
  };

  /**
   * Wraps an object which contains lots of methods into a function.
   *
   * The created function will take its first argument as the method name and
   * delegates other arguments to the corrosponding method.
   *
   * @param {Object} obj - The object to be wrapped.
   * @returns {Function} The result function.
   */
  utils.objToFunc = function(obj) {
    return function() {
      var methodName = arguments[0];
      if (obj[methodName] instanceof Function) {
        var args = Array.prototype.slice.call(arguments, 1);
        return obj[methodName].apply(this, args);
      }
    };
  };

  /**
   * Fills the content of a html element by some text.
   *
   * @param {HTMLElement} element - The specified html element to be filled.
   * @param {string} text - The text value.
   * @returns {HTMLElement} `element`
   */
  utils.fillHTMLElementText = function(element, text) {
    element.innerHTML = '';
    element.appendChild(document.createTextNode(text));
    return element;
  };

  /**
   * Returns the typename of the given value.
   *
   * It is similar to the keyword `typeof` except that this function will
   * returns "null" instead of "object" if the gived value is `null`.
   *
   * @param {Object} value - The specified value.
   * @returns {string} The type name.
   */
  utils.typeToString = function(value) {
    if (value === null) {
      return 'null';
    }
    if (value instanceof Array) {
      return 'sequence';
    }
    return typeof value;
  };

  utils.valueToSimpleString = (function() {
    var _toStrings = {};
    _toStrings[utils.typeToString(undefined)] = (value) => 'undefined';
    _toStrings[utils.typeToString(null)] = (value) => 'null';
    _toStrings[utils.typeToString(0)] = (value) => value.toString();
    _toStrings[utils.typeToString(false)] = (value) => value.toString();
    _toStrings[utils.typeToString('')] = function(value) {
      if (value.length > 10) {
        value = value.substring(0, 7) + '...';
      }
      return '"' + value + '"';
    };
    _toStrings[utils.typeToString(function() {})] =
        (value) => 'function() { ... }';
    _toStrings[utils.typeToString([])] = (value) => '[...]';
    _toStrings[utils.typeToString({})] = (value) => '{...}';

    /**
     * Converts the gived value to a short string to represent it.
     *
     * @param {Object} value - The specified value to convert.
     * @returns {string} A string.
     */
    return function(value) {
      return _toStrings[utils.typeToString(value)](value);
    };
  })();

  utils.valueToString = (function() {
    var _toStrings = {};
    _toStrings[utils.typeToString(undefined)] = (value) => 'undefined';
    _toStrings[utils.typeToString(null)] = (value) => 'null';
    _toStrings[utils.typeToString(0)] = (value) => value.toString();
    _toStrings[utils.typeToString(false)] = (value) => value.toString();
    _toStrings[utils.typeToString('')] = (value) => '"' + value + '"';
    _toStrings[utils.typeToString(function() {})] =
        (value) => 'function() { ... }';
    _toStrings[utils.typeToString([])] = (value) => '[...]';
    _toStrings[utils.typeToString({})] = (value) => '{...}';

    /**
     * Converts the gived value to a string to represent it.
     *
     * @param {Object} value - The specified value to convert.
     * @returns {string} A string.
     */
    return function(value) {
      return _toStrings[utils.typeToString(value)](value);
    };
  })();

  /**
   * Does nothing.
   */
  utils.noOperation = function() {};

  /**
   * Creates a class with methods all do nothing.
   *
   * @param {Array} methodNames - Array of name of methods of the class.
   * @returns {Function} Constructor of that class.
   */
  utils.createVoidClass = function(methodNames) {
    if (!(methodNames instanceof Array)) {
      methodNames = arguments;
    }
    var constructor = function() {};
    constructor.prototype = {};
    utils.iterateArray(methodNames, function(methodName) {
      constructor.prototype[methodName] = utils.noOperation;
    });

    return constructor;
  };

  /**
   * Enumerate.
   *
   * @example
   * u = new utils.Enum('aaa', 'bbb', {CCC: 'ccc', DDD, 'ddd'});
   * console.log(u.aaa);  // aaa
   * console.log(u.bbb);  // aaa
   * console.log(u.CCC);  // ccc
   * console.log(u.ccc);  // undefined
   *
   * @constructor
   * @param {...string|Object} elements - If the parameter is a `string`, it
   *     adds that string into the enumerate list;  Otherwise it adds each
   *     key-pairs in the object into the enumerate list.
   */
  utils.Enum = function() {
    utils.iterateArray(arguments, function(element) {
      if ((typeof element) === 'string') {
        this[element] = element;
      } else {
        utils.iterateDict(
            element, function(key, value) { this[key] = value; }, this);
      }
    }, this);
    Object.freeze(this);
  };

  /**
   * Clones an error object into a dict.
   *
   * @param {Error} e - The error object.
   *
   * @returns {Object} - A dict.
   */
  utils.cloneError = function(e) {
    var ret = {};
    ['columnNumber', 'fileName', 'lineNumber', 'message', 'stack'].forEach(
        function(attrName) { ret[attrName] = e[attrName]; });
    return ret;
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
})('libs/utils', this));
