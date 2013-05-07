/**
 * The MIT License (MIT)
 *
 * tbtree 0.2.0 Copyright (c) 2013 Nicholas Cloud
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
/*global define:true*/
/* jshint forin:false */
define(['jquery', 'underscore'], function ($, _) {
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
        if (!this.hasSubscriptions(event)) {
          return;
        }
        subscriptions[event] = _.without(subscriptions[event], callback);
      },
      unsubscribeAll: function (callback) {
        var _this = this;
        this.subscribedEvents(callback).forEach(function (e) {
          _this.unsubscribe(e, callback);
        });
      },
      hasSubscriptions: function (event) {
        if (!event) {
          return Object.keys(subscriptions).length > 0;
        }
        return subscriptions.hasOwnProperty(event) &&
          subscriptions[event].length > 0;
      },
      subscribedEvents: function (callback) {
        var subscribedEvents = [];
        Object.keys(subscriptions).forEach(function (key) {
          if (subscriptions[key].indexOf(callback) > -1) {
            subscribedEvents.push(key);
          }
        });
        return _.uniq(subscribedEvents).sort();
      },
      publish: function (event, context) {
        if (!this.hasSubscriptions(event)) {
          return;
        }
        var args = Array.prototype.slice.call(arguments, 1);
        subscriptions[event].forEach(function (e) {
          e.apply(context || null, args);
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

  function buildTree(obj, $parent) {
    var $ul = $('<ul></ul>')
      .appendTo($parent);
    for (var p in obj) {
      if (!obj.hasOwnProperty(p)) {
        continue;
      }
      var value = obj[p];
      var $li = $('<li></li>')
        .append('<i></i>')
        .append('<a></a>')
        .append('<i class="icon-lock"></i>')
        .attr('data-path', p)
        .attr('data-state', 'collapsed')
        .appendTo($ul);
      if (_.isObject(value)) {
        $li.addClass('branch');
        $li.find('a').text(p);
        $li.find('i').first().addClass(config.icons.collapsed);
        buildTree(value, $li);
      } else {
        $li.addClass('leaf');
        $li.find('a')
          .append('<span class="label label-inverse">' + p + '</span>')
          .find('span')
          .after(obj[p]);
        $li.find('i').first().addClass(config.icons.leaf);
      }
      $li.find('> ul').hide();
    }
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
    load: function (data) {
      var $E = $(config.selector).addClass('tbtree');

      buildTree(data, $E);

      $E.on('click', 'li', function (e) {
        var $li = $(this);
        setTimeout(function () {
          var dblclick = parseInt($li.data('double'), 10);
          if (dblclick > 0) {
            $li.data('double', dblclick - 1);
            return;
          }
          $E.find('li').removeClass('highlighted');
          $li.addClass('highlighted');
          triggerPathEvent($li, 'highlighted');
          toggleExpandState($li);
        }, 200);
        return false;
      });

      $E.on('dblclick', 'li', function (e) {
        var $li = $(this);
        $li.data('double', 2);
        triggerPathEvent($li, 'selected');
        return false;
      });

      $E.on('click', 'i.icon-lock, i.icon-unlock', function (e) {
        toggleClass($(this), 'icon-lock', 'icon-unlock');
        e.stopPropagation();
        e.preventDefault();
        return false;
      });

      return this;
    },

    filter: function (query) {
      console.log(query);
      return this;
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

});


