(function(define) { 'use strict'; define(function(require, exports, module) {
  var varTreeComponent = module.exports;

  var component = require('gaia-component');
  var utils = require('libs/utils');

  varTreeComponent.VarTreeTask = component.register('app-var-tree-task', {
    EVENTS: new utils.Enum({
      /**
       * Fired if the path is clicked.
       */
      ATTRS_PATH_CLICKED: 'attrsPathClicked',

      /**
       * Fired if an attribute is added.
       */
      ATTR_ADDED: 'attrAdded',

      /**
       * Fired if an attribute is removed.
       */
      ATTR_REMOVED: 'attrRemoved',

      /**
       * Fired if an attribute is clicked.
       */
      ATTR_CLICKED: 'attrClicked',

      /**
       * Fired if the reset button is clicked.
       */
      RESETED: 'reseted',

      /**
       * Fired if the cancel button is clicked.
       */
      CANCELED: 'canceled',

      /**
       * Fired if the selected button is clicked.
       */
      SELECTED: 'selected'
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      this._elements = {
        inner: shadowRoot.getElementById('inner'),
        attrsPath: shadowRoot.getElementById('attrs-path'),
        root: shadowRoot.getElementById('root'),
        dataViewer: shadowRoot.getElementById('data-viewer'),
        reset: shadowRoot.getElementById('reset'),
        selectRow: shadowRoot.getElementById('select-row'),
        cancel: shadowRoot.getElementById('cancel'),
        select: shadowRoot.getElementById('select')
      };

      this._canReset = null;
      this._canSelect = true;
      this._attrsPathLength = 1;

      this._setupEventHandlers();

      this.canModifyAttrs = false;
    },

    attrs: {
      /**
       * Sets whether the user can click the select button or not.
       *
       * @type {boolean}
       */
      canSelect: {
        get: function() {
          return this._canSelect;
        },

        set: function(value) {
          this._canSelect = value;
          this._elements.selectRow.style.display = value ? '' : 'none';
        }
      },

      /**
       * Whether the user can click the reset button or not.
       * @type {boolean}
       */
      canReset: {
        get: function() {
          return this._canReset;
        },

        set: function(value) {
          this._canReset = value;
          this._elements.reset.style.display = this._canReset ? '' : 'none';
        }
      },

      /**
       * Whether the user add/remove attributes or not.
       *
       * @type {boolean}
       */
      canModifyAttrs: {
        get: function() {
          return this._elements.dataViewer.canModifyItems;
        },

        set: function(value) {
          this._elements.dataViewer.canModifyItems = value;
        }
      },

      /**
       * Length of the attr path.
       *
       * @type {boolean}
       */
      attrsPathLength: {
        get: function() {
          return this._attrsPathLength;
        }
      }
    },

    /**
     * Appends attribute path.
     *
     * @param {Array} attrsPath - The attrs path to be appended.
     */
    appendAttrsPath: function(attrsPath) {
      utils.iterateArray(attrsPath, function(attrName) {
        var button = document.createElement('button');
        utils.fillHTMLElementText(button, '.' + attrName);
        this._elements.attrsPath.appendChild(button);

        this._attrsPathLength += 1;

        var detail = {attrsPathLength: this._attrsPathLength};
        button.addEventListener(
            'click',
            this._dispatch.bind(this, this.EVENTS.ATTRS_PATH_CLICKED, detail));
      }, this);
    },

    /**
     * Shrinks attribute path into the specific length.
     *
     * @param {number} lengthAfterCut - The length of the attribute path after
     *     cut.
     */
    cutAttrsPath: function(lengthAfterCut) {
      var attrsPath = this._elements.attrsPath;
      while (this._attrsPathLength > lengthAfterCut) {
        attrsPath.removeChild(attrsPath.lastChild);
        this._attrsPathLength -= 1;
      }
    },

    /**
     * Resets all.
     *
     * @param {Array} attrsPath - The attribute path.
     * @param {Object} value - The value to show.
     */
    reset: function(attrsPath, value) {
      this.cutAttrsPath(1);
      this.appendAttrsPath(attrsPath);

      this.setDataValue(value);
    },

    /**
     * Sets the value to show.
     *
     * @param {Object} data - The value.
     */
    setDataValue: function(data) {
      this._elements.dataViewer =
          this._elements.inner.removeChild(this._elements.dataViewer);
      this._elements.dataViewer.setValue(data);
      if (data instanceof Object) {
        this._elements.dataViewer.hasItems = true;
        this._elements.dataViewer.clearItems();
        utils.iterateDict(data, this.setDataAttr, this);
      } else {
        this._elements.dataViewer.hasItems = false;
      }
      this._elements.inner.insertBefore(
          this._elements.dataViewer, this._elements.reset);
    },

    /**
     * Sets an attribute's value.
     *
     * @param {string} attrName - The attribute name to be removed.
     * @param {Object} data - The value of that attribute.
     */
    setDataAttr: function(attrName, data) {
      this._elements.dataViewer.setItem(attrName, data);
    },

    /**
     * Removes an attribute.
     *
     * @param {string} attrName - The attribute name to be removed.
     */
    removeDataAttr: function(attrName) {
      this._elements.dataViewer.removeItem(attrName);
    },

    /**
     * Setups event handlers which listen on the elements inside the shadowroot.
     */
    _setupEventHandlers: function() {
      this._elements.reset.addEventListener(
          'click', this._dispatch.bind(this, this.EVENTS.RESETED, {}));

      this._elements.cancel.addEventListener(
          'click', this._dispatch.bind(this, this.EVENTS.CANCELED, {}));

      this._elements.select.addEventListener(
          'click', this._dispatch.bind(this, this.EVENTS.SELECTED, {}));

      var detail = {attrsPathLength: 1};
      this._elements.root.addEventListener(
          'click',
          this._dispatch.bind(this, this.EVENTS.ATTRS_PATH_CLICKED, detail));

      this._elements.dataViewer.addEventListener(
          this._elements.dataViewer.EVENTS.ITEM_ADD, (function(evt) {
            this._dispatch(
                this.EVENTS.ATTR_ADDED, {attrName: evt.detail.itemName});
          }).bind(this));

      this._elements.dataViewer.addEventListener(
          this._elements.dataViewer.EVENTS.ITEM_REMOVE, (function(evt) {
            this._dispatch(
                this.EVENTS.ATTR_REMOVED, {attrName: evt.detail.itemName});
          }).bind(this));

      this._elements.dataViewer.addEventListener(
          this._elements.dataViewer.EVENTS.ITEM_CLICKED, (function(evt) {
            this._dispatch(
                this.EVENTS.ATTR_CLICKED, {attrName: evt.detail.itemName});
          }).bind(this));
    },

    /**
     * Dispatches an event.
     *
     * @param {string} eventName - Name of the custom event.
     * @param {Object} detail - Detail object.
     */
    _dispatch: function(eventName, detail) {
      this.dispatchEvent(
          new CustomEvent(eventName, {detail: detail, bubbles: true}));
    },

    template: `
      <div id="inner">
        <div id="attrs-path">
          <button id="root">root</button>
        </div>
        <app-data-viewer id="data-viewer"></app-data-viewer>
        <gaia-button id="reset">Reset</gaia-button>
        <div id="select-row">
          <gaia-button id="cancel">Cancel</gaia-button>
          <gaia-button id="select">Select</gaia-button>
        </div>
      </div>

      <style>
        #inner {
          max-height: calc(100vh - 95px);
          overflow: auto;
        }

        #attrs-path > button {
          font-size: 18px;
          line-height: 120%;
        }

        #path-list {
          width: 100%;
          overflow: auto;
        }

        #select-row {
          display: flex;
          flex-direction: row;
        }

        #select-row > gaia-button {
          flex: 1 1 auto;
        }

        ::host {
          text-align: left;
        }
      </style>
    `
  });

  /**
   * Custom HTMLElement for task for resetting a value.
   */
  varTreeComponent.ResetValueTask =
      component.register('app-var-tree-reset-value', {
    EVENTS: new utils.Enum({
      /**
       * Fires if a value is selected.
       */
      VALUE_SELECTED: 'valueSelected',

      /**
       * Fires if the user want to select the value from the var tree.
       */
      SELECT_FROM_VAR_TREE: 'selectFromVarTree'
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      shadowRoot.getElementById('undefined').addEventListener(
          'click', this._dispatchValue.bind(this, undefined));
      shadowRoot.getElementById('null').addEventListener(
          'click', this._dispatchValue.bind(this, null));
      shadowRoot.getElementById('true').addEventListener(
          'click', this._dispatchValue.bind(this, true));
      shadowRoot.getElementById('false').addEventListener(
          'click', this._dispatchValue.bind(this, false));
      shadowRoot.getElementById('0').addEventListener(
          'click', this._dispatchValue.bind(this, 0));
      shadowRoot.getElementById('{}').addEventListener(
          'click', this._dispatchValue.bind(this, {}));
      shadowRoot.getElementById('[]').addEventListener(
          'click', this._dispatchValue.bind(this, []));
      shadowRoot.getElementById('number').addEventListener(
          'click',
          (function() {
            var value = shadowRoot.getElementById('number-input').value;
            this._dispatchValue(Number(value));
          }).bind(this));
      shadowRoot.getElementById('string').addEventListener(
          'click',
          (function() {
            var value = shadowRoot.getElementById('string-input').value;
            this._dispatchValue(value);
          }).bind(this));
      shadowRoot.getElementById('select-from-var-tree').addEventListener(
          'click', this._dispatchSelectFromVarTree.bind(this));
    },

    /**
     * Fires the `VALUE_SELECTED` event.
     */
    _dispatchValue: function(value) {
      this.dispatchEvent(new CustomEvent(this.EVENTS.VALUE_SELECTED,
                                         {detail: {value: value}}));
    },

    /**
     * Fires the `SELECT_FROM_VAR_TREE` event.
     */
    _dispatchSelectFromVarTree: function() {
      this.dispatchEvent(new CustomEvent(this.EVENTS.SELECT_FROM_VAR_TREE));
    },

    template: `
      <gaia-list>
        <a id="undefined">undefined</a>
        <a id="null">null</a>
        <a id="true">true</a>
        <a id="false">false</a>
        <a id="0">0</a>
        <a id="{}">{}</a>
        <a id="[]">[]</a>
        <div class="has-input">
          <gaia-text-input id="number-input"></gaia-text-input>
          <gaia-button id="number">number</gaia-button>
        </div>
        <div class="has-input">
          <gaia-text-input id="string-input"></gaia-text-input>
          <gaia-button id="string">string</gaia-button>
        </div>
        <a><gaia-button id="select-from-var-tree">
          Select from Var Tree
        </gaia-button></a>
      </gaia-list>

      <style>
        gaia-list {
          max-height: calc(100vh - 95px);
          overflow: auto;
          text-align: left;
        }

        gaia-text-input {
          margin-top: 0;
          margin-bottom: 0;
        }

        gaia-button {
          margin-top: 0;
          margin-bottom: 0;
        }

        #select-from-var-tree {
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
})('libs/var_tree_component', this));
