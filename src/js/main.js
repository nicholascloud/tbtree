require.config({
  baseUrl: 'js',
  paths: {
    'jquery': '../lib/jquery-1.7.2',
    'underscore': '../lib/underscore',
    'tbtree': './tbtree'
  },
  shim: {
    'tbtree': {
      deps: ['jquery', 'underscore'],
      exports: 'tbtree'
    },
    'underscore': {
      exports: '_'
    }
  }
});

require(['jquery', 'tbtree'], function ($, tbtree) {
  $().ready(function () {
    tbtree('#tv-shows').load(window.tvShows);
  });
});
