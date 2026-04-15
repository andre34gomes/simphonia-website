/**
 * Simphonia — Page Preloader
 *
 * Inserts a <link rel="preload"> for the current URL's page partial so the
 * HTML is already in the browser cache when the SPA router executes.
 */
(function () {
  var map = {
    '/':             '/pages/home',
    '/destinations': '/pages/destinations',
    '/how-it-works': '/pages/how-it-works',
    '/support':      '/pages/support',
    '/about':        '/pages/about',
    '/privacy':      '/pages/privacy',
    '/terms':        '/pages/terms',
    '/not-found':    '/pages/not-found',
  };
  var path = window.location.pathname.split('#')[0].replace(/\/+$/, '') || '/';
  var url  = map[path] || '/pages/not-found';
  var link = document.createElement('link');
  link.rel  = 'preload';
  link.as   = 'fetch';
  link.href = url;
  link.crossOrigin = 'same-origin';
  document.head.appendChild(link);
}());

