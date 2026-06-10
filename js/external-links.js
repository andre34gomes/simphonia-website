/**
 * Simphonia — External Link Handler
 *
 * Automatically enhances external links with security and UX best practices:
 *
 * - Adds `target="_blank"` so external links open in a new tab.
 * - Adds `rel="noopener noreferrer"` to prevent reverse tabnapping attacks.
 * - Adds a subtle external link icon (↗) for visual affordance.
 * - Tracks external link clicks via a custom event for analytics.
 * - Skips internal links, anchor links, mailto:, tel:, and javascript: URIs.
 *
 * Re-scans the DOM after SPA page transitions via the `simphonia:navigate` event
 * and MutationObserver fallback.
 *
 * Zero external dependencies.
 */
'use strict';

(function () {
  if (typeof document === 'undefined') return;

  const processed = new WeakSet();
  const origin = window.location.origin;

  /**
   * Returns true if the href points to an external site.
   */
  function isExternal(href) {
    if (!href) return false;
    // Skip non-http protocols
    if (/^(mailto:|tel:|javascript:|#)/.test(href)) return false;
    try {
      const url = new URL(href, origin);
      return url.origin !== origin;
    } catch (e) {
      return false;
    }
  }

  /**
   * Processes a single anchor element: adds security attrs, icon, and click tracking.
   */
  function processLink(anchor) {
    if (processed.has(anchor)) return;
    if (!isExternal(anchor.href)) return;

    processed.add(anchor);

    // Security: prevent reverse tabnapping
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');

    // Visual affordance: add external link icon if not already present
    if (!anchor.querySelector('.external-icon') && !anchor.dataset.noExternalIcon) {
      const icon = document.createElement('span');
      icon.className = 'external-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = ' ↗';
      icon.style.cssText = 'font-size: 0.75em; opacity: 0.6; vertical-align: super;';
      anchor.appendChild(icon);
    }

    // Analytics: dispatch custom event on click
    anchor.addEventListener('click', function () {
      try {
        const event = new CustomEvent('simphonia:external-link', {
          detail: { url: anchor.href, text: anchor.textContent.trim() },
        });
        document.dispatchEvent(event);
      } catch (e) {
        // Ignore — analytics is non-critical
      }
    });
  }

  /**
   * Scans the DOM for unprocessed external links and enhances them.
   */
  function scanLinks() {
    const anchors = document.querySelectorAll('a[href]');
    for (let i = 0; i < anchors.length; i++) {
      processLink(anchors[i]);
    }
  }

  // Initial scan
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanLinks);
  } else {
    scanLinks();
  }

  // Re-scan after SPA navigation
  document.addEventListener('simphonia:navigate', scanLinks);

  // Fallback: re-scan on DOM mutations.
  // Debounced to avoid repeated calls during rapid DOM updates (e.g. destinations grid).
  if (typeof MutationObserver !== 'undefined') {
    let _mutationTimer = null;
    const observer = new MutationObserver(function (mutations) {
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          clearTimeout(_mutationTimer);
          _mutationTimer = setTimeout(scanLinks, 150);
          break;
        }
      }
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // Log in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('simphonia:external-link', function (e) {
      console.info('%c🔗 External link clicked:', 'color: #6366F1;', e.detail.url);
    });
  }
}());

