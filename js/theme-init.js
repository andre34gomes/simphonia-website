/**
 * Simphonia — Theme Initialiser
 *
 * Must load SYNCHRONOUSLY (no defer/async) and as early as possible
 * in <head> to prevent a flash of the wrong colour scheme (FOUC).
 *
 * Reads the persisted theme from localStorage; falls back to the
 * OS/browser preference; defaults to dark. Sets data-theme on <html>
 * and updates the <meta name="theme-color"> so the browser chrome
 * matches immediately.
 *
 * Kept tiny on purpose — no dependencies, no module syntax.
 */
(function () {
  let t;
  try { t = localStorage.getItem('simphonia-theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') {
    t = (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches)
      ? 'light'
      : 'dark';
  }
  document.documentElement.dataset.theme = t;
  if (t === 'light') {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = '#FEF9EE';
  }
}());
