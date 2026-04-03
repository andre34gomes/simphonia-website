/**
 * Simphonia — SPA Router
 *
 * Lightweight History API router for the single-page application.
 * Handles navigation between page sections, title updates, nav
 * active states, scroll position, and lazy initialisation of
 * page-specific modules (destinations, support, etc.).
 *
 * @see main.js — calls initRouter() after bootstrap
 */

'use strict';

(function () {
  /* ── Route definitions ─────────────────────────────────────── */
  // Trailing-slash variants are intentionally omitted — resolveRoute()
  // normalises any path before lookup, so a single entry per route suffices.
  var ROUTES = {
    '/':             { page: 'home',         titleKey: 'page.titles.home',         descriptionKey: 'page.descriptions.home' },
    '/destinations': { page: 'destinations', titleKey: 'page.titles.destinations', descriptionKey: 'page.descriptions.destinations' },
    '/how-it-works': { page: 'how-it-works', titleKey: 'page.titles.howItWorks',   descriptionKey: 'page.descriptions.howItWorks' },
    '/support':      { page: 'support',      titleKey: 'page.titles.support',      descriptionKey: 'page.descriptions.support' },
    '/about':        { page: 'about',        titleKey: 'page.titles.about',        descriptionKey: 'page.descriptions.about' },
    '/privacy':      { page: 'privacy',      titleKey: 'page.titles.privacy',      descriptionKey: 'page.descriptions.privacy' },
    '/terms':        { page: 'terms',        titleKey: 'page.titles.terms',        descriptionKey: 'page.descriptions.terms' },
  };

  /* Page slug → HTML partial path */
  var PAGE_PARTIALS = {
    'home':         '/pages/home.html',
    'destinations': '/pages/destinations.html',
    'how-it-works': '/pages/how-it-works.html',
    'support':      '/pages/support.html',
    'about':        '/pages/about.html',
    'privacy':      '/pages/privacy.html',
    'terms':        '/pages/terms.html',
  };

  /* Nav link mapping: page name → nav href for active state */
  var NAV_LINKS = {
    'home':         '/',
    'destinations': '/destinations/',
    'how-it-works': '/how-it-works/',
    'support':      '/support/',
    'about':        '/about/',
  };

  /* ── State ─────────────────────────────────────────────────── */
  var currentPage = null;
  var _pageInitialized = {}; // tracks which page-specific inits have run
  var _pageLoadPromises = {}; // inflight fetch promises keyed by pageName

  /* ── Helpers ───────────────────────────────────────────────── */
  function resolveRoute(path) {
    // Strip hash fragment first, then trailing slashes (except root)
    var clean = path.split('#')[0];
    var normalized = clean === '/' ? '/' : clean.replace(/\/+$/, '');
    return ROUTES[normalized] || null;
  }

  function getAllPages() {
    return document.querySelectorAll('[data-page]');
  }

  function translateText(key) {
    if (typeof window.t !== 'function') return '';
    var value = window.t(key);
    return typeof value === 'string' ? value : '';
  }

  function updateSeo(route) {
    if (!route) return;
    var title = translateText(route.titleKey);
    var description = translateText(route.descriptionKey);

    if (title) {
      document.title = title;
    }

    [
      'meta-description',
      'og-title',
      'twitter-title',
      'og-description',
      'twitter-description'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var next = /title/.test(id) ? title : description;
      if (next) el.setAttribute('content', next);
    });
  }

  function setActiveNav(pageName) {
    var navHref = NAV_LINKS[pageName] || null;
    document.querySelectorAll('.nav__link').forEach(function (link) {
      var href = link.getAttribute('href');
      var isActive = href === navHref;
      link.classList.toggle('nav__link--active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    // Also update mobile menu links if present
    document.querySelectorAll('.mobile-nav__link').forEach(function (link) {
      var href = link.getAttribute('href');
      var isActive = href === navHref;
      link.classList.toggle('mobile-nav__link--active', isActive);
    });
  }

  /* ── Page partial loader ───────────────────────────────────── */
  /**
   * Ensures the HTML for `pageName` is in the DOM.
   * First call fetches /pages/{pageName}.html and appends it to <main>.
   * Subsequent calls for the same page return immediately.
   * @returns {Promise<void>}
   */
  function ensurePageLoaded(pageName) {
    // Already injected?
    if (document.querySelector('[data-page="' + pageName + '"]')) {
      return Promise.resolve();
    }
    // Inflight?
    if (_pageLoadPromises[pageName]) {
      return _pageLoadPromises[pageName];
    }

    var url = PAGE_PARTIALS[pageName];
    if (!url) return Promise.resolve();

    _pageLoadPromises[pageName] = (function () {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, 8000);

      return fetch(url, { credentials: 'same-origin', signal: controller.signal })
        .then(function (res) {
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error('Page fetch failed (' + res.status + '): ' + url);
          return res.text();
        })
        .then(function (html) {
        var main = document.getElementById('main-content');
        if (main) {
          var tmp = document.createElement('div');
          tmp.innerHTML = html;
          while (tmp.firstChild) {
            main.appendChild(tmp.firstChild);
          }
          if (typeof window.applyTranslations === 'function') {
            window.applyTranslations();
          }
        }
        delete _pageLoadPromises[pageName];
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        console.error('[router] Failed to load page partial:', err);
        delete _pageLoadPromises[pageName];
        throw err;
      });
    })();

    return _pageLoadPromises[pageName];
  }

  /* ── Lazy page initialisers ────────────────────────────────── */
  function initPage(pageName) {
    if (_pageInitialized[pageName]) return;
    _pageInitialized[pageName] = true;

    switch (pageName) {
      case 'home':
        // Populate showcase templates (hero bg, status bars, nav bars)
        if (typeof window.populateShowcaseTemplates === 'function') {
          window.populateShowcaseTemplates();
        }
        // Initialise destinations marquee
        if (typeof window.initDestinationsMarquee === 'function') {
          window.initDestinationsMarquee();
        }
        // Hero typing effect — start after hero entrance animation completes
        if (typeof window.initHeroTyping === 'function') {
          setTimeout(window.initHeroTyping, 1200);
        }
        break;
      case 'destinations':
        if (typeof window.initDestinationsPage === 'function') {
          window.initDestinationsPage();
        }
        break;
      case 'support':
        if (typeof window.initSupportPage === 'function') {
          window.initSupportPage();
        }
        break;
      case 'privacy':
      case 'terms':
        // Legal TOC handled by initAnimations → main.js initLegalToc()
        break;
    }
  }

  /* ── Core navigation ───────────────────────────────────────── */
  function navigateTo(path, pushState) {
    if (pushState === undefined) pushState = true;

    var route = resolveRoute(path);
    if (!route) {
      // Unknown route — show home
      route = ROUTES['/'];
      path = '/';
    }

    var pageName = route.page;

    // Already on this page
    if (pageName === currentPage) return;

    // Update URL and title eagerly (better perceived performance)
    var resolvedTitle = translateText(route.titleKey);
    updateSeo(route);
    if (pushState && window.location.pathname !== path) {
      history.pushState({ page: pageName }, resolvedTitle, path);
    }

    // Kill all existing ScrollTrigger instances and reset animations
    if (typeof window.resetAnimations === 'function') {
      window.resetAnimations();
    }

    ensurePageLoaded(pageName)
      .then(function () {
        // Hide all pages
        getAllPages().forEach(function (el) {
          el.style.display = 'none';
        });

        // Show the target page
        var target = document.querySelector('[data-page="' + pageName + '"]');
        if (target) {
          target.style.display = 'block';
        }

        // Update state
        currentPage = pageName;
        window.currentRoute = pageName;

        // Update nav active state
        setActiveNav(pageName);

        // Scroll to top
        window.scrollTo(0, 0);

        // Lazy-init page-specific functionality
        initPage(pageName);

        // Re-run GSAP animations scoped to the new active page
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (typeof initAnimations === 'function') {
              initAnimations();
            }
            // Legal TOC needs re-init on privacy/terms navigation
            if ((pageName === 'privacy' || pageName === 'terms') && typeof initLegalToc === 'function') {
              initLegalToc();
            }
          });
        });

        // Dispatch custom event for other modules to react
        document.dispatchEvent(new CustomEvent('simphonia:navigate', {
          detail: { page: pageName, path: path }
        }));
      })
      .catch(function (err) {
        console.error('[router] Navigation failed for', pageName, err);
        // Fall back to home if loading another page failed
        if (pageName !== 'home') {
          currentPage = null; // reset guard so navigateTo home doesn't no-op
          navigateTo('/', false);
        }
      });
  }

  /* ── Link interception ─────────────────────────────────────── */
  function handleClick(e) {
    // Only handle left clicks without modifier keys
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    // Skip external links, mailto, tel, anchors, etc.
    if (href.startsWith('http') || href.startsWith('//') ||
        href.startsWith('mailto:') || href.startsWith('tel:') ||
        href.startsWith('#') || link.hasAttribute('target') ||
        link.hasAttribute('download')) {
      return;
    }

    // All internal links use absolute paths — resolve directly
    var resolved = href;

    // Check if this is a known route
    var route = resolveRoute(resolved);
    if (!route) return;

    // Prevent default and navigate via SPA
    e.preventDefault();
    navigateTo(resolved);

    // Close mobile menu if open
    var hamburger = document.querySelector('.nav__hamburger[aria-expanded="true"]');
    if (hamburger) hamburger.click();
  }

  /* ── Link prefetch on hover ──────────────────────────────── */
  // Prefetch the page partial when the user hovers a nav link so the
  // subsequent click navigates instantly from cache.
  var _prefetched = {};

  function handlePrefetch(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;

    var route = resolveRoute(href);
    if (!route) return;

    var pageName = route.page;
    // Already loaded or prefetched
    if (_prefetched[pageName]) return;
    if (document.querySelector('[data-page="' + pageName + '"]')) return;

    var url = PAGE_PARTIALS[pageName];
    if (!url) return;

    _prefetched[pageName] = true;
    // Use low-priority fetch to avoid competing with user-initiated requests
    var link_el = document.createElement('link');
    link_el.rel = 'prefetch';
    link_el.as = 'fetch';
    link_el.href = url;
    document.head.appendChild(link_el);
  }

  /* ── Popstate (back/forward) ───────────────────────────────── */
  function handlePopState() {
    navigateTo(window.location.pathname, false);
  }

  /* ── Public: initRouter() ──────────────────────────────────── */
  function initRouter() {
    // Intercept all internal link clicks
    document.addEventListener('click', handleClick);

    // Prefetch page partials on hover for near-instant navigation
    document.addEventListener('pointerover', handlePrefetch, { passive: true });

    // Handle back/forward navigation
    window.addEventListener('popstate', handlePopState);

    // Keep document.title translated when language changes
    document.addEventListener('simphonia:langchange', function () {
      if (!currentPage) return;
      var currentPath = window.location.pathname.split('#')[0].replace(/\/+$/, '') || '/';
      var route = ROUTES[currentPath] || ROUTES['/'];
      updateSeo(route);
    });

    // Navigate to the current URL (initial page load)
    var initialPath = window.location.pathname || '/';
    navigateTo(initialPath, false);
  }

  // Expose
  window.initRouter = initRouter;
  window.navigateTo = navigateTo;
}());

