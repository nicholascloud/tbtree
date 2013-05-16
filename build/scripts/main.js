/*global requirejs, require*/
requirejs.config({
  paths: {
    'jquery': '../lib/jquery-1.9.1',
    'underscore': '../lib/underscore-1.4.4'
  },
  shim: {
    'underscore': {
      exports: '_'
    }
  }
});

require(['jquery', 'tbtree'], function ($, tbtree) {
  'use strict';
  $().ready(function () {
    window.tree = tbtree('#tv-shows');
    window.tree.load(window.tvShows);
    window.tree.on('highlighted', function (e) {
      console.log(e);
    });
  });
});
