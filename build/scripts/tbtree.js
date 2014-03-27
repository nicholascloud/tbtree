/**
 * The MIT License (MIT)
 *
 * tbtree 0.4.0 Copyright (c) 2014 Nicholas Cloud
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/*global require, define, module*/
/*jshint forin:false*/
(function (global, factory) {
  'use strict';

  // AMD (require.js) module
  if (typeof define === 'function' && define.amd) {
    return define(['jquery', 'underscore'], function ($, _) {
      return factory($, _, global);
    });
  }

  // browser
  global.tbtree = factory(global.$, global._, global);

}(this, function ($, _, global, undefined) {
  'use strict';

  /**
   * Default context object for bus events
   * @type {{}}
   */
  var DEFAULT_CONTEXT = {};

  /**
   * Simple message bus API for eventing; only used internally
   * @type {{subscribe: Function, unsubscribe: Function, publish: Function}}
   */
  var busAPI = {
    // subscriptions: {},

    /**
     * Subscribes to an event on the bus
     * @param {String} event
     * @param {Function} callback
     * @param {Object} [context]
     */
    subscribe: function (event, callback, context) {
      if (!_.has(this.subscriptions, event)) {
        this.subscriptions[event] = [];
      }
      if (!callback) {
        throw new Error('callback was not supplied');
      }
      this.subscriptions[event].push({
        callback: callback,
        context: context || DEFAULT_CONTEXT
      });
    },

    /**
     * Unsubscribes to an/all event(s) on the bus
     * @param {String} [event]
     * @param {Function} [callback]
     * @param {Object} [context]
     */
    unsubscribe: function (event, callback, context) {
      if (arguments.length === 0) {
        this.subscriptions = {};
        return;
      }
      if (!_.has(this.subscriptions, event)) {
        return;
      }
      if (arguments.length === 1) {
        this.subscriptions[event] = [];
        return;
      }
      context = context || DEFAULT_CONTEXT;
      this.subscriptions[event] = _.filter(this.subscriptions, function (s) {
        return s.callback !== callback && s.context !== context;
      });
    },

    /**
     * Publishes an event on the bus
     * @param {String} event
     * @param {Object} message
     */
    publish: function (event, message) {
      if (!_.has(this.subscriptions, event)) {
        return;
      }
      var meta = {
        __meta__: {
          name: event,
          subscribers: this.subscriptions[event].length
        }
      };
      message = _.extend(meta, message);
      this.subscriptions[event].forEach(function (s) {
        s.callback.call(s.context, message);
      });
    }
  };

  /**
   * Message bus constructor
   * @returns {Object}
   * @constructor
   */
  function Bus() {
    var bus = Object.create(busAPI);
    bus.subscriptions = {};
    return bus;
  }

  /**
   * Toggles classes on a jQuery object
   * @param {jQuery} $e jQuery object
   * @param {String} a class name
   * @param {String} b class name
   */
  function toggleClass($e, a, b) {
    $e.each(function () {
      var $this = $(this);
      if ($this.hasClass(a)) {
        $this.removeClass(a).addClass(b);
      } else if ($this.hasClass(b)) {
        $this.removeClass(b).addClass(a);
      } else {
        $this.addClass(a);
      }
    });
  }

  /**
   * Default tree configuration
   * @type {{icons: {expanded: string, collapsed: string, leaf: string, positive: string, negative: string}}}
   */
  var DEFAULT_TREE_CONFIG = {
    icons: {
      expanded: 'icon-chevron-down',
      collapsed: 'icon-chevron-right',
      leaf: 'icon-file',
      positive: 'icon-unlock',
      negative: 'icon-lock'
    },
    arrayValuesInPath: true
  };

  /**
   * Tree API
   * @type {{_buildTree: Function, _triggerPathEvent: Function, _toggleExpandState: Function, load: Function, filter: Function, on: Function, off: Function}}
   */
  var treeAPI = {
    // _$el: null,
    // _data: {},
    // _bus: new Bus(),

    /**
     * Builds a DOM tree of nested lists
     * @param {Object} json
     * @param {jQuery} $parent
     * @private
     */
    _buildTree: function (json, $parent) {
      var $ul = $('<ul></ul>')
        .appendTo($parent);

      var self = this;
      _.each(json, function (value, key) {
        var $li = $('<li></li>')
          .append('<i></i>')
          .append('<a></a>')
          .append('<i></i>')
          .attr('data-path', key)
          .attr('data-state', 'collapsed')
          .appendTo($ul);

        /*
         * By default array values are shown in the path where
         * possible. If an array value is itself an object or
         * another array, the key will be shown instead. Setting
         * `arrayValuesInPath` to false in the config will always
         * show the array key in the path.
         */
        if (_.isArray(json) && self._config.arrayValuesInPath) {
          if (!_.isObject(value) && !_.isArray(value)) {
            $li.attr('data-path', value);
          }
        }

        $li.find('i').last().addClass(self._icons.negative);

        if (_.isObject(value)) {
          // branch
          $li.addClass('branch');
          $li.find('a').text(key);
          $li.find('i').first().addClass(self._icons.collapsed);
          self._buildTree(value, $li);
        } else {
          // leaf
          $li.addClass('leaf');
          $li.find('a')
            .append('<span class="label label-inverse">' + key + '</span>')
            .find('span')
            .after(value);
          $li.find('i').first().addClass(self._icons.leaf);
        }

        $li.find('> ul').hide();
      });
    },

    /**
     * Triggers a path event when a list item is clicked
     * @param {jQuery} $li list item that was clicked
     * @param {String} evt event name to publish
     * @private
     */
    _triggerPathEvent: function ($li) {
      var segments = [];
      segments.push($li.attr('data-path'));
      $li.parents('li').each(function (i, li) {
        segments.push($(li).attr('data-path'));
      });
      var fullPath = segments.reverse().join('/');
      this._bus.publish('selected', {
        path: fullPath,
        target: $li[0]
      });
    },

    /**
     * Toggles the expand state of a list item when it is clicked
     * @param {jQuery} $li
     * @private
     */
    _toggleExpandState: function ($li) {
      var state = $li.attr('data-state'),
        eventArgs = {target: $li[0]};
      if (state === 'expanded') {
        $li.find('> ul').hide();
        $li.find('> .' + this._icons.expanded)
          .removeClass(this._icons.expanded)
          .addClass(this._icons.collapsed);
        $li.attr('data-state', 'collapsed');
        this._bus.publish('collapsed', eventArgs);
      } else {
        $li.find('> ul').show();
        $li.find('> .' + this._icons.collapsed)
          .removeClass(this._icons.collapsed)
          .addClass(this._icons.expanded);
        $li.attr('data-state', 'expanded');
        this._bus.publish('expanded', eventArgs);
      }
    },

    /**
     * Loads data into the tree
     * @param {Object|String} data
     * @returns {*}
     */
    load: function (data) {
      if (this._$el) {
        this._$el.remove();
      }
      this._$el = $(this._config.selector).addClass('tbtree');

      if (_.isString(data)) {
        data = JSON.parse(data);
      }
      this._data = data;

      this._buildTree(this._data, this._$el);

      var self = this;
      this._$el.on('click', 'li', function (/*e*/) {
        var $li = $(this);
        /**
         * Use the timeout delay to allow the `dblclick` event
         * to fire (it fires after `click`). If `dblclick` fires,
         * it will add a `double` entry to the DOM element's data
         * that will have a value of `1`. The first `click` handler
         * that fires will decrement this value and return, and the
         * second `click` handler that fires will actually perform
         * the DOM manipulation.
         *
         * Order of events when the user double-clicks:
         * - click1 -> handle
         * - click2 -> handle
         * - dblclick -> handle
         *
         * By using `setTimeout`, we can delay the click handlers:
         * - click1
         * - click2
         * - dblclick -> handle
         * - handle click1 (ignore)
         * - handle click2
         */
        setTimeout(function () {
          var dblclick = parseInt($li.data('double') || 0, 10);
          if (dblclick > 0) {
            $li.data('double', dblclick - 1);
            return;
          }
          self._$el.find('li').removeClass('highlighted');
          $li.addClass('highlighted');
          self._triggerPathEvent($li);
          self._toggleExpandState($li);
        }, 0);
        return false;
      });

      this._$el.on('dblclick', 'li', function (/*e*/) {
        var $li = $(this);
        $li.data('double', 1);
        self._triggerPathEvent($li, 'selected');
        return false;
      });

      var pos = this._icons.positive,
        neg = this._icons.negative;

      //e.g., 'i.pos-state, i.neg-state'
      var statesSelector = 'i.' + pos + ', i.' + neg;

      this._$el.on('click', statesSelector, function (e) {
        var $i = $(this);
        toggleClass($i, pos, neg);
        e.stopPropagation();
        e.preventDefault();
        return false;
      });

      this._bus.publish('loaded');

      return this;
    },

    /**
     * Filters the tree
     * NOT IMPLEMENTED
     */
    filter: function (/*query*/) {
      throw new Error('`filter` is not implemented');
    },

    /**
     * Adds a callback subscription to a tree event
     * @param {String} event
     * @param {Function} callback
     * @param {Object} [context]
     * @returns {*}
     */
    on: function (event, callback, context) {
      this._bus.subscribe(event, callback, context);
      return this;
    },

    /**
     * Removes a/all callback subscription(s) from a tree event
     * @param {String} [event]
     * @param {Function} [callback]
     * @param {Object} [context]
     * @returns {*}
     */
    off: function (event, callback, context) {
      this._bus.unsubscribe(event, callback, context);
      return this;
    },
    
    destroy: function () {
      this._$el.off();
      this._$el.removeClass('tbtree');
      this._$el.html('');
    }
  };

  /**
   * Creates a tbtree instance with options
   *
   * @param {Object} options
   * @returns {Object}
   */
  return function (options) {
    if (typeof options === 'string') {
      options = {selector: options};
    }
    if (!_.has(options, 'selector')) {
      throw new Error('A selector must be specified');
    }

    var tree = Object.create(treeAPI);
    tree._$el = null;
    tree._bus = new Bus();
    tree._data = {};
    tree._config = _.defaults(options, DEFAULT_TREE_CONFIG);
    //convenience config property
    tree._icons = tree._config.icons;
    return tree;
  };

}));


