/**
 * Simphonia — CSS Preload → Stylesheet Swap
 *
 * Converts <link rel="preload" as="style" data-swap> tags (used for
 * non-render-blocking, page-specific CSS) into active
 * <link rel="stylesheet"> tags once each file has finished downloading.
 *
 * Why an external script instead of the common inline `onload="..."`
 * attribute? Our Content-Security-Policy intentionally omits
 * 'unsafe-inline' from script-src. Inline event-handler attributes are
 * governed by script-src (not style-src), so an inline onload would be
 * silently blocked by the browser — leaving the page permanently
 * unstyled. Attaching the listener from an external file avoids that.
 *
 * Must load synchronously (no defer/async), immediately after the
 * preload <link> tags in <head>, so the listeners are attached before
 * each file's `load` event can fire.
 */
(function () {
  'use strict';

  function activate(link) {
    if (link.rel !== 'stylesheet') link.rel = 'stylesheet';
  }

  var links = document.querySelectorAll('link[rel="preload"][as="style"][data-swap]');
  for (var i = 0; i < links.length; i++) {
    (function (link) {
      link.addEventListener('load', function () { activate(link); }, { once: true });
      link.addEventListener('error', function () { activate(link); }, { once: true });
      // Safety net: a few older/embedded WebViews don't reliably fire
      // load/error for preloaded stylesheets. Force-activate shortly
      // after so the page is never left unstyled if that happens.
      setTimeout(function () { activate(link); }, 3000);
    })(links[i]);
  }
}());
