(function () {
  'use strict';

  var TRUSTED_HOSTS = ['simphonia.pt'];
  var SENSITIVE_PAGES = {
    'reset-password': {
      loadingId: 'rp-loading',
      fallbackId: 'rp-fallback',
      desktopId: 'rp-desktop'
    },
    'verify-email': {
      loadingId: 've-loading',
      fallbackId: 've-fallback',
      desktopId: 've-desktop'
    }
  };

  function getSensitivePage() {
    var page = document.querySelector('[data-page="reset-password"], [data-page="verify-email"]');
    return page && page.getAttribute('data-page');
  }

  function isTrustedSensitiveRoute(pageName) {
    return window.location.protocol === 'https:' &&
      TRUSTED_HOSTS.indexOf(window.location.hostname) !== -1 &&
      window.location.pathname.replace(/\/+$/, '') === '/' + pageName;
  }

  function showSafeFallback(page) {
    var config = SENSITIVE_PAGES[page];
    var loading = document.getElementById(config.loadingId);
    var fallback = document.getElementById(config.fallbackId);
    var desktop = document.getElementById(config.desktopId);

    if (loading) loading.style.display = 'none';
    if (/android|iphone|ipad|ipod/i.test(navigator.userAgent || '')) {
      if (fallback) fallback.style.display = 'block';
    } else if (desktop) {
      desktop.style.display = 'block';
    }
  }

  function initialize() {
    var page = getSensitivePage();
    if (!page || !isTrustedSensitiveRoute(page)) return;

    // A security-sensitive token must never persist in browser history or storage.
    if (new URLSearchParams(window.location.search).has('token')) {
      history.replaceState(null, '', '/' + page);
    }
    showSafeFallback(page);
  }

  window.initDeepLinkTokenPage = initialize;
  document.addEventListener('simphonia:routechange', initialize);
})();
