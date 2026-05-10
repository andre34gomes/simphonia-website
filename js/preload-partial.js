// Preloads the page partial for the current URL so it's in-cache when the router runs.
// Must be loaded synchronously (no defer/async) for early preload injection.
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

