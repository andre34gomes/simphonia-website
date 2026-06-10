/**
 * CDN Fallback Loader — Simphonia Website
 *
 * If any CDN library fails to load, this script tries to load a local
 * copy. All libraries (GSAP, ScrollTrigger) are treated as
 * progressive enhancement — the site is fully usable without them.
 *
 * Usage: include AFTER the CDN <script> tags and BEFORE animations.js
 *
 *   <script defer src="js/cdn-fallback.js"></script>
 */

'use strict';

(function () {
  /**
   * Injects a <script> tag for a local fallback if the global symbol
   * is still undefined after the CDN script should have loaded.
   *
   * @param {string} globalSymbol - The global (window) symbol to check (e.g. 'gsap')
   * @param {string} localPath   - Path to the local fallback script
   */
  function loadFallback(globalSymbol, localPath) {
    if (typeof window[globalSymbol] !== 'undefined') return; // CDN loaded fine

    const script = document.createElement('script');
    script.src = localPath;
    script.async = false; // preserve execution order
    script.onerror = function () {
      console.warn('[Simphonia] Local fallback also failed for ' + globalSymbol);
    };
    document.head.appendChild(script);
  }

  function runFallbacks() {
    loadFallback('gsap',          '/js/vendor/gsap.min.js');
    loadFallback('ScrollTrigger', '/js/vendor/ScrollTrigger.min.js');
  }

  // Try as early as DOMContentLoaded for faster recovery if CDN is down;
  // re-check at window load as a safety net for slow CDN responses.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runFallbacks, { once: true });
  } else {
    // DOM already parsed — run immediately
    runFallbacks();
  }
  window.addEventListener('load', runFallbacks, { once: true });
})();
