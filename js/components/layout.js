/**
 * Shared layout components — Shell, Nav & Footer
 * Injected via JS to keep all pages DRY.
 */

const CURRENT_YEAR = new Date().getFullYear();
const THEME_KEY = 'simphonia-theme';
const NAV_COLLAPSE_WIDTH = 960;

// ────────────────────────────────────────
// Shared utility: Country code → flag image
// Uses flagcdn.com images instead of Unicode Regional Indicator emoji
// because Windows does not render flag emoji in any browser.
// ────────────────────────────────────────
window.flagEmoji = function(code) {
  if (!code || code.length < 2) return '';
  const c = code.toLowerCase().slice(0, 2);
  // Reject anything that isn't exactly 2 ASCII letters. `code` is sourced
  // from API data (destination/country lists) and this string is later
  // concatenated straight into innerHTML by callers — validating here
  // (rather than just escaping) stops a malformed/unexpected country code
  // from ever breaking out of the src/alt attributes, matching escHTML()'s
  // safe-by-construction approach above.
  if (!/^[a-z]{2}$/.test(c)) return '';
  return '<img src="https://flagcdn.com/20x15/' + c + '.png"' +
    ' srcset="https://flagcdn.com/40x30/' + c + '.png 2x"' +
    ' width="20" height="15"' +
    ' alt="' + c.toUpperCase() + '"' +
    ' class="flag-img"' +
    ' loading="lazy"' +
    ' decoding="async">';
};

// ────────────────────────────────────────
// Shared utility: HTML escape (XSS prevention)
// Reuses a single cached element to avoid DOM allocation per call.
// ────────────────────────────────────────
const _escDiv = document.createElement('div');
window.escHTML = function(str) {
  _escDiv.textContent = str;
  return _escDiv.innerHTML;
};

// ────────────────────────────────────────
// Shared utility: API base URL detection
// ────────────────────────────────────────
window.SIMPHONIA_API = Object.freeze({
  base: (function () {
    const h = location.hostname;
    // Local development: use local backend
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') {
      return 'http://localhost:3000';
    }
    // Production / staging
    return 'https://api.simphonia.pt';
  })(),
});

// ────────────────────────────────────────
// Shared scroll coordinator
// ────────────────────────────────────────

(function initScrollCoordinator() {
  if (typeof window === 'undefined' || window.scrollCoordinator) return;

  let refreshPending = false;
  let waitingForLoad = false;

  function setScrollLocked(isLocked) {
    // Only toggle on body — never touch html, which is the scroll container on WebKit.
    document.body.classList.toggle('nav-scroll-locked', !!isLocked);
  }

  function scheduleRefresh(options) {
    options = options || {};

    function flush() {
      if (refreshPending) return;
      refreshPending = true;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          refreshPending = false;
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        });
      });
    }

    if (options.waitForLoad && document.readyState !== 'complete') {
      if (waitingForLoad) return;
      waitingForLoad = true;
      window.addEventListener('load', function onLoad() {
        waitingForLoad = false;
        flush();
      }, { once: true });
      return;
    }

    flush();
  }

  function focusHashTarget(hash) {
    const rawHash = typeof hash === 'string' ? hash : window.location.hash;
    if (!rawHash) return null;

    const id = rawHash.charAt(0) === '#' ? rawHash.slice(1) : rawHash;
    if (!id) return null;

    const target = document.getElementById(decodeURIComponent(id));
    if (!target) return null;

    requestAnimationFrame(function () {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      if (typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
      }
    });

    return target;
  }

  window.scrollCoordinator = {
    scheduleRefresh: scheduleRefresh,
    setScrollLocked: setScrollLocked,
    clearScrollLock: function () { setScrollLocked(false); },
    focusHashTarget: focusHashTarget,
  };

  window.scheduleScrollRefresh = scheduleRefresh;

  // Restore clean state after bfcache navigation.
  // GSAP's ignoreMobileResize:true handles resize internally — no refresh on resize here.
  window.addEventListener('pageshow', function (event) {
    setScrollLocked(false);
    if (event.persisted) {
      scheduleRefresh();
    }
  });
})();

// ────────────────────────────────────────
// Theme helpers
// ────────────────────────────────────────

/** Read the persisted theme or fall back to system preference (default: dark). */
function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (_) { /* private browsing */ }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function currentTheme() {
  return document.documentElement.dataset.theme || 'dark';
}

/** Apply theme to <html>, swap logos & favicons, persist choice. */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;


  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#FEF9EE' : '#121212';

  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
}

/** Toggle between light / dark. */
let _themeTransitionTimer = null;
function toggleTheme() {
  // Clear any pending timer from a previous rapid toggle before creating a new one
  if (_themeTransitionTimer) {
    clearTimeout(_themeTransitionTimer);
    _themeTransitionTimer = null;
  }
  document.body.classList.add('theme-transition');
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  _themeTransitionTimer = setTimeout(() => {
    document.body.classList.remove('theme-transition');
    _themeTransitionTimer = null;
  }, 400);
}

/** Call once, early — before DOM paint when possible. */
function initTheme() {
  applyTheme(getStoredTheme());
  // Listen for system-preference changes if user hasn't manually toggled
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });
}

/**
 * Injects the shared body shell elements that every page needs:
 * skip-link, bg-noise, stars-canvas, and custom cursor.
 * Call this BEFORE injectNav so that the nav prepends after these.
 */
function injectShell() {
  const frag = document.createDocumentFragment();

  // Skip link — only inject if not already present in the HTML markup
  // (all pages now include a static skip-link for screen readers that load
  //  before JS; this guard prevents a duplicate when JS also runs)
  if (!document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.href = '#main-content';
    skip.className = 'skip-link';
    skip.textContent = window.t('nav.skipToMain');
    skip.setAttribute('data-i18n', 'nav.skipToMain');
    frag.appendChild(skip);
  }

  // Background noise
  const noise = document.createElement('div');
  noise.className = 'bg-noise';
  noise.setAttribute('aria-hidden', 'true');
  frag.appendChild(noise);

  // Animated star canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'stars-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  frag.appendChild(canvas);

  // Custom cursor
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.id = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  frag.appendChild(cursor);

  // Insert all at the very beginning of <body>, before any existing content
  document.body.insertBefore(frag, document.body.firstChild);
}

/**
 * Injects a sticky mobile CTA bar at the bottom of the page (mobile only).
 * Shows after the user scrolls past 500px.
 */
function injectMobileCTA() {
  const base = getBasePath();
  const bar = document.createElement('div');
  bar.className = 'mobile-cta-bar';
  bar.id = 'mobile-cta-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `
    <a href="${base}destinations/" class="btn btn--primary" data-i18n="mobileCta.browsePlans">${translateText('mobileCta.browsePlans')}</a>
    <a href="${base}how-it-works/" class="btn btn--outline" data-i18n="mobileCta.howItWorks">${translateText('mobileCta.howItWorks')}</a>
  `;
  document.body.appendChild(bar);
  // Scroll handling is batched in _sharedScrollTick (see injectBackToTop).
}

/**
 * Injects a back-to-top button that appears once the user scrolls 600px down.
 * Also batches the mobileCTA scroll check into the same rAF callback.
 */
function injectBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', window.t('backToTop'));
  btn.setAttribute('data-i18n-aria-label', 'backToTop');
  btn.setAttribute('aria-hidden', 'true');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 19V5"/>
      <path d="m5 12 7-7 7 7"/>
    </svg>
  `;
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    btn.classList.add('back-to-top--scrolling');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.blur();

    // Remove scrolling state when scroll finishes
    if ('onscrollend' in window) {
      window.addEventListener('scrollend', function () {
        btn.classList.remove('back-to-top--scrolling');
      }, { once: true });
    } else {
      // Fallback for browsers without scrollend event
      setTimeout(function () {
        btn.classList.remove('back-to-top--scrolling');
      }, 800);
    }
  });

  // ── Single shared scroll listener for both mobileCTA and backToTop ──
  const ctaBar = document.getElementById('mobile-cta-bar');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;

      // Back-to-top visibility
      const showBtn = y > 600;
      btn.classList.toggle('back-to-top--visible', showBtn);
      btn.setAttribute('aria-hidden', String(!showBtn));

      // Mobile CTA bar visibility
      if (ctaBar) {
        const showBar = y > 500;
        ctaBar.classList.toggle('mobile-cta-bar--visible', showBar);
        ctaBar.setAttribute('aria-hidden', String(!showBar));
      }

      // Scroll progress bar (consolidated here to avoid a separate listener)
      if (typeof window._updateScrollProgress === 'function') {
        window._updateScrollProgress();
      }

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Injects a lightweight cookie/privacy consent banner.
 * Does nothing if the user has already accepted.
 */
function injectCookieBanner() {
  const COOKIE_KEY = 'simphonia-cookies';
  try {
    if (localStorage.getItem(COOKIE_KEY)) return;
  } catch (_) {}

  const base = getBasePath();
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', translateText('accessibility.cookieConsent'));
  banner.setAttribute('data-i18n-aria-label', 'accessibility.cookieConsent');
  banner.setAttribute('aria-hidden', 'true');
  banner.setAttribute('aria-modal', 'true');

  banner.innerHTML = `
    <div class="cookie-banner__content">
      <div class="cookie-banner__icon" aria-hidden="true">🍪</div>
      <p class="cookie-banner__text">
        <span data-i18n="cookie.text">${translateText('cookie.text')}</span>
        <a href="${base}privacy/" data-i18n="cookie.privacyPolicy">${translateText('cookie.privacyPolicy')}</a>.
      </p>
      <div class="cookie-banner__actions">
        <button class="btn btn--ghost btn--sm" id="cookie-decline" data-i18n="cookie.decline">${translateText('cookie.decline')}</button>
        <button class="btn btn--primary btn--sm" id="cookie-accept" data-i18n="cookie.accept">${translateText('cookie.accept')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  // Show with a small delay so it doesn't distract on page load
  const showTimer = setTimeout(() => {
    banner.classList.add('cookie-banner--visible');
    banner.setAttribute('aria-hidden', 'false');
    // Move keyboard focus to the Accept button so keyboard/screen-reader users
    // can interact with the dialog without tabbing through the whole page first.
    const acceptBtn = document.getElementById('cookie-accept');
    if (acceptBtn) acceptBtn.focus();
  }, 1800);

  const dismiss = (accepted) => {
    clearTimeout(showTimer);
    if (accepted) {
      try { localStorage.setItem(COOKIE_KEY, '1'); } catch (_) {}
    }
    banner.classList.remove('cookie-banner--visible');
    banner.setAttribute('aria-hidden', 'true');
    setTimeout(() => banner.remove(), 400);
  };

  banner.addEventListener('click', (e) => {
    if (e.target.id === 'cookie-accept') dismiss(true);
    if (e.target.id === 'cookie-decline') dismiss(false);
  });

  // Focus trap: keep Tab cycling within the cookie banner while it is visible
  banner.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = banner.querySelectorAll('button, a[href]');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/**
 * Injects a thin scroll-progress bar at the very top of the viewport.
 * The bar fills from left to right as the user scrolls the page.
 */
function injectScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.id = 'scroll-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuenow', '0');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-label', window.t('accessibility.scrollProgress'));
  bar.setAttribute('data-i18n-aria-label', 'accessibility.scrollProgress');
  document.body.appendChild(bar);

  // Update logic is called by the shared scroll handler in injectBackToTop()
  // to avoid a redundant scroll listener. Exposed via window for the shared tick.
  window._updateScrollProgress = function () {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0;
    bar.style.transform = `scaleX(${pct / 100})`;
    bar.setAttribute('aria-valuenow', Math.round(pct));
  };

  // Also update on resize so orientation changes are covered.
  let resizeTicking = false;
  window.addEventListener('resize', () => {
    if (!resizeTicking) { resizeTicking = true; requestAnimationFrame(() => { window._updateScrollProgress(); resizeTicking = false; }); }
  }, { passive: true });
}


/**
 * Injects the shared <noscript> fallback styles at the end of <body>.
 */
function injectNoscript() {
  const ns = document.createElement('noscript');
  const style = document.createElement('style');
  style.textContent =
    '.reveal,.reveal--left,.reveal--right,.reveal--scale{opacity:1;visibility:visible;transform:none}' +
    '#stars-canvas,.cursor{display:none}' +
    '.mobile-cta-bar,.back-to-top,.cookie-banner{display:none}' +
    '.footer__brand,.footer__col,.footer__bottom{opacity:1;visibility:visible;transform:none}';
  ns.appendChild(style);
  document.body.appendChild(ns);
}

/**
 * Returns the path prefix to reach the site root.
 * Always '/' — the site runs as an SPA with absolute paths everywhere.
 */
let _cachedBasePath = null;
function getBasePath() {
  if (_cachedBasePath !== null) return _cachedBasePath;
  return (_cachedBasePath = '/');
}

/**
 * Returns the absolute path to a page slug.
 * Always returns an absolute path (/slug/) for SPA compatibility.
 */
function pagePath(slug) {
  return '/' + slug + '/';
}

function translateText(key) {
  if (typeof window.t !== 'function') return '';
  const value = window.t(key);
  return typeof value === 'string' ? value : '';
}

function nativeLanguageName(code) {
  return translateText('lang.names.' + code) || code.toUpperCase();
}

function brandMarkup() {
  const markSrc = '/assets/logo-mark.svg';
  return `
    <span class="nav__logo-icon" aria-hidden="true">
      <img src="${markSrc}" class="nav__logo-icon-image" alt="" width="40" height="40" decoding="async" fetchpriority="high">
    </span>
    <span class="nav__logo-wordmark">Simphonia</span>
  `;
}

/**
 * Returns 'nav__link--active' if the slug matches the current page.
 * In SPA mode, uses window.currentRoute instead of location.pathname.
 */
function activeClass(slug) {
  // SPA mode: use router's current route
  if (window.currentRoute !== undefined) {
    const current = window.currentRoute || 'home';
    if (slug === '') return current === 'home' ? 'nav__link--active' : '';
    return current === slug ? 'nav__link--active' : '';
  }
  // Fallback: use location pathname
  const path = window.location.pathname;
  if (slug === '') {
    const segments = path.replace(/\/index\.html$/, '').replace(/\/$/, '').split('/');
    const last = segments[segments.length - 1];
    const knownPages = ['destinations', 'how-it-works', 'support', 'about', 'privacy', 'terms'];
    return knownPages.includes(last) ? '' : 'nav__link--active';
  }
  const pattern = new RegExp('(^|/)' + slug + '(/|/index\\.html|$)');
  return pattern.test(path) ? 'nav__link--active' : '';
}

/** Returns aria-current="page" if the slug matches, empty string otherwise. */
function ariaCurrent(slug) {
  return activeClass(slug) ? ' aria-current="page"' : '';
}

/**
 * Returns the best app store URL for the current user agent.
 * iOS/iPadOS → App Store, Android → Play Store, all others → home page (highlights download buttons).
 */
function getDownloadUrl(base) {
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) {
    return 'https://apps.apple.com/app/simphonia';
  }
  if (/android/i.test(ua)) {
    return 'https://play.google.com/store/apps/details?id=com.simphonia.app';
  }
  // Desktop / unknown — navigate to the home page (click handler will highlight download btns)
  return base;
}

function _buildLangPicker() {
  const supported = window.SIMPHONIA_SUPPORTED_LANGS || ['en','pt','es','fr','de','it','nl','ja','zh','ko','ar','ru','tr','pl','uk','hi','id','vi','cs','hu','fa'];
  const current = window.SIMPHONIA_LANG || 'en';

  const options = supported.map(code => `
    <button class="lang-picker__option${code === current ? ' lang-picker__option--active' : ''}"
      data-lang="${code}" data-search="${code} ${nativeLanguageName(code).toLowerCase()}"
      aria-current="${code === current ? 'true' : 'false'}" type="button">
      <span class="lang-picker__option-code">${code.toUpperCase()}</span>
      <span class="lang-picker__option-name">${nativeLanguageName(code)}</span>
      ${code === current ? '<svg class="lang-picker__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
    </button>
  `).join('');

  return `
    <div class="lang-picker" id="lang-picker">
      <button class="lang-picker__btn" id="lang-picker-btn" type="button"
        aria-label="${translateText('lang.select')}: ${current.toUpperCase()}"
        aria-expanded="false" aria-controls="lang-picker-menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </button>
      <div class="lang-picker__menu" id="lang-picker-menu" role="listbox" aria-label="${translateText('lang.select')}">
        <div class="lang-picker__search-wrap">
          <svg class="lang-picker__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="lang-picker__search" id="lang-picker-search" type="text" placeholder="${translateText('lang.searchPlaceholder')}" data-i18n-placeholder="lang.searchPlaceholder" autocomplete="off" spellcheck="false" />
        </div>
        <div class="lang-picker__menu-inner" id="lang-picker-list">${options}</div>
        <div class="lang-picker__no-results" id="lang-picker-empty" data-i18n="lang.noResults" hidden>${translateText('lang.noResults')}</div>
      </div>
    </div>
  `;
}

function _initLangPicker(signal) {
  const picker = document.getElementById('lang-picker');
  if (!picker) return;
  const btn = document.getElementById('lang-picker-btn');
  const menu = document.getElementById('lang-picker-menu');
  const searchInput = document.getElementById('lang-picker-search');
  const list = document.getElementById('lang-picker-list');
  const emptyMsg = document.getElementById('lang-picker-empty');
  if (!btn || !menu) return;

  function openMenu() {
    picker.classList.add('lang-picker--open');
    btn.setAttribute('aria-expanded', 'true');
    // Auto-focus search after the opening transition
    if (searchInput) setTimeout(function () { searchInput.focus(); }, 60);
  }
  function closeMenu() {
    picker.classList.remove('lang-picker--open');
    btn.setAttribute('aria-expanded', 'false');
    // Clear search on close
    if (searchInput) {
      searchInput.value = '';
      _filterLangs('');
    }
  }
  function toggleMenu(e) {
    e.stopPropagation();
    picker.classList.contains('lang-picker--open') ? closeMenu() : openMenu();
  }

  // Search / filter
  function _filterLangs(query) {
    if (!list) return;
    const q = query.toLowerCase().trim();
    let anyVisible = false;
    list.querySelectorAll('.lang-picker__option').forEach(function (opt) {
      const hay = (opt.getAttribute('data-search') || '').toLowerCase();
      const show = !q || hay.indexOf(q) !== -1;
      opt.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    if (emptyMsg) emptyMsg.hidden = anyVisible;
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      _filterLangs(this.value);
    });
    // Prevent clicks on the search from closing the menu
    searchInput.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  btn.addEventListener('click', toggleMenu);

  menu.addEventListener('click', function (e) {
    const opt = e.target.closest('.lang-picker__option');
    if (!opt) return;
    const code = opt.dataset.lang;
    if (code && typeof window.setLang === 'function') {
      window.setLang(code);
    }
    closeMenu();
    e.stopPropagation();
  });

  document.addEventListener('click', function (e) {
    if (!picker.contains(e.target)) closeMenu();
  }, { signal });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();

    // Arrow key navigation within the language picker when open
    if (!picker.classList.contains('lang-picker--open')) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const options = Array.from(list.querySelectorAll('.lang-picker__option')).filter(function (opt) {
      return opt.style.display !== 'none';
    });
    if (!options.length) return;
    const focused = document.activeElement;
    let idx = options.indexOf(focused);
    if (e.key === 'ArrowDown') {
      idx = idx < options.length - 1 ? idx + 1 : 0;
    } else {
      idx = idx > 0 ? idx - 1 : options.length - 1;
    }
    options[idx].focus();
  }, { signal });

  // Re-render picker when language changes
  document.addEventListener('simphonia:langchange', function (e) {
    const code = e.detail && e.detail.lang;
    if (!code) return;
    btn.setAttribute('aria-label', window.t('lang.select') + ': ' + code.toUpperCase());
    if (list) {
      list.querySelectorAll('.lang-picker__option').forEach(function (opt) {
        const isActive = opt.dataset.lang === code;
        opt.classList.toggle('lang-picker__option--active', isActive);
        opt.setAttribute('aria-current', isActive ? 'true' : 'false');
        // Update check icon
        const existingCheck = opt.querySelector('.lang-picker__check');
        if (isActive && !existingCheck) {
          opt.insertAdjacentHTML('beforeend', '<svg class="lang-picker__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>');
        } else if (!isActive && existingCheck) {
          existingCheck.remove();
        }
      });
    }
  }, { signal });
}

function injectNav() {
  const base = getBasePath();
  const downloadUrl = getDownloadUrl(base);
  const isExternalDownload = downloadUrl.startsWith('http');
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.id = 'navbar';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', translateText('accessibility.mainNavigation'));
  nav.setAttribute('data-i18n-aria-label', 'accessibility.mainNavigation');

  nav.innerHTML = `
    <div class="nav__inner">
      <a href="${base}" class="nav__logo" aria-label="${translateText('nav.homeAriaLabel')}" data-i18n-aria-label="nav.homeAriaLabel">
        ${brandMarkup(base)}
      </a>

      <div class="nav__links">
        <a href="${pagePath('destinations')}" class="nav__link ${activeClass('destinations')}"${ariaCurrent('destinations')} data-i18n="nav.destinations">${translateText('nav.destinations')}</a>
        <a href="${pagePath('how-it-works')}" class="nav__link ${activeClass('how-it-works')}"${ariaCurrent('how-it-works')} data-i18n="nav.howItWorks">${translateText('nav.howItWorks')}</a>
        <a href="${pagePath('support')}" class="nav__link ${activeClass('support')}"${ariaCurrent('support')} data-i18n="nav.support">${translateText('nav.support')}</a>
        <a href="${pagePath('about')}" class="nav__link ${activeClass('about')}"${ariaCurrent('about')} data-i18n="nav.about">${translateText('nav.about')}</a>
      </div>

      <div class="nav__actions">
        <a href="${downloadUrl}" class="btn btn--primary btn--sm nav__download-btn"${isExternalDownload ? ' target="_blank" rel="noopener noreferrer"' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span data-i18n="nav.downloadApp">${translateText('nav.downloadApp')}</span>
        </a>
        ${_buildLangPicker()}
        <button class="theme-toggle" id="theme-toggle" aria-label="${translateText('nav.toggleTheme')}" data-i18n-aria-label="nav.toggleTheme">
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4.5"/>
            <line x1="12" y1="2"   x2="12" y2="4.5"/>
            <line x1="12" y1="19.5" x2="12" y2="22"/>
            <line x1="2"  y1="12"  x2="4.5" y2="12"/>
            <line x1="19.5" y1="12" x2="22" y2="12"/>
            <line x1="5.05" y1="5.05" x2="6.82" y2="6.82"/>
            <line x1="17.18" y1="17.18" x2="18.95" y2="18.95"/>
            <line x1="5.05" y1="18.95" x2="6.82" y2="17.18"/>
            <line x1="17.18" y1="6.82" x2="18.95" y2="5.05"/>
          </svg>
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
          </svg>
        </button>
        <button class="nav__hamburger" id="hamburger" aria-label="${translateText('nav.openMenu')}" aria-controls="mobile-menu" aria-expanded="false" data-i18n-aria-label="nav.openMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  `;

  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'nav__mobile';
  mobileMenu.id = 'mobile-menu';
  mobileMenu.setAttribute('role', 'dialog');
  mobileMenu.setAttribute('aria-modal', 'true');
  mobileMenu.setAttribute('aria-label', translateText('accessibility.mobileMenu'));
  mobileMenu.setAttribute('data-i18n-aria-label', 'accessibility.mobileMenu');

  mobileMenu.innerHTML = `
    <div class="nav__mobile-drawer">
      <div class="nav__mobile-glow" aria-hidden="true"></div>
      <div class="nav__mobile-wave-bg" aria-hidden="true">
        <img src="${base}assets/logo-mark.svg" alt="" width="320" height="320" loading="lazy">
      </div>
      <button class="nav__mobile-close" id="mobile-menu-close" aria-label="${translateText('nav.closeMenu')}" data-i18n-aria-label="nav.closeMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <nav class="nav__mobile-links" aria-label="${translateText('accessibility.mainNavigation')}" data-i18n-aria-label="accessibility.mainNavigation">
        <a href="${pagePath('destinations')}" class="nav__mobile-link${activeClass('destinations') ? ' nav__mobile-link--active' : ''}">
          <span class="nav__mobile-link-num" aria-hidden="true">01</span>
          <span class="nav__mobile-link-text" data-i18n="nav.destinations">${translateText('nav.destinations')}</span>
          <svg class="nav__mobile-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a href="${pagePath('how-it-works')}" class="nav__mobile-link${activeClass('how-it-works') ? ' nav__mobile-link--active' : ''}">
          <span class="nav__mobile-link-num" aria-hidden="true">02</span>
          <span class="nav__mobile-link-text" data-i18n="nav.howItWorks">${translateText('nav.howItWorks')}</span>
          <svg class="nav__mobile-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a href="${pagePath('support')}" class="nav__mobile-link${activeClass('support') ? ' nav__mobile-link--active' : ''}">
          <span class="nav__mobile-link-num" aria-hidden="true">03</span>
          <span class="nav__mobile-link-text" data-i18n="nav.support">${translateText('nav.support')}</span>
          <svg class="nav__mobile-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a href="${pagePath('about')}" class="nav__mobile-link${activeClass('about') ? ' nav__mobile-link--active' : ''}">
          <span class="nav__mobile-link-num" aria-hidden="true">04</span>
          <span class="nav__mobile-link-text" data-i18n="nav.about">${translateText('nav.about')}</span>
          <svg class="nav__mobile-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </nav>
      <div class="nav__mobile-download">
        <a href="${base}" class="btn btn--primary btn--block nav__mobile-cta-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span data-i18n="nav.downloadApp">${translateText('nav.downloadApp')}</span>
        </a>
      </div>
    </div>
  `;

  const existingNav = document.getElementById('navbar');
  if (existingNav) {
    existingNav.replaceWith(nav);
  } else {
    document.body.prepend(nav);
  }
  document.body.appendChild(mobileMenu);

  // Abort any previous document/window listeners from a prior injectNav() call
  // (SPA re-navigation) before wiring up new ones.
  if (window._navListenerController) window._navListenerController.abort();
  window._navListenerController = new AbortController();

  _initLangPicker(window._navListenerController.signal);
  initNavBehavior(window._navListenerController.signal);
}

function initNavBehavior(signal) {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeBtn = document.getElementById('theme-toggle');
  const scrollCoordinator = window.scrollCoordinator;

  /* ── Highlight download buttons ── */
  function highlightDownloadBtns() {
    const btns = document.querySelectorAll('.hero-dl-btn');
    if (!btns.length) return;
    btns.forEach(btn => {
      btn.classList.remove('hero-dl-btn--highlight');
      void btn.offsetWidth; // force reflow to restart animation
      btn.classList.add('hero-dl-btn--highlight');
      btn.addEventListener('animationend', () => btn.classList.remove('hero-dl-btn--highlight'), { once: true });
    });
  }

  /* Expose so the showcase scroll-complete callback in animations.js can call it */
  window.highlightDownloadBtns = highlightDownloadBtns;

  document.querySelectorAll('.nav__download-btn, .nav__mobile-download a').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // In SPA mode, check the router's active route instead of element presence.
      // (#download lives in the home section which is always in the DOM in SPA mode)
      const onHomePage = window.__SPA_MODE
        ? (window.currentRoute === 'home' || !window.currentRoute)
        : !!document.getElementById('download');
      if (onHomePage) {
        // Already on home page — no reload needed
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Highlight download buttons after scroll settles
        setTimeout(highlightDownloadBtns, 400);
      } else {
        // Navigate to home (SPA router will pick this up via click interception)
        // then highlight buttons once the page is rendered
        if (window.__SPA_MODE && typeof window.navigateTo === 'function') {
          e.preventDefault();
          window.navigateTo('/');
          try { sessionStorage.setItem('hl-download', '1'); } catch (_) {}
          setTimeout(highlightDownloadBtns, 700);
        } else {
          // On another page — navigate to root, flag highlight for next load
          try { sessionStorage.setItem('hl-download', '1'); } catch (_) {}
        }
      }
    });
  });

  // On load: if flagged from another page, highlight and clear the flag
  // (coming from another page means the user has already seen the features)
  try {
    if (sessionStorage.getItem('hl-download')) {
      sessionStorage.removeItem('hl-download');
      window.showcaseScrollComplete = true;
      setTimeout(highlightDownloadBtns, 350);
    }
  } catch (_) {}

  /* ── Scroll-lock ──
     Only the mobile menu uses a temporary scroll lock.
     Lock is class-based on body only — never touch html (WebKit scroll container). */
  let isScrollLocked = false;

  const lockScroll = () => {
    if (isScrollLocked) return;
    isScrollLocked = true;
    if (scrollCoordinator) {
      scrollCoordinator.setScrollLocked(true);
    } else {
      document.body.classList.add('nav-scroll-locked');
    }
  };

  const unlockScroll = () => {
    if (!isScrollLocked) return;
    isScrollLocked = false;
    if (scrollCoordinator) {
      scrollCoordinator.clearScrollLock();
    } else {
      document.body.classList.remove('nav-scroll-locked');
    }
    // No ScrollTrigger.refresh() here — it fires mid-scroll on some browsers
    // and causes scrub animations to stutter. GSAP manages its own state.
  };

  const closeMenu = () => {
    if (!hamburger || !mobileMenu) return;
    mobileMenu.classList.remove('nav__mobile--open');
    hamburger.classList.remove('nav__hamburger--open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.style.opacity = '';
    hamburger.style.pointerEvents = '';
    unlockScroll();
  };

  const onScroll = () => {
    navbar.classList.toggle('nav--scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();

  // bfcache / history restore: reset all menu + lock state.
  window.addEventListener('pageshow', () => {
    isScrollLocked = false;
    document.body.classList.remove('nav-scroll-locked');
    if (mobileMenu) mobileMenu.classList.remove('nav__mobile--open');
    if (hamburger) {
      hamburger.classList.remove('nav__hamburger--open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.style.opacity = '';
      hamburger.style.pointerEvents = '';
    }
  }, { signal });

  // Theme toggle
  if (themeBtn) {
    themeBtn.addEventListener('click', () => toggleTheme());
  }

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('nav__mobile--open');
      hamburger.classList.toggle('nav__hamburger--open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.style.opacity = isOpen ? '0' : '';
      hamburger.style.pointerEvents = isOpen ? 'none' : '';
      isOpen ? lockScroll() : unlockScroll();
    });

    const closeBtnInPanel = document.getElementById('mobile-menu-close');
    if (closeBtnInPanel) closeBtnInPanel.addEventListener('click', closeMenu);

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    mobileMenu.addEventListener('click', (event) => {
      if (event.target === mobileMenu) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();

      // Focus trap: keep Tab cycling within mobile menu when open
      if (event.key === 'Tab' && mobileMenu.classList.contains('nav__mobile--open')) {
        const focusable = mobileMenu.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) { event.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
    }, { signal });

    window.addEventListener('resize', () => {
      if (window.innerWidth > NAV_COLLAPSE_WIDTH) closeMenu();
    }, { passive: true, signal });
  }
}

function injectFooter() {
  const base = getBasePath();
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.setAttribute('role', 'contentinfo');

  footer.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="${base}" class="nav__logo" style="font-size:1.5rem;">
            ${brandMarkup(base)}
          </a>
          <p data-i18n="footer.tagline">${translateText('footer.tagline')}</p>
        </div>

        <div class="footer__col">
          <h4 data-i18n="footer.product">${translateText('footer.product')}</h4>
          <ul>
            <li><a href="${pagePath('destinations')}" data-i18n="nav.destinations">${translateText('nav.destinations')}</a></li>
            <li><a href="${pagePath('how-it-works')}" data-i18n="nav.howItWorks">${translateText('nav.howItWorks')}</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4 data-i18n="footer.company">${translateText('footer.company')}</h4>
          <ul>
            <li><a href="${pagePath('about')}" data-i18n="footer.aboutUs">${translateText('footer.aboutUs')}</a></li>
            <li><a href="${pagePath('support')}" data-i18n="nav.support">${translateText('nav.support')}</a></li>
            <li><a href="${pagePath('support')}#contact" data-i18n="footer.contact">${translateText('footer.contact')}</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4 data-i18n="footer.legal">${translateText('footer.legal')}</h4>
          <ul>
            <li><a href="${pagePath('privacy')}" data-i18n="footer.privacyPolicy">${translateText('footer.privacyPolicy')}</a></li>
            <li><a href="${pagePath('terms')}" data-i18n="footer.termsOfService">${translateText('footer.termsOfService')}</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copyright">&copy; ${CURRENT_YEAR} Simphonia. <span data-i18n="footer.copyright">${translateText('footer.copyright')}</span></p>
        <div class="footer__socials">
          <a href="https://instagram.com/simphonia.pt" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://x.com/simphonia" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://linkedin.com/company/simphonia" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(footer);
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    applyTheme,
    getBasePath,
    getDownloadUrl,
    getStoredTheme,
    initBackToTop: injectBackToTop,
    initTheme,
    injectBackToTop,
    injectCookieBanner,
    injectFooter,
    injectMobileCTA,
    injectNav,
    injectNoscript,
    injectScrollProgress,
    injectShell,
    pagePath,
    toggleTheme,
  });
}

