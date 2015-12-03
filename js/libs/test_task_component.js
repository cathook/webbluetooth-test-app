(function(define) { 'use strict'; define(function(require, exports, module) {
  var testTaskComponent = module.exports;

  var component = require('gaia-component');
  var touchGesture = require('libs/touch_gesture');
  var utils = require('libs/utils');

  testTaskComponent.Attribute =
      component.register('app-test-task-view-element', {
    EVENTS: new utils.Enum({
      /**
       * Triggers if the user long pressed on this attribute.
       */
      LONG_PRESS: 'longPress',

      /**
       * Triggers if the user short pressed on this attribute.
       */
      ENTER: 'enter'
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      this._elements = {
        description: shadowRoot.getElementById('description'),
        left: shadowRoot.getElementById('left'),
        mid: shadowRoot.getElementById('mid'),
        outer: shadowRoot.getElementById('outer'),
        right: shadowRoot.getElementById('right'),
        title: shadowRoot.getElementById('title')
      };

      this._touchGestures = {};

      this._enable = true;
    },

    attached: function() {
      this._touchGestures.longPress = new touchGesture.Click(
          this._elements.mid,
          {
            minDuration: 1100,
            maxDuration: 1200,
            triggerOnMaxDurationReached: true
          });
      this._touchGestures.longPress.on(
          'click', this._dispatch.bind(this, this.EVENTS.LONG_PRESS));

      this._touchGestures.enter = new touchGesture.Click(this._elements.mid);
      this._touchGestures.enter.on(
          'click', this._dispatch.bind(this, this.EVENTS.ENTER));
    },

    detached: function() {
      utils.iterateDict(this._touchGestures, function(name, instance) {
        instance.destroy();
      });
      this._touchGestures = {};
    },

    attrs: {
      /**
       * Whether this attribute is eanbled or not.
       *
       * @type {boolean}
       */
      enable: {
        get: function() {
          return this._enable;
        },
        set: function(value) {
          this._enable = value;
        }
      }
    },

    /**
     * Sets the title of this element.
     *
     * @param {string} title - The title string.
     */
    setTitle: function(title) {
      utils.fillHTMLElementText(this._elements.title, title);
    },

    /**
     * Sets the description of this element.
     *
     * @param {string} description - The description string.
     */
    setDescription: function(description) {
      utils.fillHTMLElementText(this._elements.description, description);
    },

    /**
     * Adds an button element at the left side.
     *
     * @param {HTMLElement} element - The button element.
     */
    attachLeftButton: function(element) {
      element.setAttribute('data-left-button', '');
      this.appendChild(element);
    },

    /**
     * Adds an button element at the right side.
     *
     * @param {HTMLElement} element - The button element.
     */
    attachRightButton: function(element) {
      element.setAttribute('data-right-button', '');
      this.appendChild(element);
    },

    _dispatch: function(eventName) {
      if (this._enable) {
        this.dispatchEvent(new CustomEvent(eventName));
      }
    },

    template: `
      <div id="outer">
        <div id="left">
          <content select="[data-left-button]"></content>
        </div>
        <div id="mid">
          <div id="title">
          </div>
          <div id="description">
          </div>
        </div>
        <div id="right">
          <content select="[data-right-button]"></content>
        </div>
      </div>

      <style>
        #outer {
          -moz-user-select: -moz-none;
          display: flex;
          width: 100%;
        }

        #left {
          float: left;
          margin-right: 10px;
        }

        #mid {
          flex: 1 1;
        }

        #title {
          font-size: 88%;
        }

        #description {
          font-size: 68%;
          color: rgb(100, 100, 100);
        }

        #right {
          float: right;
          margin-left: 10px;
        }
      </style>
    `
  });

  /**
   * Creates an function which creates element with specified gaia-icon.
   *
   * @param {string} iconName - Name of the gaia-icon.
   *
   * @returns {Function} A creater.
   */
  var _createIconCreater = function(iconName) {
    return function() {
      var i = document.createElement('i');
      i.setAttribute('data-icon', iconName);
      i.setAttribute('data-l10n-id', iconName);
      return i;
    };
  };

  /**
   * @function Creates an element with a trash can icon.
   */
  testTaskComponent.createRemoveIcon = _createIconCreater('delete');

  /**
   * @function Creates an element with a refresh icon.
   */
  testTaskComponent.createRefreshIcon = _createIconCreater('update-balance');

  /**
   * @function Creates an element with a setting icon.
   */
  testTaskComponent.createSetupArgumentsIcon = _createIconCreater('settings');

  /**
   * A custom html element which represents a toggle switch.
   *
   * @class
   */
  testTaskComponent.Switch = component.register('app-test-task-switch', {
    EVENTS: new utils.Enum({
      /**
       * Triggers if the user tried to turn on the switch.
       */
      TURN_ON: 'turnOn',

      /**
       * Triggers if the user tried to turn off the switch.
       */
      TURN_OFF: 'turnOff'
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      this._elements = {
        left: shadowRoot.getElementById('left'),
        title: shadowRoot.getElementById('title'),
        description: shadowRoot.getElementById('description'),
        switchButton: shadowRoot.getElementById('switch-button')
      };

      this._elements.switchButton.addEventListener('change', (function() {
        var eventName;
        if (this._elements.switchButton.checked) {
          eventName = this.EVENTS.TURN_ON;
        } else {
          eventName = this.EVENTS.TURN_OFF;
        }
        this.dispatchEvent(new CustomEvent(eventName));
      }).bind(this));
    },

    attrs: {
      /**
       * Whether this switch is enabled or not.
       *
       * @type {boolean}
       */
      enable: {
        get: function() {
          return this._elements.switchButton.enable;
        },
        set: function(value) {
          this._elements.switchButton.disabled = !value;
        }
      }
    },

    /**
     * Sets the title of this element.
     *
     * @param {string} titleText - The title string.
     */
    setTitle: function(titleText) {
      utils.fillHTMLElementText(this._elements.title, titleText);
    },

    /**
     * Sets the description of this element.
     *
     * @param {string} descriptionText - The description string.
     */
    setDescription: function(descriptionText) {
      utils.fillHTMLElementText(this._elements.description, descriptionText);
    },

    /**
     * Turns on the state.
     */
    turnOn: function() {
      this._elements.switchButton.checked = true;
    },

    /**
     * Turns off the state.
     */
    turnOff: function() {
      this._elements.switchButton.checked = false;
    },

    template: `
      <div id="left">
        <div id="title">
        </div>
        <div id="description">
        </div>
      </div>
      <gaia-switch id="switch-button">
      </gaia-switch>

      <style>
        ::host[data-hide=true] {
          display: none;
        }
      </style>
    `
  });

  /**
   * A custom html element represents a list of buttons.
   *
   * @class
   */
  testTaskComponent.Buttons = component.register('app-test-task-buttons', {
    EVENTS: new utils.Enum({
      /**
       * Fires if one of the buttons was clicked.
       */
      BUTTON_CLICKED: 'buttonClicked'
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      this._elements = {
        buttons: shadowRoot.getElementById('buttons')
      };

      this._enable = true;
    },

    attrs: {
      /**
       * Whether this element is enabled or not.
       *
       * @type {boolean}
       */
      enable: {
        get: function() {
          return this._enable;
        },
        set: function(value) {
          this._enable = value;
          utils.iterateArray(this._elements.buttons.children,
                             function(element) { element.disabled = !value; });
        }
      },
    },

    /**
     * Adds a button.
     *
     * @param {string} buttonTitle - The title string to display on the button.
     */
    addButton: function(buttonTitle) {
      var btn = document.createElement('gaia-button');
      utils.fillHTMLElementText(btn, buttonTitle);
      btn.addEventListener(
          'click', this._onClickHandler.bind(this, buttonTitle));
      btn.enable = this._enable;
      this._elements.buttons.appendChild(btn);
    },

    _onClickHandler: function(title) {
      this.dispatchEvent(
          new CustomEvent(this.EVENTS.BUTTON_CLICKED,
                          {detail: {buttonTitle: title}}));
    },

    template: `
      <div id="buttons">
      </div>

      <style>
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
})('libs/test_task_component', this));
