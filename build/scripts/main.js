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
    window.tvShowTree = tbtree('#tvshows');
    window.tvShowTree.on('loaded', function () {
      console.log('TV show tree has data');
    });
    window.tvShowTree.load(window.tvshows);
    window.tvShowTree.on('selected', function (e) {
      console.log(e);
    });

    window.artistTree = tbtree('#artists');
    window.artistTree.load(window.artists);
    window.artistTree.on('expanded', function (e) {
      console.log(e);
    });
  });
});
