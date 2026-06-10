/**
 * Simphonia — Navigation Prefetch
 *
 * Prefetches SPA page partials when the user hovers over navigation links.
 * This makes subsequent page transitions near-instant because the HTML
 * partial is already in the browser's fetch cache by the time the click occurs.
 *
 * Supports both desktop (mouseenter) and mobile (touchstart) interaction models.
 * Each URL is prefetched at most once per session.
 *
 * Must be loaded AFTER router.js (depends on page partial URL knowledge).
 */
'use strict';

(function () {
  const prefetchedUrls = {};
  let hoverTimeout = null;

  /**
   * Page path → partial URL mapping, derived from the router's ROUTES.
   * Computed once on first call and cached — routes are static after boot.
   */
  let _partialMapCache = null;
  function getPartialMap() {
    if (_partialMapCache) return _partialMapCache;
    const routes = window.__simphoniaRoutes || {};
    const map = {};
    Object.keys(routes).forEach(function (path) {
      map[path] = '/pages/' + routes[path].page;
    });
    _partialMapCache = map;
    return map;
  }

  /**
   * Prefetches a page partial URL if it hasn't been prefetched yet in this session.
   * Uses `<link rel="prefetch">` for non-blocking background fetch.
   */
  function prefetchPartial(path) {
    const partialMap = getPartialMap();
    const url = partialMap[path];
    if (!url || prefetchedUrls[url]) return;
    prefetchedUrls[url] = true;

    // Prefer link[rel=prefetch] for background low-priority fetch
    if (typeof document.createElement === 'function') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'fetch';
      link.crossOrigin = 'same-origin';
      document.head.appendChild(link);
    }
  }

  /**
   * Resolves the SPA path from an anchor element's href.
   * Returns null for external links or anchors without href.
   */
  function resolveLocalPath(anchor) {
    if (!anchor || !anchor.href) return null;
    try {
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return null;
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const partialMap = getPartialMap();
      return partialMap[path] ? path : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Attaches prefetch listeners to all internal navigation links.
   * Safe to call multiple times — idempotent.
   */
  function attachPrefetchListeners() {
    const links = document.querySelectorAll('a[href]');
    links.forEach(function (link) {
      if (link.dataset.prefetchAttached) return;
      link.dataset.prefetchAttached = 'true';

      // Desktop: prefetch on hover with a small delay to avoid accidental triggers
      link.addEventListener('mouseenter', function () {
        const path = resolveLocalPath(link);
        if (!path) return;
        hoverTimeout = setTimeout(function () {
          prefetchPartial(path);
        }, 65); // 65ms — filters out mouse flyovers
      }, { passive: true });

      link.addEventListener('mouseleave', function () {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
      }, { passive: true });

      // Mobile: prefetch on touchstart (finger down before tap completes)
      link.addEventListener('touchstart', function () {
        const path = resolveLocalPath(link);
        if (path) prefetchPartial(path);
      }, { passive: true });
    });
  }

  // Attach on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachPrefetchListeners);
  } else {
    attachPrefetchListeners();
  }

  // Re-attach after SPA navigation (router.js dispatches this event after page transitions)
  document.addEventListener('simphonia:navigate', attachPrefetchListeners);

  // Also re-run on DOM mutations as a fallback for dynamic nav injection.
  // Debounced to avoid repeated calls during rapid DOM updates (e.g. grid renders).
  if (typeof MutationObserver !== 'undefined') {
    let _mutationTimer = null;
    const observer = new MutationObserver(function (mutations) {
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          clearTimeout(_mutationTimer);
          _mutationTimer = setTimeout(attachPrefetchListeners, 150);
          break;
        }
      }
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
}());
