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

  var bus = (function () {
    var subscriptions = {};

    return {
      subscribe: function (event, callback) {
        if (!subscriptions.hasOwnProperty(event)) {
          subscriptions[event] = [];
        }
        subscriptions[event].push(callback);
      },
      unsubscribe: function (event, callback) {
        if (!_.has(subscriptions, event)) {
          return;
        }
        if (!callback) {
          subscriptions[event] = [];
          return;
        }
        subscriptions[event] = _.without(subscriptions[event], callback);
      },
      publish: function (event, message, context) {
        if (!_.has(subscriptions, event)) {
          return;
        }
        var meta = {
          __event__: {
            name: event,
            subscribers: subscriptions[event].length
          }
        };
        context = context || {};
        message = _.extend(meta, message);
        subscriptions[event].forEach(function (e) {
          e.call(context, message);
        });
      }
    };
  }());

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

  var config = {
    icons: {
      expanded: 'icon-chevron-down',
      collapsed: 'icon-chevron-right',
      leaf: 'icon-file'
    }
  };

  function buildTree(json, $parent) {
    var $ul = $('<ul></ul>')
      .appendTo($parent);

    _.each(json, function (value, key) {
      var $li = $('<li></li>')
        .append('<i></i>')
        .append('<a></a>')
        .append('<i class="icon-lock"></i>')
        .attr('data-path', key)
        .attr('data-state', 'collapsed')
        .appendTo($ul);
      if (_.isObject(value)) {
        $li.addClass('branch');
        $li.find('a').text(key);
        $li.find('i').first().addClass(config.icons.collapsed);
        buildTree(value, $li);
      } else {
        $li.addClass('leaf');
        $li.find('a')
          .append('<span class="label label-inverse">' + key + '</span>')
          .find('span')
          .after(value);
        $li.find('i').first().addClass(config.icons.leaf);
      }
      $li.find('> ul').hide();
    });
  }

  function triggerPathEvent($li, evt) {
    var segments = [];
    segments.push($li.attr('data-path'));
    $li.parents('li').each(function (i, li) {
      segments.push($(li).attr('data-path'));
    });
    var fullPath = segments.reverse().join('/');
    bus.publish(evt, {path: fullPath});
  }

  function toggleExpandState($li) {
    var state = $li.attr('data-state');
    if (state === 'expanded') {
      $li.find('> ul').hide();
      $li.find('> .' + config.icons.expanded)
        .removeClass(config.icons.expanded)
        .addClass(config.icons.collapsed);
      $li.attr('data-state', 'collapsed');
    } else {
      $li.find('> ul').show();
      $li.find('> .' + config.icons.collapsed)
        .removeClass(config.icons.collapsed)
        .addClass(config.icons.expanded);
      $li.attr('data-state', 'expanded');
    }
  }

  var api = {
    _$el: null,
    _data: {},
    load: function (data) {
      if (this._$el) {
        this._$el.remove();
      }

      this._$el = $(config.selector).addClass('tbtree');
      this._data = data;

      buildTree(this._data, this._$el);

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
         * - click
         * - click
         * - dblclick
         */
        setTimeout(function () {
          var dblclick = parseInt($li.data('double') || 0, 10);
          if (dblclick > 0) {
            $li.data('double', dblclick - 1);
            return;
          }
          self._$el.find('li').removeClass('highlighted');
          $li.addClass('highlighted');
          triggerPathEvent($li, 'highlighted');
          toggleExpandState($li);
        }, 0);
        return false;
      });

      this._$el.on('dblclick', 'li', function (/*e*/) {
        var $li = $(this);
        $li.data('double', 1);
        triggerPathEvent($li, 'selected');
        return false;
      });

      this._$el.on('click', 'i.icon-lock, i.icon-unlock', function (e) {
        var $i = $(this);
        toggleClass($i, 'icon-lock', 'icon-unlock');
        e.stopPropagation();
        e.preventDefault();
        return false;
      });

      return this;
    },

    filter: function (/*query*/) {
      throw new Error('`filter` is not implemented');
    },

    on: function (evt, callback) {
      bus.subscribe(evt, callback);
      return this;
    }
  };

  return function (options) {
    if (typeof options === 'string') {
      options = {selector: options};
    }
    if (!options.hasOwnProperty('selector')) {
      throw new Error('A selector must be specified');
    }
    $.extend(config, options);
    return api;
  };

}));


