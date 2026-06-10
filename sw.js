/**
 * Simphonia PWA Service Worker — Network-first with offline shell cache
 *
 * Strategy:
 *  - HTML pages: network-first (always serve fresh; fall back to cache if offline)
 *  - CSS / JS / fonts: stale-while-revalidate (instant load + background refresh)
 *  - API calls: network-only (never cache dynamic data)
 *
 * Cache versioning: bump CACHE_VERSION when deploying breaking asset changes
 * or routing changes that should invalidate cached HTML behavior.
 */

const CACHE_VERSION = 'simphonia-v17';

// Core shell assets cached on install.
// The SPA still powers in-app navigation, but direct loads for known clean URLs
// are served by their static route shells and unknown routes now fall back to
// the branded 404 page instead of a global index.html rewrite.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/404.html',
  '/css/404.css?v=20260403',
  '/css/base.css?v=20260403b',
  '/css/home.css?v=20260403b',
  '/css/about.css?v=20260403',
  '/css/destinations.css?v=20260403',
  '/css/how-it-works.css?v=20260403',
  '/css/legal.css?v=20260504',
  '/css/support.css?v=20260403',
  '/css/deeplink.css?v=20260511',
  '/js/animations-core.js?v=20260402',
  '/js/animations-home.js?v=20260402',
  '/js/animations-subpages.js?v=20260402',
  '/js/auth.js?v=20260402',
  '/js/cdn-fallback.js',
  '/js/destinations-page.js?v=20260402',
  '/js/i18n.js?v=20260402',
  '/js/main.js?v=20260402',
  '/js/not-found-page.js?v=20260403',
  '/js/router.js?v=20260403c',
  '/js/support.js?v=20260402',
  '/js/legal.js?v=20260504',
  '/js/theme-init.js',
  '/js/spa-mode.js',
  '/js/preload-partial.js',
  '/js/sw-register.js',
  '/js/404-animations.js',
  '/js/web-vitals.js?v=20260515',
  '/js/nav-prefetch.js?v=20260515',
  '/js/keyboard-shortcuts.js?v=20260515',
  '/js/scroll-progress.js?v=20260515',
  '/js/external-links.js?v=20260515',
  '/js/components/layout.js?v=20260402',
  '/assets/apple.svg',
  '/assets/apple-touch-icon.png',
  '/assets/favicon.svg',
  '/assets/google.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/logo-mark.svg',
  '/assets/og-image.png',
  '/manifest.json',
  // Page HTML partials — use clean URLs first to avoid cached permanent redirects
  '/pages/home',
  '/pages/destinations',
  '/pages/how-it-works',
  '/pages/support',
  '/pages/about',
  '/pages/not-found',
  '/pages/privacy',
  '/pages/terms',
  '/pages/join',
  '/pages/verify-email',
  '/pages/reset-password',
  '/pages/open-in-app',
];

// Origins that should never be cached (API data, CDN scripts, flag images)
const NEVER_CACHE_ORIGINS = [
  'https://api.simphonia.pt',
  'http://localhost:',
  'https://cdnjs.cloudflare.com',
  'https://flagcdn.com',
];

// ─── Install: pre-cache core shell ───────────────────────────────────────────
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      // Use individual cache.add() calls so one failure doesn't abort the whole install
      return Promise.allSettled(
        PRECACHE_URLS.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn('[SW] Pre-cache skipped:', url, err.message);
          });
        })
      );
    }).then(function () {
      // Activate immediately — don't wait for existing tab to close
      return self.skipWaiting();
    })
  );
});

// ─── Activate: clean up old caches + enable navigation preload ──────────────
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_VERSION; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      // Enable navigation preload if supported — lets the browser start
      // fetching HTML in parallel with SW boot, reducing TTFB by ~50-100ms.
      if (self.registration.navigationPreload) {
        return self.registration.navigationPreload.enable();
      }
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ─── Fetch: routing logic ─────────────────────────────────────────────────────
self.addEventListener('fetch', function (event) {
  var req = event.request;

  // Ignore non-GET requests and browser-extension requests
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  // Never intercept API calls or third-party CDN requests
  var isExternal = NEVER_CACHE_ORIGINS.some(function (origin) {
    return req.url.includes(origin);
  });
  if (isExternal) return;

  // Determine strategy based on destination
  var url = new URL(req.url);
  var isHTML = req.headers.get('Accept') && req.headers.get('Accept').includes('text/html');
  var isAsset = /\.(css|js|woff2?|ttf|svg|png|jpg|jpeg|gif|webp|ico)(\?|$)/.test(url.pathname);

  if (isHTML) {
    // HTML: network-first — always try to fetch fresh; serve cache if offline
    event.respondWith(networkFirst(req, event.preloadResponse));
  } else if (isAsset) {
    // CSS/JS/Fonts: stale-while-revalidate — instant from cache + refresh in background
    event.respondWith(staleWhileRevalidate(req));
  }
  // Everything else: browser default (no interception)
});

// ─── Strategy: Network-first (with navigation preload support) ───────────────
function networkFirst(req, preloadResponse) {
  // Use navigation preload response if available (skips full SW fetch overhead)
  var networkPromise = (preloadResponse || Promise.resolve(null)).then(function (preloaded) {
    if (preloaded) return preloaded;
    return fetch(req);
  });

  return networkPromise.then(function (networkResponse) {
    if (networkResponse.ok) {
      var clone = networkResponse.clone();
      caches.open(CACHE_VERSION).then(function (cache) {
        cache.put(req, clone);
      });
    }
    return networkResponse;
  }).catch(function () {
    return caches.match(req).then(function (cached) {
      return cached || caches.match('/index.html');
    });
  });
}

// ─── Strategy: Stale-while-revalidate ────────────────────────────────────────
function staleWhileRevalidate(req) {
  return caches.open(CACHE_VERSION).then(function (cache) {
    return cache.match(req).then(function (cached) {
      var networkPromise = fetch(req).then(function (networkResponse) {
        if (networkResponse.ok) {
          cache.put(req, networkResponse.clone());
        }
        return networkResponse;
      }).catch(function (err) {
        // If we have a stale copy, return it — stale is fine.
        // If not, re-throw so the browser shows its default offline error.
        if (cached) return cached;
        throw err;
      });

      return cached || networkPromise;
    });
  });
}






