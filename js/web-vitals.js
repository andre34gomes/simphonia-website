/**
 * Simphonia — Web Vitals Performance Monitor
 *
 * Tracks Core Web Vitals (LCP, FID, CLS, FCP, TTFB) using the
 * PerformanceObserver API. Results are logged to the console in
 * development and can optionally be sent to an analytics endpoint.
 *
 * No external dependencies — uses native browser APIs only.
 * Gracefully degrades in browsers that don't support PerformanceObserver.
 *
 * @see https://web.dev/vitals/
 */
'use strict';

(function () {
  // Skip if the browser doesn't support the required APIs.
  if (typeof PerformanceObserver === 'undefined') return;

  const metrics = {};
  let reported = false;

  /**
   * Observes a single performance entry type and extracts the metric value.
   */
  function observe(type, callback) {
    try {
      const observer = new PerformanceObserver(function (list) {
        const entries = list.getEntries();
        if (entries.length > 0) {
          callback(entries[entries.length - 1]);
        }
      });
      observer.observe({ type: type, buffered: true });
    } catch (e) {
      // Entry type not supported in this browser — skip silently.
    }
  }

  // Largest Contentful Paint (LCP)
  observe('largest-contentful-paint', function (entry) {
    metrics.lcp = Math.round(entry.startTime);
  });

  // Interaction to Next Paint (INP) — replaces the deprecated FID metric.
  // INP measures responsiveness over the full session lifecycle, not just first input.
  // See: https://web.dev/articles/inp
  let _inpMax = 0;
  observe('event', function (entry) {
    // Only count interactions with a valid duration
    if (entry.duration == null) return;
    const latency = Math.round(entry.duration);
    if (latency > _inpMax) {
      _inpMax = latency;
      metrics.inp = _inpMax;
    }
  });

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries = [];

  observe('layout-shift', function (entry) {
    if (entry.hadRecentInput) return; // Ignore user-initiated shifts

    // Session window approach (Google's recommendation)
    if (sessionEntries.length > 0 &&
        entry.startTime - sessionEntries[sessionEntries.length - 1].startTime > 5000) {
      // New session — reset
      sessionValue = 0;
      sessionEntries = [];
    }
    if (sessionEntries.length > 0 &&
        entry.startTime - sessionEntries[0].startTime > 1000) {
      // Session gap too large — start new window
      sessionValue = 0;
      sessionEntries = [];
    }

    sessionEntries.push(entry);
    sessionValue += entry.value;

    if (sessionValue > clsValue) {
      clsValue = sessionValue;
      metrics.cls = Math.round(clsValue * 1000) / 1000;
    }
  });

  // First Contentful Paint (FCP)
  observe('paint', function (entry) {
    if (entry.name === 'first-contentful-paint') {
      metrics.fcp = Math.round(entry.startTime);
    }
  });

  // Time to First Byte (TTFB) from navigation timing
  try {
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      metrics.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
    }
  } catch (e) {
    // Ignore
  }

  /**
   * Reports collected metrics. Called once when the page is being unloaded
   * or after a generous timeout (to catch single-page app usage).
   */
  function reportMetrics() {
    if (reported) return;
    reported = true;

    // Log to console in development for manual inspection.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.group('%c⚡ Web Vitals', 'color: #10B981; font-weight: bold;');
      console.table({
        'TTFB (ms)': { value: metrics.ttfb || '—', target: '< 800ms' },
        'FCP (ms)':  { value: metrics.fcp  || '—', target: '< 1800ms' },
        'LCP (ms)':  { value: metrics.lcp  || '—', target: '< 2500ms' },
        'INP (ms)':  { value: metrics.inp  || '—', target: '< 200ms' },
        'CLS':       { value: metrics.cls  || '—', target: '< 0.1' },
      });
      console.groupEnd();
    }

    // Send to analytics endpoint when __SIMPHONIA_ANALYTICS_URL is set.
    if (navigator.sendBeacon && window.__SIMPHONIA_ANALYTICS_URL) {
      try {
        navigator.sendBeacon(
          window.__SIMPHONIA_ANALYTICS_URL,
          JSON.stringify({ vitals: metrics, url: window.location.href, ts: Date.now() })
        );
      } catch (e) {
        // sendBeacon failure is non-fatal — metrics are still logged above
      }
    }
  }

  // Report on page visibility change (covers tab close, navigate away).
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      reportMetrics();
    }
  });

  // Fallback: report after 30 seconds for long-lived SPAs.
  setTimeout(reportMetrics, 30000);
}());
