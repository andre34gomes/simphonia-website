/**
 * Shared layout components — Shell, Nav & Footer
 * Injected via JS to keep all pages DRY.
 */

const CURRENT_YEAR = new Date().getFullYear();
const THEME_KEY = 'simphonia-theme';
const NAV_COLLAPSE_WIDTH = 960;

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
 * Injects the shared <noscript> fallback styles at the end of <body>.
 */
function injectNoscript() {
  const ns = document.createElement('noscript');
  const style = document.createElement('style');
  style.textContent =
    '.reveal,.reveal--left,.reveal--right,.reveal--scale{opacity:1;transform:none}' +
    '#globe-container,#stars-canvas,.cursor{display:none}' +
    '.mobile-cta-bar{display:none}';
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
  const pagePattern = /\/(destinations|how-it-works|support|about|compatibility|privacy|terms)(\/|\/index\.html)?$/;
  if (pagePattern.test(path)) return '../';

  // Fallback: if path ends with /index.html or just /, count depth
  // by checking if the second-to-last segment is a known page slug
  const segments = path.replace(/\/index\.html$/, '').replace(/\/$/, '').split('/');
  const last = segments[segments.length - 1];
  const knownPages = ['destinations', 'how-it-works', 'support', 'about', 'compatibility', 'privacy', 'terms'];
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
    const knownPages = ['destinations', 'how-it-works', 'support', 'about', 'compatibility', 'privacy', 'terms'];
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
        <a href="${pagePath('compatibility')}" class="nav__link ${activeClass('compatibility')}">Compatibility</a>
        <a href="${pagePath('support')}" class="nav__link ${activeClass('support')}">Support</a>
        <a href="${pagePath('about')}" class="nav__link ${activeClass('about')}">About</a>
      </div>

      <div class="nav__actions">
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
        <a href="${pagePath('compatibility')}" class="nav__mobile-link${activeClass('compatibility') ? ' nav__mobile-link--active' : ''}">Compatibility</a>
        <a href="${pagePath('support')}" class="nav__mobile-link${activeClass('support') ? ' nav__mobile-link--active' : ''}">Support</a>
        <a href="${pagePath('about')}" class="nav__mobile-link${activeClass('about') ? ' nav__mobile-link--active' : ''}">About</a>
      </nav>


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

  /* ── Scroll-lock ──
     Uses position:fixed on <body> so that iOS Safari (which ignores
     overflow:hidden on <html>) also stops scrolling.  The current
     scrollY is saved and applied as a negative top offset so the
     visible page doesn't jump.  On unlock we restore scroll. */
  let savedScrollY = 0;
  let isScrollLocked = false;

  const lockScroll = () => {
    if (isScrollLocked) return;
    isScrollLocked = true;
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  };

  const unlockScroll = () => {
    if (!isScrollLocked) return;
    isScrollLocked = false;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    // Use 'instant' to override CSS scroll-behavior:smooth on <html>,
    // otherwise the browser animates from 0 → savedScrollY and
    // GSAP ScrollTrigger re-fires animations along the way.
    window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
    // Recalculate GSAP ScrollTrigger positions after body layout change
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
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

  // Scroll effect — skip while scroll-locked because window.scrollY
  // reads as 0 when body is position:fixed, which would wrongly
  // remove the nav background.
  const onScroll = () => {
    if (isScrollLocked) return;
    navbar.classList.toggle('nav--scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
            <li><a href="${pagePath('compatibility')}">Compatibility</a></li>
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

