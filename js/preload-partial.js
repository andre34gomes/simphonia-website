// Preloads the page partial for the current URL so it's in-cache when the router runs.
// Must be loaded synchronously (no defer/async) for early preload injection.
// NOTE: This map intentionally duplicates what router.js uses because preload-partial
// runs in <head> before router.js loads (deferred). Keeping it in sync manually is
// acceptable — routes change very rarely.
(function () {
  const map = {
    '/':               '/pages/home',
    '/destinations':   '/pages/destinations',
    '/how-it-works':   '/pages/how-it-works',
    '/support':        '/pages/support',
    '/about':          '/pages/about',
    '/privacy':        '/pages/privacy',
    '/terms':          '/pages/terms',
    '/not-found':      '/pages/not-found',
    '/join':           '/pages/join',
    '/verify-email':   '/pages/verify-email',
    '/reset-password': '/pages/reset-password',
    '/open-in-app':    '/pages/open-in-app',
  };
  const path = window.location.pathname.split('#')[0].replace(/\/+$/, '') || '/';
  const url  = map[path] || '/pages/not-found';
  const link = document.createElement('link');
  link.rel  = 'preload';
  link.as   = 'fetch';
  link.href = url;
  link.crossOrigin = 'same-origin';
  document.head.appendChild(link);
}());
