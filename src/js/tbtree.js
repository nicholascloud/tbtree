/*global window:true, jQuery:true, _:true*/

var tbtree = (function ($, _) {
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
    }
  }());

  $.fn.toggleClass = function (a, b) {
    this.each(function () {
      var $this = $(this);
      if ($this.hasClass(a)) {
        $this.removeClass(a).addClass(b);
      } else if ($this.hasClass(b)) {
        $this.removeClass(b).addClass(a);
      } else {
        $this.addClass(a);
      }
    });
  };

  var config = {
    icons: {
      expanded: 'icon-chevron-down',
      collapsed: 'icon-chevron-right',
      leaf: 'icon-file'
    }
  };

  var buildTree = function (obj, $parent) {
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
  };

  var triggerSelectedEvent = function ($li) {
    var segments = [];
    segments.push($li.attr('data-path'));
    $li.parents('li').each(function (i, li) {
      segments.push($(li).attr('data-path'));
    });
    var fullPath = segments.reverse().join('/');
    bus.publish('selected', {path: fullPath});
  };

  var toggleExpandState = function ($li) {
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
  };

  var api = {
    load: function (data) {
      var $E = $(config.selector).addClass('tbtree');

      buildTree(data, $E);

      $E.on('click', 'li', function (e) {
        var $li = $(this);
        $E.find('li').removeClass('selected');
        $li.addClass('selected');
        triggerSelectedEvent($li);
        toggleExpandState($li);

        e.stopPropagation();
        return false;
      });

      $E.on('click', 'i.icon-lock, i.icon-unlock', function (e) {
        $(this).toggleClass('icon-lock', 'icon-unlock');
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

}(this.jQuery, this._));


