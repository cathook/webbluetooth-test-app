;(function(define) { 'use strict'; define(function(require, exports, module) {
  var instanceCreaterComponent = module.exports;

  var component = require('gaia-component');
  var utils = require('libs/utils');

  /**
   * Custom HTMLElement for the view of instance creater task.
   */
  instanceCreaterComponent.InstanceCreater =
      component.register('app-instance-creater', {
    EVENTS: new utils.Enum({
      /**
       * Fired if the user click the "reset arguments" button.
       */
      RESET_ARGS: 'resetArgs',

      /**
       * Fired if the user click the "setup arguments" button.
       */
      SETUP_ARGS: 'setupArgs',

      /**
       * Fired if the user click the "create instance" button.
       */
      CREATE_INSTANCE: 'createInstance'
    }),

    created: function() {
      var shadowRoot = this.setupShadowRoot();

      this._elements = {
        args: shadowRoot.getElementById('args'),
        resetArgs: shadowRoot.getElementById('reset-args'),
        setupArgs: shadowRoot.getElementById('setup-args'),
        createInstance: shadowRoot.getElementById('create-instance')
      };

      this._setupEventHandlers();
    },

    /**
     * Resets the argument list.
     *
     * @param {Array} args - An array of arguments.  Each element in the array
     *     must be a object contains two elements: name, value.
     */
    resetArguments: function(args) {
      this._elements.args.innerHTML = '';
      utils.iterateArray(args, function(arg) {
        var div = document.createElement('div');
        var text = arg.name + ':' + utils.valueToSimpleString(arg.value);
        utils.fillHTMLElementText(div, text);
        this._elements.args.appendChild(div);
      }, this);
    },

    /**
     * Setups all the event handlers.
     */
    _setupEventHandlers: function() {
      this._elements.resetArgs.addEventListener(
          'click', this._dispatch.bind(this, this.EVENTS.RESET_ARGS));

      this._elements.setupArgs.addEventListener(
          'click', this._dispatch.bind(this, this.EVENTS.SETUP_ARGS));

      this._elements.createInstance.addEventListener(
          'click', this._dispatch.bind(this, this.EVENTS.CREATE_INSTANCE));
    },

    /**
     * Dispatches an event.
     *
     * @param {string} eventName - Name of the event.
     */
    _dispatch: function(eventName) {
      this.dispatchEvent(new CustomEvent(eventName));
    },

    template: `
      <gaia-list id="args">
      </gaia-list>
      <div id="args-buttons">
        <gaia-button id="reset-args" class="left">Reset Arguments</gaia-button>
        <gaia-button id="setup-args" class="right">Setup Arguments</gaia-button>
      </div>
      <gaia-button id="create-instance">Create</gaia-button>

      <style>
        #args-buttons {
          display: flex;
          flex-direction: row;
        }

        #args-buttons > gaia-button {
          flex: 1 1 auto;
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
})('libs/instance_creater_component', this));
