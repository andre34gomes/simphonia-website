/**
 * Simphonia — Scroll Progress Indicator
 *
 * Displays a thin progress bar at the top of the viewport that fills
 * from left to right as the user scrolls down the page.
 *
 * - Smoothly animates using requestAnimationFrame for jank-free updates.
 * - Automatically hides (opacity 0) when at the very top of the page.
 * - Height, color, and z-index are configurable via CSS custom properties.
 * - Zero external dependencies — uses only native DOM/CSS APIs.
 * - Gracefully handles SPA navigation (resets on route change).
 *
 * CSS custom properties:
 *   --scroll-progress-height  (default: 3px)
 *   --scroll-progress-color   (default: #D4AF37)
 *   --scroll-progress-z       (default: 9999)
 */
'use strict';

(function () {
  // Skip if running in a non-browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  let bar = null;
  let ticking = false;

  /**
   * Creates the progress bar element and injects it into the DOM.
   */
  function createBar() {
    if (bar) return;

    bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('role', 'presentation');
    bar.id = 'scroll-progress-bar';

    const style = bar.style;
    style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 0%',
      'height: var(--scroll-progress-height, 3px)',
      'background: var(--scroll-progress-color, #D4AF37)',
      'z-index: var(--scroll-progress-z, 9999)',
      'pointer-events: none',
      'transition: opacity 0.3s ease',
      'opacity: 0',
      'will-change: width',
    ].join('; ');

    document.body.appendChild(bar);
  }

  /**
   * Updates the progress bar width based on current scroll position.
   */
  function updateProgress() {
    ticking = false;
    if (!bar) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    if (scrollHeight <= 0) {
      bar.style.width = '0%';
      bar.style.opacity = '0';
      return;
    }

    const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
    bar.style.width = progress + '%';
    bar.style.opacity = progress > 0.5 ? '1' : '0';
  }

  /**
   * Throttled scroll handler using requestAnimationFrame.
   */
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  }

  /**
   * Resets the progress bar (e.g. on SPA navigation).
   */
  function reset() {
    if (bar) {
      bar.style.width = '0%';
      bar.style.opacity = '0';
    }
    // Recalculate after DOM settles
    setTimeout(updateProgress, 100);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      createBar();
      updateProgress();
    });
  } else {
    createBar();
    updateProgress();
  }

  // Listen for scroll events
  window.addEventListener('scroll', onScroll, { passive: true });

  // Listen for window resize (scroll height may change)
  window.addEventListener('resize', onScroll, { passive: true });

  // Reset on SPA navigation
  document.addEventListener('simphonia:navigate', reset);

  // Expose reset function for external use
  window.__simphoniaScrollProgress = { reset: reset };
}());

