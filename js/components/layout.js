/**
 * Shared layout components — Shell, Nav & Footer
 * Injected via JS to keep all pages DRY.
 */

const CURRENT_YEAR = new Date().getFullYear();
const THEME_KEY = 'simphonia-theme';
const NAV_COLLAPSE_WIDTH = 960;

// ────────────────────────────────────────
// Shared scroll coordinator
// ────────────────────────────────────────

(function initScrollCoordinator() {
  if (typeof window === 'undefined' || window.scrollCoordinator) return;

  var refreshPending = false;
  var waitingForLoad = false;

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
    var rawHash = typeof hash === 'string' ? hash : window.location.hash;
    if (!rawHash) return null;

    var id = rawHash.charAt(0) === '#' ? rawHash.slice(1) : rawHash;
    if (!id) return null;

    var target = document.getElementById(decodeURIComponent(id));
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
  if (meta) meta.content = theme === 'light' ? '#FFF5F1' : '#121212';

  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
}

/** Toggle between light / dark. */
function toggleTheme() {
  // Enable smooth transition class
  document.body.classList.add('theme-transition');
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  // Remove transition class after animation completes
  setTimeout(() => document.body.classList.remove('theme-transition'), 400);
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

  // Skip link
  const skip = document.createElement('a');
  skip.href = '#main-content';
  skip.className = 'skip-link';
  skip.textContent = 'Skip to main content';
  frag.appendChild(skip);

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
  bar.setAttribute('aria-hidden', 'true'); // hidden until shown
  bar.innerHTML = `
    <a href="${base}destinations/" class="btn btn--primary">Browse Plans</a>
    <a href="${base}how-it-works/" class="btn btn--outline">How It Works</a>
  `;
  document.body.appendChild(bar);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const visible = window.scrollY > 500;
      bar.classList.toggle('mobile-cta-bar--visible', visible);
      bar.setAttribute('aria-hidden', String(!visible));
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Injects a back-to-top button that appears once the user scrolls 600px down.
 */
function injectBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', 'Scroll back to top');
  btn.setAttribute('aria-hidden', 'true');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 19V5"/>
      <path d="m5 12 7-7 7 7"/>
    </svg>
  `;
  document.body.appendChild(btn);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const visible = window.scrollY > 600;
      btn.classList.toggle('back-to-top--visible', visible);
      btn.setAttribute('aria-hidden', String(!visible));
      ticking = false;
    });
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.blur();
  });
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
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.setAttribute('aria-hidden', 'true');

  banner.innerHTML = `
    <div class="cookie-banner__content">
      <div class="cookie-banner__icon" aria-hidden="true">🍪</div>
      <p class="cookie-banner__text">
        We use cookies to improve your experience and analyse site traffic.
        By clicking <strong>Accept</strong>, you agree to our
        <a href="${base}privacy/">Privacy Policy</a>.
      </p>
      <div class="cookie-banner__actions">
        <button class="btn btn--ghost btn--sm" id="cookie-decline">Decline</button>
        <button class="btn btn--primary btn--sm" id="cookie-accept">Accept All</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  // Show with a small delay so it doesn't distract on page load
  const showTimer = setTimeout(() => {
    banner.classList.add('cookie-banner--visible');
    banner.setAttribute('aria-hidden', 'false');
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
  bar.setAttribute('aria-label', 'Page scroll progress');
  document.body.appendChild(bar);

  let ticking = false;
  const update = () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct  = docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0;
    bar.style.transform = `scaleX(${pct / 100})`;
    bar.setAttribute('aria-valuenow', Math.round(pct));
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
}

/**
 * Injects a dismissible announcement banner just below the nav.
 * Only shown on the homepage (root path).
 * Dismissed state is persisted in sessionStorage so it stays gone for the session.
 */
function injectAnnouncementBanner() {
  const BANNER_KEY = 'simphonia-banner-v1';
  try { if (sessionStorage.getItem(BANNER_KEY)) return; } catch (_) {}

  // Only show on homepage
  const path = window.location.pathname;
  const isHome = path === '/' || path === '/index.html' ||
    (!['destinations','how-it-works','about','support','privacy','terms']
      .some(p => path.includes('/' + p)));
  if (!isHome) return;

  const base = getBasePath();
  const banner = document.createElement('div');
  banner.className = 'announcement-banner';
  banner.id = 'announcement-banner';
  banner.setAttribute('role', 'banner');
  banner.innerHTML = `
    <div class="announcement-banner__inner">
      <span class="announcement-banner__icon" aria-hidden="true">🚀</span>
      <span class="announcement-banner__text">
        Simphonia is launching soon — <a href="${base}destinations/" class="announcement-banner__link">browse plans early</a> and be first in line.
      </span>
      <button class="announcement-banner__close" id="announcement-close" aria-label="Dismiss announcement">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `;
  // Insert after nav (which will be prepended), so insert at body start for now;
  // layout.js injects nav first via prepend, then footer append.
  // We'll insert the banner as first child of body after nav is set.
  document.body.appendChild(banner);

  document.getElementById('announcement-close')?.addEventListener('click', () => {
    try { sessionStorage.setItem(BANNER_KEY, '1'); } catch (_) {}
    banner.classList.add('announcement-banner--closing');
    setTimeout(() => banner.remove(), 350);
  });
}

/**
 * Injects the shared <noscript> fallback styles at the end of <body>.
 */
function injectNoscript() {
  const ns = document.createElement('noscript');
  const style = document.createElement('style');
  style.textContent =
    '.reveal,.reveal--left,.reveal--right,.reveal--scale{opacity:1;visibility:visible;transform:none}' +
    '#globe-container,#stars-canvas,.cursor{display:none}' +
    '.mobile-cta-bar,.back-to-top,.cookie-banner{display:none}' +
    '.footer__brand,.footer__col,.footer__bottom{opacity:1;visibility:visible;transform:none}';
  ns.appendChild(style);
  document.body.appendChild(ns);
}

/**
 * Returns the path prefix to reach the site root.
 * Root (/ or /index.html) → './'
 * Any inner page (/about/, /destinations/, etc.) → '../'
 *
 * Works for:  file:// protocol, localhost, any deployed host,
 *             and paths like /subfolder/simphonia-website/about/
 */
function getBasePath() {
  const path = window.location.pathname;

  // If the current HTML file is the root index.html we return './'
  // For inner pages (/about/index.html) we return '../'

  // Strategy: the root index.html's path either ends with /index.html directly
  // inside the project folder, or is just '/'.  Inner pages always have one
  // extra directory segment (e.g. /about/ or /about/index.html).

  // Quick checks for common cases
  if (path === '/' || path === '/index.html') return './';

  // Detect if we're inside one of the known page directories
  const pagePattern = /\/(destinations|how-it-works|support|about|privacy|terms)(\/|\/index\.html)?$/;
  if (pagePattern.test(path)) return '../';

  // Fallback: if path ends with /index.html or just /, count depth
  // by checking if the second-to-last segment is a known page slug
  const segments = path.replace(/\/index\.html$/, '').replace(/\/$/, '').split('/');
  const last = segments[segments.length - 1];
  const knownPages = ['destinations', 'how-it-works', 'support', 'about', 'privacy', 'terms'];
  if (knownPages.includes(last)) return '../';

  // Default: assume we're at root level
  return './';
}

/**
 * Returns the prefix to link to a sibling page slug.
 * From root → './slug/'   From inner page → '../slug/'
 */
function pagePath(slug) {
  return getBasePath() + slug + '/';
}

function brandMarkup(base) {
  const markSrc = base + 'assets/logo-mark.svg';
  return `
    <span class="nav__logo-icon" aria-hidden="true">
      <img src="${markSrc}" class="nav__logo-icon-image" alt="" width="40" height="40">
    </span>
    <span class="nav__logo-wordmark">Simphonia</span>
  `;
}

/**
 * Returns 'nav__link--active' if the slug matches the current page path.
 */
function activeClass(slug) {
  const path = window.location.pathname;
  if (slug === '') {
    // Home: path is root, or ends with index.html at the root level
    const segments = path.replace(/\/index\.html$/, '').replace(/\/$/, '').split('/');
    const last = segments[segments.length - 1];
    const knownPages = ['destinations', 'how-it-works', 'support', 'about', 'privacy', 'terms'];
    return knownPages.includes(last) ? '' : 'nav__link--active';
  }
  return path.includes('/' + slug) ? 'nav__link--active' : '';
}

function injectNav() {
  const base = getBasePath();
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.id = 'navbar';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = `
    <div class="nav__inner">
      <a href="${base}" class="nav__logo" aria-label="Simphonia Home">
        ${brandMarkup(base)}
      </a>

      <div class="nav__links">
        <a href="${pagePath('destinations')}" class="nav__link ${activeClass('destinations')}">Destinations</a>
        <a href="${pagePath('how-it-works')}" class="nav__link ${activeClass('how-it-works')}">How It Works</a>
        <a href="${pagePath('support')}" class="nav__link ${activeClass('support')}">Support</a>
        <a href="${pagePath('about')}" class="nav__link ${activeClass('about')}">About</a>
      </div>

      <div class="nav__actions">
        <a href="${base}" class="btn btn--primary btn--sm nav__download-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download App
        </a>
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle light/dark mode">
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
        <button class="nav__hamburger" id="hamburger" aria-label="Toggle menu" aria-controls="mobile-menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  `;

  /* ── Mobile menu overlay ──
     Created as a DIRECT child of <body> (NOT inside .nav) so that
     .nav--scrolled's backdrop-filter cannot create a new containing
     block that traps position:fixed descendants.  This guarantees
     the overlay always covers the full viewport regardless of
     scroll position. */
  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'nav__mobile';
  mobileMenu.id = 'mobile-menu';
  mobileMenu.setAttribute('role', 'dialog');
  mobileMenu.setAttribute('aria-modal', 'true');
  mobileMenu.setAttribute('aria-label', 'Mobile menu');

  mobileMenu.innerHTML = `
    <div class="nav__mobile-drawer">

      <div class="nav__mobile-header">
        <a href="${base}" class="nav__logo nav__mobile-logo" aria-label="Simphonia Home" tabindex="-1">
          ${brandMarkup(base)}
        </a>
        <button class="nav__mobile-close" id="mobile-menu-close" aria-label="Close menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <nav class="nav__mobile-links" aria-label="Site pages">
        <a href="${pagePath('destinations')}" class="nav__mobile-link${activeClass('destinations') ? ' nav__mobile-link--active' : ''}">Destinations</a>
        <a href="${pagePath('how-it-works')}" class="nav__mobile-link${activeClass('how-it-works') ? ' nav__mobile-link--active' : ''}">How It Works</a>
        <a href="${pagePath('support')}" class="nav__mobile-link${activeClass('support') ? ' nav__mobile-link--active' : ''}">Support</a>
        <a href="${pagePath('about')}" class="nav__mobile-link${activeClass('about') ? ' nav__mobile-link--active' : ''}">About</a>
      </nav>

      <div class="nav__mobile-download">
        <a href="${base}" class="btn btn--primary btn--block">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download App
        </a>
      </div>


    </div>
  `;

  document.body.prepend(nav);
  // Append mobile menu as a sibling of nav, direct child of body
  document.body.appendChild(mobileMenu);
  initNavBehavior();
}

function initNavBehavior() {
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
      const onHomePage = !!document.getElementById('download');
      if (onHomePage) {
        // Already on home page — no reload needed
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Highlight after scroll settles — only if showcase was already completed
        if (window.showcaseScrollComplete) {
          setTimeout(highlightDownloadBtns, 400);
        }
      } else {
        // On another page — navigate to root, flag highlight for next load
        try { sessionStorage.setItem('hl-download', '1'); } catch (_) {}
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
  window.addEventListener('scroll', onScroll, { passive: true });
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
  });

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
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > NAV_COLLAPSE_WIDTH) closeMenu();
    }, { passive: true });
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
          <p>Stay connected, wherever you go. Global eSIM coverage for modern travelers.</p>
        </div>

        <div class="footer__col">
          <h4>Product</h4>
          <ul>
            <li><a href="${pagePath('destinations')}">Destinations</a></li>
            <li><a href="${pagePath('how-it-works')}">How It Works</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>Company</h4>
          <ul>
            <li><a href="${pagePath('about')}">About Us</a></li>
            <li><a href="${pagePath('support')}">Support</a></li>
            <li><a href="${pagePath('support')}#contact">Contact</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>Legal</h4>
          <ul>
            <li><a href="${pagePath('privacy')}">Privacy Policy</a></li>
            <li><a href="${pagePath('terms')}">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copyright">&copy; ${CURRENT_YEAR} Simphonia. All rights reserved.</p>
        <div class="footer__socials">
          <a href="#" aria-label="Instagram">
            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="#" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(footer);
}


