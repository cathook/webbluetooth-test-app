;(function(define) { 'use strict'; define(function(require, exports, module) {
  var dataViewer = module.exports;

  var component = require('gaia-component');
  var math = require('libs/math');
  var touchGesture = require('libs/touch_gesture');
  var utils = require('libs/utils');

  /**
   * A item in the data view.
   *
   * @param {HTMLElement} container - The container for this item.
   * @param {string} itemName - The item's name.
   * @param {string} itemContent - The content of the item.
   */
  var _Item = function(container, itemName, itemContent) {
    this._elements = {
      item: container,
      inner: document.createElement('div'),
      name: document.createElement('span'),
      content: document.createElement('span')
    };
    this._elements.item.appendChild(this._elements.inner);
    this._elements.inner.appendChild(this._elements.name);
    this._elements.inner.appendChild(document.createTextNode(':'));
    this._elements.inner.appendChild(this._elements.content);

    utils.fillHTMLElementText(this._elements.name, itemName);
    utils.fillHTMLElementText(this._elements.content, itemContent);

    this._elements.inner.style.position = 'absolute';
    this._elements.inner.style.width = '100%';

    this._touchGestures = {};
    this._canRemove = null;
    this._moving = null;
    this._itemName = itemName;

    this._stopPropagationAllTouchEvents();
    this._initTouchGestures();

    this.canRemove = false;
  };

  _Item.prototype = {
    EVENTS: new utils.Enum({
      /**
       * Fired if the user clicked this item.
       */
      ITEM_CLICKED: 'itemClicked',

      /**
       * Fired if the user want to remove this item.
       */
      ITEM_REMOVE: 'itemRemove'
    }),

    /**
     * Destroys this item.
     */
    destroy: function() {
      utils.iterateDict(this._touchGestures, function(_, touchGesture) {
        touchGesture.destroy();
      });
      this._elements.item.parentElement.removeChild(this._elements.item);
    },

    /**
     * @returns {boolean} Whether this item can be removed by the user or not.
     */
    get canRemove() {
      return this._canRemove;
    },

    /**
     * Sets whether this item can be removed by the user or not.
     *
     * @param {boolean} value - The new value.
     */
    set canRemove(value) {
      this._canRemove = value;
      if (!this._canRemove) {
        this._stopMoving();
      }
    },

    /**
     * Resets the content.
     *
     * @param {string} itemContent - The new content.
     */
    resetContent: function(itemContent) {
      utils.fillHTMLElementText(this._elements.content, itemContent);
    },

    /**
     * Stops all touch event's propagation.
     */
    _stopPropagationAllTouchEvents: function() {
      utils.iterateDict(touchGesture.TOUCH_EVENTS, function(_, eventName) {
        this._elements.item.addEventListener(
            eventName, function(evt) { evt.stopPropagation(); });
      }, this);
    },

    /**
     * Initializes the touch gestures.
     */
    _initTouchGestures: function() {
      var target = this._elements.item;

      this._touchGestures.click = new touchGesture.Click(target);
      this._touchGestures.click.on(
          'click', this._dispatch.bind(this, this.EVENTS.ITEM_CLICKED));

      var xPos = new math.Vector2D(1, 0);
      var xNeg = new math.Vector2D(-1, 0);

      this._touchGestures.slideLeft = new touchGesture.Slide(target, xPos);
      this._touchGestures.slideLeft.on(
          'slide', this._dispatch.bind(this, this.EVENTS.ITEM_REMOVE));

      this._touchGestures.slideRight = new touchGesture.Slide(target, xNeg);
      this._touchGestures.slideRight.on(
          'slide', this._dispatch.bind(this, this.EVENTS.ITEM_REMOVE));

      this._touchGestures.move = new touchGesture.DirectionalMove(target, xPos);
      this._touchGestures.move.on('start', this._startMoving.bind(this));
      this._touchGestures.move.on('move', this._move.bind(this));
      this._touchGestures.move.on('end', this._stopMoving.bind(this));
    },

    /**
     * Event handlers for the touch point start to move.
     */
    _startMoving: function() {
      if (this._canRemove) {
        this._moving = true;
        this._elements.inner.style.transition = '';
      }
    },

    /**
     * Event handlers for the touch point stop move.
     */
    _stopMoving: function() {
      this._moving = false;
      this._elements.inner.style.transition = '1s';
      this._elements.inner.style.left = '';
    },

    /**
     * Event handlers for the touch point moved.
     */
    _move: function(offset) {
      this._elements.inner.style.left = offset + 'px';
    },

    /**
     * Dispatches an event.
     *
     * @param {string} eventName - Name of the custom event.
     */
    _dispatch: function(eventName) {
      this._elements.item.dispatchEvent(
          new CustomEvent(eventName,
                          {detail: {itemName: this._itemName}, bubbles: true}));
    }
  };

  /**
   * Custom HTMLElement for viewing a data.
   */
  dataViewer.DataViewer = component.register('app-data-viewer', {
    EVENTS: new utils.Enum({
      /**
       * Fired if the user want to add an item.
       */
      ITEM_ADD: 'itemAdd',

      /**
       * Fired if the user want to remove an item.
       */
      ITEM_REMOVE: _Item.prototype.EVENTS.ITEM_REMOVE,

      /**
       * Fired if the user clicked an item.
       */
      ITEM_CLICKED: _Item.prototype.EVENTS.ITEM_CLICKED
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      /**
       * A dictionary of elements in the shadow root.
       *
       * @type {Object}
       * @private
       */
      this._elements = {
        list: shadowRoot.getElementById('list'),
        type: shadowRoot.getElementById('type'),
        valueRow: shadowRoot.getElementById('value-row'),
        value: shadowRoot.getElementById('value'),
        itemsTitleRow: shadowRoot.getElementById('items-title-row'),
        addItemRow: shadowRoot.getElementById('add-item-row'),
        addItemName: shadowRoot.getElementById('add-item-name'),
        addItemButton: shadowRoot.getElementById('add-item-button')
      };

      /**
       * A dictionary of items.
       *
       * @type {Object}
       * @private
       */
      this._items = {};

      /**
       * Whether the user can modify the items or not.
       *
       * @type {boolean?}
       * @private
       */
      this._canModifyItems = null;

      /**
       * Whether the data has items or not.
       *
       * @type {boolean}
       * @private
       */
      this._hasItems = true;

      this._elements.addItemButton.addEventListener(
          'click', this._dispatchAddItemEvent.bind(this));

      this.canModifyItems = false;
    },

    attrs: {
      /**
       * Whether this data viewer allows user to add/remove items in it.
       *
       * @type {boolean}
       */
      canModifyItems: {
        get: function() {
          return this._canModifyItems;
        },

        set: function(value) {
          this._canModifyItems = value;
          utils.iterateDict(this._items, function(itemName, item) {
            item.canRemove = value;
          });
          this._elements.addItemRow.style.display =
              value && this.hasItems ? '' : 'none';
        }
      },

      /**
       * Sets whether the data has child items.
       *
       * @type {boolean}
       */
      hasItems: {
        get: function() {
          return this._hasItems;
        },

        set: function(value) {
          this._hasItems = value;
          if (!value) {
            this.clearItems();
          }
          this._elements.itemsTitleRow.style.display = value ? '' : 'none';
        }
      }
    },

    /**
     * Sets the data value to be showed.
     *
     * @param {Object} data - The data value to be showed.
     */
    setValue: function(data) {
      var typeString = utils.typeToString(data);
      utils.fillHTMLElementText(this._elements.type, typeString);

      var converter = _valueConverters[typeString];
      if (converter instanceof Function) {
        utils.fillHTMLElementText(this._elements.value, converter(data));
        this._elements.valueRow.style.display = '';
      } else {
        utils.fillHTMLElementText(this._elements.value, '');
        this._elements.valueRow.style.display = 'none';
      }
    },

    /**
     * Sets an item.
     *
     * @param {string} name - Name of the item.
     * @param {Object} data - Data value of that item.
     */
    setItem: function(name, data) {
      var contentString = utils.valueToSimpleString(data);
      if (name in this._items) {
        this._items[name].resetContent(contentString);
      } else {
        var element = document.createElement('div');
        this._elements.list.insertBefore(element, this._elements.addItemRow);
        this._items[name] = new _Item(element, name, contentString);
        this._items[name].canRemove = this.canModifyItems;
      }
    },

    /**
     * Removes an item.
     *
     * @param {string} name - Name of the item.
     */
    removeItem: function(name) {
      this._items[name].destroy();
      delete this._items[name];
    },

    /**
     * Removes all the items.
     */
    clearItems: function() {
      utils.iterateDict(this._items, function(itemName, item) {
        item.destroy();
      });
      this._items = {};
    },

    /**
     * Dispatches an event for notifying that an item was added.
     */
    _dispatchAddItemEvent: function() {
      var itemName = this._elements.addItemName.value;
      this.dispatchEvent(new CustomEvent(
          this.EVENTS.ITEM_ADD, {detail: {itemName: itemName}}));
    },

    template: `
      <gaia-list id="list">
        <div><span id="type-title">Type: </span><span id="type"></span></div>
        <div id="value-row">Value: <span id="value"></span></div>
        <div id="items-title-row">Items:</div>
        <div id="add-item-row">
          <gaia-text-input id="add-item-name"></gaia-text-input>
          <gaia-button id="add-item-button" circular="">Add</gaia-button>
        </div>
      </gaia-list>

      <style>
        gaia-list {
          font-size: 85%;
        }

        #list > div {
          -moz-user-select: none;
        }

        #list > div > span {
          -moz-user-select: none;
        }

        #type-title {
          font-weight: bold;
        }

        #items-title-row {
          font-weight: bold;
        }

        #add-item-row {
          display: flex;
          align-items: center;
        }

        #add-item-button {
          flex: 0 0 auto;
          margin: 0;
        }

        gaia-text-input {
          margin-bottom: 0;
          margin-top: 0;
          flex: 1 1 auto;
        }
      </style>
    `
  });

  /**
   * A dictionary of value converters which converts the gived value into
   *     string.
   */
  var _valueConverters = (function() {
    var ret = {};
    ret[utils.typeToString(undefined)] = (value) => 'undefined';
    ret[utils.typeToString(null)] = (value) => 'null';
    ret[utils.typeToString(0)] = (value) => '' + value;
    ret[utils.typeToString('')] = (value) => '"' + value + '"';
    ret[utils.typeToString(false)] = (value) => value ? 'true' : 'false';
    ret[utils.typeToString(function() {})] = (value) => value.toString();
    return ret;
  })();

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
})('libs/value_viewer', this));
