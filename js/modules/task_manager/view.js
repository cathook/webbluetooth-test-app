;(function(define) { 'use strict'; define(function(require) {
  var taskManager = require('modules/task_manager');

  var mode = null;
  var pageList = require('libs/page_list');
  var pageWall = require('libs/page_wall');
  var utils = require('libs/utils');

  taskManager._view = {};

  /**
   * A page container interface.
   *
   * @param {HTMLElement} page - Real page element.
   */
  var _NormalPageContainer = function(page) {
    this._page = page;

    this._page.addEventListener(
        this._page.EVENTS.CLOSE_BUTTON_CLICKED,
        taskManager._containerCloseButtonClicked.bind(taskManager, this));
  };

  _NormalPageContainer.prototype = {
    /**
     * Attaches an child element.
     *
     * @param {HTMLElement} element - The element to be attached in.
     */
    attach: function(element) {
      this.detach();
      this._page.appendChild(element);
    },

    /**
     * Detaches all child elements.
     */
    detach: function() {
      this._page.innerHTML = '';
    },

    /**
     * Destroys this page.
     */
    destroy: function() {
      this._page.parentElement.removeChild(this._page);
      this._page = null;
    },

    /**
     * Puts this page to foreground.
     */
    switchToForeground: function() {
      var pl = this._page.parentElement;
      var pwp = pl.parentElement;
      var pw = pwp.parentElement;
      pl.switchToPage(this._page);
      pw.slideToPage(pwp);

      taskManager._view.switchToCategory(pw.getAttribute('data-category-name'));
    },

    /**
     * @returns {string} The title of this page.
     */
    get title() {
      return this._page.title;
    },

    /**
     * Sets the title of this page.
     *
     * @param {string} value - The new title.
     */
    set title(value) {
      this._page.title = value;
    },

    /**
     * @returns {HTMLElment} The page.
     */
    get page() {
      return this._page;
    }
  };

  /**
   * Interface for a popup page.
   */
  var _PopupPageContainer = function(page) {
    this._page = page;

    this._page.addEventListener(
        'closed',
        taskManager._containerCloseButtonClicked.bind(taskManager, this));
  };

  _PopupPageContainer.prototype = {
    attach: function(element) {
      this.detach();
      this._page.appendChild(element);
    },

    detach: function() {
      this._page.innerHTML = '';
    },

    destroy: function() {
      this._page.parentElement.removeChild(this._page);
      this._page = null;
    },

    switchToForeground: function() {
      if (this._page.parentElement.lastElementChild != this._page) {
        this._page.parentElement.appendChild(
            this._page.parentElement.removeChild(this._page));
      }
      this._page.open();
    },

    switchToBackground: function() {
      this._page.close();
    },

    get title() {},

    set title(value) {},

    get page() {
      return this._page;
    }
  };

  /**
   * Initializes.
   */
  taskManager._view.init = function() {
    mode = require('modules/mode');

    _elements = {
      header: document.getElementById('header'),
      title: document.getElementById('title'),
      mode: document.getElementById('mode'),
      pageWalls: document.getElementById('page-walls'),
      showLog: document.getElementById('show-log'),
      slideToLeft: document.getElementById('slide-to-left'),
      slideToRight: document.getElementById('slide-to-right'),
      switchPages: document.getElementById('switch-pages'),
      menu: document.getElementById('menu'),
      menuItems: document.getElementById('menu-items'),
      popupPages: document.getElementById('popup-pages'),
      toast: document.getElementById('toast')
    };
    _currPageWall = {style: {}};
    _categories = {};

    _setupEventHandlers();

    _updateModeText();
  };

  /**
   * Creates a category
   *
   * @param {string} categoryName - Name of the category.
   *
   * @returns {Object} A container.
   */
  taskManager._view.createCategory = function(categoryName) {
    var page = _createRootPageInPageWall(categoryName);
    _addMenuItem(categoryName);

    if (!(_currPageWall instanceof pageWall.PageWall)) {
      taskManager._view.switchToCategory(categoryName);
    }
    return new _NormalPageContainer(page);
  };

  /**
   * Creates a popup page.
   *
   * @returns {Object} A container.
   */
  taskManager._view.createPopupPage = function() {
    var dialog = document.createElement('gaia-dialog');
    dialog.open();
    _elements.popupPages.appendChild(dialog);
    return new _PopupPageContainer(dialog);
  };

  /**
   * Creates a child page.
   *
   * @param {Object} parentContainer - Parent container.
   *
   * @returns {Object} A container.
   */
  taskManager._view.createChildPage = function(parentContainer) {
    var page = _createChildPageInPageWall(parentContainer.page);
    return new _NormalPageContainer(page);
  };

  /**
   * Creates a same generation page.
   *
   * @param {Object} container - container.
   *
   * @returns {Object} A container.
   */
  taskManager._view.createBrotherPage = function(container) {
    var page = _createBrotherPageInPageWall(container.page);
    return new _NormalPageContainer(page);
  };

  /**
   * Switches to the specific category.
   *
   * @param {string} categoryName - The category name.
   */
  taskManager._view.switchToCategory = function(categoryName) {
    var category = _categories[categoryName];
    _currPageWall.style.display = 'none';
    _currPageWall = category;
    _currPageWall.style.display = '';
    _updateTitle();
  };

  /**
   * Throws a notification to the user.
   *
   * @param {string} message - The notification message.
   */
  taskManager._view.throwNotification = function(message) {
    utils.fillHTMLElementText(_elements.toast, message);
    _elements.toast.show(message);
  };

  var _createRootPageInPageWall = function(categoryName) {
    var pw = new pageWall.PageWall();
    var pwp = new pageWall.Page();
    var pl = new pageList.PageList();
    pl.addEventListener('foregroundPageChanged', _updateTitle);
    var plp = new pageList.Page();
    pw.appendChild(pwp);
    pwp.appendChild(pl);
    pl.appendChild(plp);
    pw.style.display = 'none';

    _elements.pageWalls.appendChild(pw);
    _categories[categoryName] = pw;

    pw.setAttribute('data-category-name', categoryName);

    return plp;
  };

  var _createChildPageInPageWall = function(parentPage) {
    var pw = parentPage.parentElement.parentElement.parentElement;
    var pwp = parentPage.parentElement.parentElement.nextSibling;
    while (pwp !== null && !(pwp instanceof pageWall.Page)) {
      pwp = pwp.nextSibling;
    }
    var pl;
    if (pwp === null) {
      pwp = new pageWall.Page();
      pl = new pageList.PageList();
      pl.addEventListener('foregroundPageChanged', _updateTitle);
      pw.appendChild(pwp);
      pwp.appendChild(pl);
    } else {
      pl = pwp.getElementsByTagName('app-page-list')[0];
    }
    var plp = new pageList.Page();
    pl.insertBefore(plp, pl.lastElementChild);

    return plp;
  };

  var _createBrotherPageInPageWall = function(page) {
    var pl = page.parentElement;
    var plp = new pageList.Page();

    pl.insertBefore(plp, pl.lastElementChild);

    return plp;
  };

  var _addMenuItem = function(title) {
    var item = document.createElement('li');
    _elements.menuItems.appendChild(utils.fillHTMLElementText(item, title));

    item.addEventListener('click', function() {
      _elements.menu.toggle();
      taskManager._view.switchToCategory(title);
    });
  };

  var _updateTitle = function() {
    var currPage = _currPageWall.foregroundPage
        .getElementsByTagName('app-page-list')[0].foregroundPage;
    utils.fillHTMLElementText(_elements.title, currPage.title);
  };

  var _updateModeText = function() {
    _elements.mode.replaceChild(mode.htmlElement, _elements.mode.firstChild);
  };

  var _setupEventHandlers = function() {
    _elements.header.addEventListener(
        'action', function() { _elements.menu.toggle(); });

    _elements.mode.addEventListener(
        'click', function() { mode.toNextMode(); });

    _elements.pageWalls.addEventListener(
        'foregroundPageChanged', function() { _updateTitle(); });

    _elements.pageWalls.addEventListener(
        'titleChanged', function() { _updateTitle(); });

    _elements.showLog.addEventListener(
        'click', function() { taskManager._showLog(); });

    _elements.slideToLeft.addEventListener(
        'click', function() { _currPageWall.slideToLeft(); });

    _elements.slideToRight.addEventListener(
        'click', function() { _currPageWall.slideToRight(); });

    _elements.switchPages.addEventListener(
        'click',
        function() { pageList.pageListController.toggleSwitchPages(); });

    mode.on(mode.EVENTS.MODE_CHANGED, function() { _updateModeText(); });
  };

  var _elements = null;
  var _currPageWall = null;
  var _categories = null;

}); })((function(win) {
  /* global define, module, require */
  'use strict';
  return typeof define == 'function' && define.amd ? define :
      typeof module == 'object' ? function(c) { c(require); } :
      function(c) { c(function(name) { return win[name]; }); };
})(this));
