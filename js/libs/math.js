;(function(define) { 'use strict'; define(function(require, exports, module) {
  var math = module.exports;

  /**
   * A class for 2D vector.
   *
   * @constructor
   *
   * If no parameter is gived, it will initialize as a zero vector.
   * If only one parameter is gived, it will take the parameter as another
   * vector and copy from that vector.
   * Otherwise, it will take the first 2 parameters as x and y values.
   */
  math.Vector2D = function() {
    if (arguments.length === 0) {
      math.Vector2D.call(this, 0, 0);
    } else if (arguments.length == 1) {
      this.copyFrom(arguments[0]);
    } else {
      /**
       * X-value.

       * @type {number}
       */
      this.x = arguments[0];

      /**
       * Y-value.
       *
       * @type {number}
       */
      this.y = arguments[1];
    }
  };

  math.Vector2D.prototype = {
    /**
     * Clones this vector and returns it.
     *
     * @returns {math.Vector2D} The cloned one.
     */
    clone: function() {
      return new math.Vector2D(this.x, this.y);
    },

    /**
     * Copys x and y values from another vector.
     *
     * @param {math.Vector2D} v2 - The vector to copy from.
     * @returns {math.Vector2D} `this`.
     */
    copyFrom: function(v2) {
      this.x = v2.x;
      this.y = v2.y;
      return this;
    },

    /**
     * Adds this vector with another vector and returns the result.
     *
     * @param {math.Vector2D} v2 - The addend vector.
     * @returns {math.Vector2D} The result vector.
     */
    add: function(v2) {
      return new math.Vector2D(this.x + v2.x, this.y + v2.y);
    },

    /**
     * Substracts this vector with another vector and returns the result.
     *
     * @param {math.Vector2D} v2 - The subtrahend vector.
     * @returns {math.Vector2D} The result vector.
     */
    sub: function(v2) {
      return new math.Vector2D(this.x - v2.x, this.y - v2.y);
    },

    /**
     * Multiples this vector with a scalar.
     *
     * @param {number} s - The scalar.
     * @returns {math.Vector2D} The result vector.
     */
    mul: function(s) {
      return new math.Vector2D(this.x * s, this.y * s);
    },

    /**
     * Divides this vector with a scalar.
     *
     * @param {number} s - The scalar.
     * @returns {math.Vector2D} The result vector.
     */
    div: function(s) {
      var invs = 1 / s;
      return new math.Vector2D(this.x * invs, this.y * invs);
    },

    /**
     * Calculates the dot product of this vector and a specified vector.
     *
     * @param {math.Vector2D} v2 - The specified vector.
     * @returns {number} The dot product value.
     */
    dot: function(v2) {
      return this.x * v2.x + this.y * v2.y;
    },

    /**
     * Calculates the cross product of this vector and a specified vector.
     *
     * @param {math.Vector2D} v2 - The specified vector.
     * @returns {number} The cross product value.
     */
    cross: function(v2) {
      return this.x * v2.y - this.y * v2.x;
    },

    /**
     * Calculates the normalized version of this vector and returns it.
     *
     * @returns {math.Vector2D} A normalized vector.
     */
    normalize: function() {
      return this.div(this.length);
    },

    /**
     * Returns a vector created by rotating 90 degree counter-clockwise from
     * this vector.
     *
     * @returns {math.Vector2D} The result vector.
     */
    rotateRight: function() {
      return new math.Vector2D(-this.y, this.x);
    },

    /**
     * Returns a vector created by rotating a specified angle count-clockwise
     * from this vector.
     *
     * @param {number} angle - Amount of angle to rotate.
     * @returns {math.Vector2D} The result vector.
     */
    rotate: function(angle) {
      var xUnit = new math.Vector2D(Math.cos(-angle), Math.sin(-angle));
      return new math.Vector2D(xUnit.dot(this), xUnit.cross(this));
    },

    /**
     * @returns {number} The length of this vector.
     */
    get length() {
      return Math.sqrt(this.length2);
    },

    /**
     * @returns {number} Square of the length of this vector.
     */
    get length2() {
      return this.x * this.x + this.y * this.y;
    },
  };

  /**
   * Transforms the angle unit from degree to radius.
   *
   * @param {number} angle - Angle with unit being degree.
   * @returns {number} Angle with unit being radius.
   */
  math.toRadius = angle => angle / 180 * Math.PI;

  /**
   * Transforms the angle unit from radius to degree.
   *
   * @param {number} angle - Angle with unit being radius.
   * @returns {number} Angle with unit being degree.
   */
  math.toDegree = angle => angle / Math.PI * 180;

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
})('libs/math', this));
