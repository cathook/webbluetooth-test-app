;(function(define) { 'use strict'; define(function(require, exports, module) {
  var pageList = module.exports;

  var component = require('gaia-component');
  var math = require('libs/math');
  var touchGesture = require('libs/touch_gesture');
  var utils = require('libs/utils');

  /**
   * Maintains each page's position.
   *
   * @constructor
   */
  var _PagePositionManager = function() {
    this._numElements = 0;
    this._theta0 = 0;
  };

  /**
   * Structures for storing information for a page's position.
   *
   * @constructor
   * @param {number} top - Top offset of the page.
   * @param {number} scale - Scale transform of the page.
   */
  _PagePositionManager.Position = function(top, scale) {
    this.top = top;
    this.scale = scale;
  };

  _PagePositionManager.prototype = {
    Position: _PagePositionManager.Position,

    /**
     * Resets to the initial state.
     */
    resetAngle: function() {
      this._theta0 =
          this._FIRST_PAGE_ANGLE + (this._numElements - 1) * this._DELTA_ANGLE;
    },

    /**
     * Changes the number of pages.
     *
     * @param {number} n - Number of pages.
     */
    resize: function(n) {
      this._numElements = n;
      this._ensureTheta0Valid();
    },

    /**
     * Updates each page's position by dragging gesture on the screen.
     *
     * @param {number} yFrom - The start point's vertical position in ratio.
     * @param {number} yTo - The end point's vertical position in ratio.
     */
    drag: function(yFrom, yTo) {
      var angle = Math.asin(1 - yFrom) - Math.asin(1 - yTo);

      this._theta0 -= angle;
      this._ensureTheta0Valid();
    },

    /**
     * Get i-th page's position.
     *
     * @param {number} index - The index of the page to get.
     * @return {_PagePositionManager.Position} The position of that page.
     */
    getPosition: function(index) {
      var angle = this._theta0 - index * this._DELTA_ANGLE;

      angle = Math.max(0, Math.min(Math.PI / 2, angle));

      var top = this._TOP_MIN +
                (this._TOP_MAX - this._TOP_MIN) * (1 - Math.sin(angle));
      var scale = this._SCALE_MIN +
                  (this._SCALE_MAX - this._SCALE_MIN) * Math.cos(angle);

      return new this.Position(top, scale);
    },

    /**
     * Ensures that the position of all pages is in range.
     */
    _ensureTheta0Valid: function() {
      if (this._theta0 < this._THETA0_LIMIT) {
        this._theta0 = this._THETA0_LIMIT;
      }

      var firstPageAngle =
          this._theta0 - (this._numElements - 1) * this._DELTA_ANGLE;
      if (firstPageAngle > this._FIRST_PAGE_ANGLE) {
        this.resetAngle();
      }
    },

    /**
     * The angle between two adjancent pages.
     *
     * @type {number}
     * @private
     */
    _DELTA_ANGLE: math.toRadius(20),

    /**
     * The maximum angle of the most foreground page.
     *
     * @type {number}
     * @private
     */
    _FIRST_PAGE_ANGLE: math.toRadius(30),

    /**
     * The minimum angle of the most background page.
     *
     * @type {number}
     * @private
     */
    _THETA0_LIMIT: math.toRadius(70),

    /**
     * Minimum value of `top` attribute of the CSS style of the page.
     *
     * @type {number}
     * @private
     */
    _TOP_MIN: 4,

    /**
     * Maximum value of `top` attribute of the CSS style of the page.
     *
     * @type {number}
     * @private
     */
    _TOP_MAX: 105,

    /**
     * Minimum value of scale percentage of the page.
     *
     * @type {number}
     * @private
     */
    _SCALE_MIN: 0.5,

    /**
     * Maximum value of scale percentage of the page.
     *
     * @type {number}
     * @private
     */
    _SCALE_MAX: 0.9
  };

  pageList.pageListController = (function() {
    var instances = [];
    var isSwitching = false;

    /**
     * @class
     * A singleton class for switching all page list's mode.
     */
    return {
      /**
       * Registers a new instance of page-list html element.
       *
       * @param {HTMLElement} instance - The instance of page list to register.
       */
      register: function(instance) {
        instances.push(instance);
        if (isSwitching) {
          instance.startSwitchPages();
        }
      },

      /**
       * Unregisters a new instance of page-list html element.
       *
       * @param {HTMLElement} instance - An instance of page list to unregister.
       */
      unregister: function(instance) {
        var index = instances.indexOf(instance);
        instances.splice(index, 1);
      },

      /**
       * Switches to the switching page mode.
       */
      startSwitchPages: function() {
        instances.forEach(function(instance) { instance.startSwitchPages(); });

        isSwitching = true;
      },

      /**
       * Switches to the normal mode.
       */
      stopSwitchPages: function() {
        instances.forEach(function(instance) { instance.stopSwitchPages(); });

        isSwitching = false;
      },

      /**
       * Toggles mode.
       */
      toggleSwitchPages: function() {
        if (isSwitching) {
          this.stopSwitchPages();
        } else {
          this.startSwitchPages();
        }
      },

      /**
       * Gets whether it is switching or not.
       *
       * @return {boolean} - True if in switching page mode.
       */
      get isSwitchingPages() {
        return isSwitching;
      }
    };
  })();

  /**
   * Custom HTMLElement for managing pages in vertical.
   *
   * @class
   */
  pageList.PageList = component.register('app-page-list', {
    created: function() {
      var shadowRoot = this.setupShadowRoot();

      /**
       * Viewport div.
       *
       * @type {HTMLElement}
       * @private
       */
      this._viewport = shadowRoot.getElementById('viewport');

      /**
       * Manager for maintaining page's positions while switching pages.
       *
       * @type {_PagePositionManager}
       * @private
       */
      this._pagePositionManager = new _PagePositionManager();

      /**
       * Numbers of pages.
       *
       * @type {number?}
       * @private
       */
      this._numPages = null;

      /**
       * Mutation observer for updating `this._pagePositionManager` if there is
       * page added/removed while switching page mode.
       *
       * @type {MutationObserver?}
       * @private
       */
      this._mutationObserver = null;

      /**
       * Last touch position.
       *
       * @type {number?}
       * @private
       */
      this._lastTouchHeight = null;

      /**
       * First touch position.
       *
       * @type {number?}
       * @private
       */
      this._firstTouchHeight = null;

      /**
       * Whether the mode is switching page or not.
       *
       * @type {number?}
       * @private
       */
      this._isSwitching = false;

      /**
       * Touch gesture detecteos.
       *
       * @type {Object}
       * @private
       */
      this._gestureManagers = {};
    },

    EVENTS: new utils.Enum({
      /**
       * Triggers iff the foreground page is changed.
       */
      FOREGROUND_PAGE_CHANGED: 'foregroundPageChanged'
    }),

    attached: function() {
      this._numPages = 0;
      this._forEachPage((function() { this._numPages += 1; }).bind(this));
      this._pagePositionManager.resize(this._numPages);

      this._initMutationObserver();
      this._initGestureManagers();

      pageList.pageListController.register(this);
    },

    detatched: function() {
      this._destroyMutationObserver();
      this._destroyGestureManagers();

      pageList.pageListController.unregister(this);
    },

    /**
     * Sets the mode to switching page mode.
     */
    startSwitchPages: function() {
      if (!this._isSwitching) {
        this._isSwitching = true;

        this._pagePositionManager.resetAngle();
        this._updateAllPagesPosition();

        this._forEachPage(this._updatePageMode.bind(this));
      }
    },

    /**
     * Sets the mode to normal mode.
     */
    stopSwitchPages: function() {
      if (this._isSwitching) {
        this._isSwitching = false;

        this._forEachPage(this._clearPageStyle.bind(this));

        this._forEachPage(this._updatePageMode.bind(this));
      }
    },

    /**
     * Switch the foreground page to the specific page.
     *
     * @param {HTMLElement} page - The page to be put the foreground.
     */
    switchToPage: function(page) {
      this.stopSwitchPages();
      for (var i = this.children.length - 2; i >= 0; --i) {
        if (this.children[i] === page) {
          this.appendChild(this.removeChild(page));

          this._dispatch(this.EVENTS.FOREGROUND_PAGE_CHANGED);
          break;
        }
      }
    },

    attrs: {
      /**
       * Whether this page list is under switching page mode.
       *
       * @type {boolean}
       */
      isSwitching: {
        get: function() {
          return this._isSwitching;
        }
      },

      /**
       * The foreground page.
       *
       * @type {HTMLElement}
       */
      foregroundPage: {
        get: function() {
          for (var i = this.children.length - 1; i >= 0; --i) {
            if (this.children[i] instanceof pageList.Page) {
              return this.children[i];
            }
          }
          return null;
        }
      }
    },

    /**
     * Updates a child page mode.
     *
     * @param {pageList.Page} page - The page to be setup.
     */
    _updatePageMode: function(page) {
      page.mode = this._isSwitching ? page.MODES.SWITCHING : page.MODES.NORMAL;
    },

    /**
     * Runs the gived callback for each child pages.
     *
     * @param {Function} func - The callback function.
     */
    _forEachPage: function(func) {
      utils.iterateArray(this.children, function(page) {
        if (page instanceof pageList.Page) {
          if (func(page) === false) {
            return false;
          }
        }
      });
    },

    /**
     * Initializes the mutation observer.
     */
    _initMutationObserver: function() {
      this._mutationObserver = new MutationObserver(
          this._mutationObserverCallback.bind(this));

      this._mutationObserver.observe(this, {childList: true});
    },

    /**
     * Destroys the mutation observer.
     */
    _destroyMutationObserver: function() {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    },

    /**
     * Initializes the touch gesture managers.
     */
    _initGestureManagers: function() {
      this._gestureManagers.move = new touchGesture.DirectionalMove(
          this._viewport, new math.Vector2D(0, 1));
      this._gestureManagers.move.on('start', this._moveStartHandler.bind(this));
      this._gestureManagers.move.on('move', this._movingHandler.bind(this));
      this._gestureManagers.move.on('end', this._moveEndHandler.bind(this));

      this._gestureManagers.click = new touchGesture.Click(this._viewport);
      this._gestureManagers.click.on('click', this._clickHandler.bind(this));
    },

    /**
     * Destroys the gesture managers.
     */
    _destroyGestureManagers: function() {
      utils.iterateDict(this._gestureManagers, function(name, instance) {
        instance.destroy();
      });
      this._gestureManager = {};
    },

    /**
     * Handler for a child node added/removed.
     */
    _mutationObserverCallback: function(mutations) {
      mutations.forEach(function(mutation) {
        utils.iterateArray(mutation.addedNodes, function(node) {
          if (node instanceof pageList.Page) {
            this._numPages += 1;
            this._updatePageMode(node);
          }
        }, this);
        utils.iterateArray(mutation.removedNodes, function(node) {
          if (node instanceof pageList.Page) {
            this._numPages -= 1;
          }
        }, this);
      }, this);
      this._pagePositionManager.resize(this._numPages);
      if (this._isSwitching) {
        this._updateAllPagesPosition();
      } else {
        this._dispatch(this.EVENTS.FOREGROUND_PAGE_CHANGED);
      }
    },

    /**
     * Handler for touch start.
     *
     * @param {math.Vector2D} pos - Position of the start point.
     */
    _moveStartHandler: function(pos) {
      if (this._isSwitching) {
        this._firstTouchHeight = pos.y / this._viewport.clientHeight;
        this._lastTouchHeight = this._firstTouchHeight;
      }
    },

    /**
     * Handler for touch move.
     *
     * @param {number} len - Length between the current position and the start
     *     position.
     */
    _movingHandler: function(len) {
      if (this._lastTouchHeight !== null) {
        var currHeight = Math.max(0, Math.min(1,
            this._firstTouchHeight + len / this._viewport.clientHeight));

        this._pagePositionManager.drag(this._lastTouchHeight, currHeight);
        this._updateAllPagesPosition();

        this._lastTouchHeight = currHeight;
      }
    },

    /**
     * Handler for touch end.
     *
     * @param {number} len - Length between the current position and the start
     *     position.
     */
    _moveEndHandler: function(len) {
      this._lastTouchHeight = null;
      this._firstTouchHeight = null;
    },

    /**
     * Handler for the user clicked the screen while switching the page.
     */
    _clickHandler: function() {
      var fgPage = null;
      this._forEachPage(
          function(page) { if (page.selected) { fgPage = page; } });

      if (fgPage !== null) {
        fgPage = this.appendChild(this.removeChild(fgPage));

        pageList.pageListController.stopSwitchPages();

        this._dispatch(this.EVENTS.FOREGROUND_PAGE_CHANGED);
      }
    },

    /**
     * Updates all page's position in switching page mode.
     */
    _updateAllPagesPosition: function() {
      var index = 0;
      this._forEachPage((function(page) {
        var pos = this._pagePositionManager.getPosition(index++);

        page.style.top = pos.top + '%';
        page.style.transform = 'scale(' + pos.scale + ')';
      }).bind(this));
    },

    /**
     * Clears all page's position relative css style.
     */
    _clearPageStyle: function(page) {
      page.style.top = '';
      page.style.transform = '';
    },

    /**
     * Dispatches a custom event.
     *
     * @param {string} eventName - Name of the event.
     */
    _dispatch: function(eventName) {
      this.dispatchEvent(new CustomEvent(eventName));
    },

    template: `
      <div id="viewport">
        <content select="app-page-list-page"></content>
      </div>

      <style>
        #viewport {
          height: 100%;
          overflow: hidden;
          position: absolute;
          width: 100%;
        }

        ::host {
          height: 100%;
          position: absolute;
          width: 100%;
          background-color: rgba(0, 0, 0, 0.1);
        }

        ::host > app-page-list-page {
          z-index: 10;
        }

        ::host > app-page-list-page:last-child {
          z-index: 90;
        }
      </style>
    `
  });

  /**
   * Custom HTMLElement for a page in `app-page-list`.
   *
   * @class
   */
  pageList.Page = component.register('app-page-list-page', {
    created: function() {
      var shadowRoot = this.setupShadowRoot();

      /**
       * outer div.
       *
       * @type {HTMLElement}
       * @private
       */
      this._contentOuter = shadowRoot.getElementById('content-outer');

      /**
       * Blocker div.
       *
       * @type {HTMLElement}
       * @private
       */
      this._blocker = shadowRoot.getElementById('blocker');

      /**
       * Title div.
       *
       * @type {HTMLElement}
       * @private
       */
      this._title = shadowRoot.getElementById('title');

      /**
       * Title string.
       *
       * @type {string}
       * @private
       */
      this._titleString = '';

      /**
       * Close button.
       *
       * @type {string}
       * @private
       */
      this._closeButton = shadowRoot.getElementById('close-button');

      /**
       * Whether it was selected by the user or not.
       *
       * @type {boolean}
       * @private
       */
      this._selected = false;

      /**
       * Touch gesture managers.
       *
       * @type {Object}
       * @private
       */
      this._gestureManagers = {};

      this._stopPropagationOnCloseButton();
    },

    attached: function() {
      this._initGestureManagers();
    },

    detached: function() {
      this._destroyGestureManagers();
    },

    /**
     * Enumerates event names which might be trigger by this object.
     *
     * @type {Object}
     */
    EVENTS: new utils.Enum({
      /**
       * Fire when the page title was changed.
       */
      TITLE_CHANGED: 'titleChanged',

      /**
       * Fire when the close button was clicked.
       */
      CLOSE_BUTTON_CLICKED: 'closeButtonClicked'
    }),

    /**
     * Enumerates modes of this HTMLElement.
     *
     * @type {Object}
     */
    MODES: new utils.Enum({
      /**
       * Normal.
       */
      NORMAL: '',

      /**
       * Indicated that the parent pagelist is switching and the touch events
       * should be blocked.
       */
      SWITCHING: 'switching'
    }),

    attrs: {
      /**
       * The page's mode.
       *
       * @type {string}
       */
      mode: {
        get: function() {
          return this.getAttribute(this._ATTRIBUTES.MODE) || this.MODES.NORMAL;
        },
        set: function(mode) {
          this.setAttribute(this._ATTRIBUTES.MODE, mode);

          this._contentOuter.setAttribute(this._ATTRIBUTES.MODE, mode);
          this._blocker.setAttribute(this._ATTRIBUTES.MODE, mode);

          this.selected = false;
        }
      },

      /**
       * Whether this page is selected or not.
       *
       * @type {boolean}
       */
      selected: {
        get: function() {
          return this._selected;
        },
        set: function(value) {
          this._selected = !!(value === '' || value);
        }
      },

      /**
       * The title string of this page.
       *
       * @type {string}
       */
      title: {
        get: function() {
          return this._titleString;
        },
        set: function(value) {
          this._titleString = value;
          utils.fillHTMLElementText(this._title, value);
          this.dispatchEvent(
              new CustomEvent(this.EVENTS.TITLE_CHANGED, {bubbles: true}));
        }
      }
    },

    _ATTRIBUTES: Object.freeze({MODE: 'data-mode'}),

    /**
     * Stops propagation all events on the close button.
     */
    _stopPropagationOnCloseButton: function() {
      var stopPropagation = function(evt) { evt.stopPropagation(); };

      utils.iterateDict(touchGesture.TOUCH_EVENTS, function(_, eventName) {
        this._closeButton.addEventListener(eventName, stopPropagation);
      }, this);
    },

    /**
     * Initializes the gesture managers and listens the gesture events.
     */
    _initGestureManagers: function() {
      this._gestureManagers.select = new touchGesture.Click(this._blocker);
      this._gestureManagers.select.on('click', (function() {
        this.selected = true;
      }).bind(this));

      this._gestureManagers.close = new touchGesture.Click(this._closeButton);
      this._gestureManagers.close.on(
          'click', this._dispatch.bind(this, this.EVENTS.CLOSE_BUTTON_CLICKED));
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
     * Dispatches a event
     *
     * @param {string} eventName - Name of the event to be dispatched.
     */
    _dispatch: function(eventName) {
      this.dispatchEvent(new CustomEvent(eventName, {bubbles: true}));
    },

    template: `
      <div id="content-outer">
        <content></content>
      </div>
      <div id="blocker">
        <div id="header-row">
          <div id="title"></div>
          <span id="close-button">CLOSE</span>
        </div>
      </div>

      <style>
        ::host {
          background: var(--color-iota);
          display: block;
          height: 100%;
          position: absolute;
          transform-origin: 53% top;
          width: 100%;
        }

        content {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        #content-outer {
          height: 100%;
          overflow: auto;
          position: absolute;
          width: 100%;
        }

        #content-outer[data-mode="switching"] {
          height: auto;
          top: 4ex;
          bottom: 0;
          z-index: 10;
        }

        #blocker {
          display: none;
        }

        #blocker[data-mode="switching"] {
          background-color: rgba(0, 0, 0, 0);
          box-shadow: 0 0 10px rgb(10, 10, 10);
          display: block;
          height: 100%;
          position: absolute;
          top: 0;
          width: 100%;
          z-index: 50;
        }

        #header-row {
          background-color: rgb(200, 200, 200);
          height: 4ex;
          line-height: 4ex;
          position: absolute;
          width: 100%;
        }

        #title {
          font-style: italic;
          text-align: center;
        }

        #close-button {
          font-style: italic;
          height: 100%;
          position: absolute;
          right: 3%;
          top: 0;
        }
      </style>
    `
  });

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
})('libs/page_list', this));
