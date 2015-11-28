(function(define) { 'use strict'; define(function(require, exports, module) {
  var pageWall = module.exports;

  var component = require('gaia-component');
  var math = require('libs/math');
  var touchGesture = require('libs/touch_gesture');
  var utils = require('libs/utils');

  /**
   * Custom HTMLElement for managing pages in horizontal.
   *
   * @class
   */
  pageWall.PageWall = component.register('app-page-wall', {
    created: function() {
      var shadowRoot = this.setupShadowRoot();

      /**
       * Outer div element.
       *
       * @type {HTMLElement}
       * @private
       */
      this._outer = shadowRoot.getElementById('outer');

      /**
       * Viewport div element.
       *
       * @type {HTMLElement}
       * @private
       */
      this._viewport = shadowRoot.getElementById('viewport');

      /**
       * References to gesture managers.
       *
       * @type {Object}
       * @private
       */
      this._gestureManagers = {};

      /**
       * Index of the foreground page.
       *
       * @type {number}
       * @private
       */
      this._fgIndex = 0;

      /**
       * Offset X of the viewport.
       *
       * @type {number}
       * @private
       */
      this._offsetX0 = 0;
    },

    attached: function() {
      this._initGestureManagers();
    },

    detached: function() {
      this._destroyGestureManagers();
    },

    attrs: {
      /**
       * The foreground page.
       *
       * @type {HTMLElement}
       */
      foregroundPage: {
        get() {
          var page = null;
          var index = 0;
          utils.iterateArray(this.children, function(child) {
            if (!(child instanceof pageWall.Page)) {
              return;
            }
            if (index == this._fgIndex) {
              page = child;
              return false;
            }
            ++index;
          }, this);
          return page;
        }
      }
    },

    EVENTS: new utils.Enum({
      /**
       * Triggers on foreground page is changed.
       */
      FOREGROUND_PAGE_CHANGED: 'foregroundPageChanged'
    }),

    /**
     * Slides to the page at the left side.
     */
    slideToLeft: function() {
      var oldFgIndex = this._fgIndex;

      this._fgIndex =
          Math.max(0, Math.min(this._fgIndex - 1, this._getNumPages() - 1));

      this._slideViewport();

      if (oldFgIndex != this._fgIndex) {
        this._fireForegroundChangedEvent();
      }
    },

    /**
     * Slides to the page at the right side.
     */
    slideToRight: function() {
      var oldFgIndex = this._fgIndex;

      this._fgIndex =
          Math.max(0, Math.min(this._fgIndex + 1, this._getNumPages() - 1));

      this._slideViewport();

      if (oldFgIndex != this._fgIndex) {
        this._fireForegroundChangedEvent();
      }
    },

    /**
     * Slides to the specified page.
     *
     * @param {pagewall.Page} page - The specified page.
     */
    slideToPage: function(page) {
      var oldFgIndex = this._fgIndex;

      this._fgIndex = 0;
      utils.iterateArray(this.children, function(child) {
        if (!(child instanceof pageWall.Page)) {
          return;
        }
        if (child === page) {
          return false;
        }
        ++this._fgIndex;
      }, this);
      this._slideViewport();

      if (oldFgIndex != this._fgIndex) {
        this._fireForegroundChangedEvent();
      }
    },

    /**
     * Initializes the gesture managers and listens the gesture events.
     */
    _initGestureManagers: function() {
      var xPos = new math.Vector2D(1, 0);
      var xNeg = new math.Vector2D(-1, 0);
      var tg = touchGesture;

      this._gestureManagers.drag = new tg.DirectionalMove(this._outer, xPos);
      this._gestureManagers.drag.on('start',
                                    this._initOffsetViewport.bind(this));
      this._gestureManagers.drag.on('move', (function(amount) {
        this._offsetViewport(amount);
      }).bind(this));
      this._gestureManagers.drag.on('end', this._slideViewport.bind(this));

      this._gestureManagers.slideLeft = new tg.Slide(this._outer, xNeg);
      this._gestureManagers.slideLeft.on('slide', this.slideToRight.bind(this));

      this._gestureManagers.slideRight = new tg.Slide(this._outer, xPos);
      this._gestureManagers.slideRight.on('slide', this.slideToLeft.bind(this));
    },

    /**
     * Destroys all useless gesture managers.
     */
    _destroyGestureManagers: function() {
      utils.iterateDict(this._gestureManagers, function(name, instance) {
        instance.destroy();
      });
      this._gestureManagers = {};
    },

    /**
     * Slides the viewport to the right place.
     */
    _slideViewport: function() {
      this._viewport.style.left = -this._fgIndex * 100 + '%';
      this._viewport.style.transition = '0.3s';
    },

    /**
     * Initializes for the drag event.
     */
    _initOffsetViewport: function() {
      this._offsetX0 = this._viewport.offsetLeft;
      this._offsetViewport(0);
    },

    /**
     * Moves the viewport to the right place according to the drag event.
     */
    _offsetViewport: function(offset) {
      this._viewport.style.left = this._offsetX0 + offset + 'px';
      this._viewport.style.transition = '';
    },

    /**
     * Fires the custom event for notifying that the foreground page is changed.
     */
    _fireForegroundChangedEvent: function() {
      this.dispatchEvent(new CustomEvent(this.EVENTS.FOREGROUND_PAGE_CHANGED,
                                         {bubbles: true}));
    },

    /**
     * Gets number of pages in this pagewall.
     */
    _getNumPages: function() {
      var numPages = 0;
      utils.iterateArray(this.getElementsByTagName('app-page-wall-page'),
                         function(element) {
                           numPages += element.parentElement == this ? 1 : 0;
                         },
                         this);
      return numPages;
    },

    template: `
      <div id="outer">
        <div id="viewport">
          <content select="app-page-wall-page"></content>
        </div>
      </div>

      <style>
        #outer {
          height: 100%;
          overflow: hidden;
          position: absolute;
          width: 100%;
        }

        #viewport {
          display: flex;
          flex-direction: row;
          height: 100%;
          position: absolute;
          width: 100%;
        }
      </style>
    `
  });

  /**
   * Custom HTMLElement for a page in the `app-page-wall`.
   *
   * @class
   */
  pageWall.Page = component.register('app-page-wall-page', {
    created: function() {
      this.setupShadowRoot();
    },

    template: `
      <content></content>

      <style>
        ::host {
          flex: 0 0 auto;
          height: 100%;
          overflow: hidden;
          width: 100%;
        }
      </style>
    `
  });

}); })((function(n, w) {
  /* global define, exports, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require, exports, module); } :
      function(c) {
        var m = {exports: {}};
        var r = function(n) { return w[n]; };
        w[n] = c(r, m.exports, m) || m.exports;
      };
})('libs/page_wall', this));
