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
  /** Timeout (ms) for fetching page partials via the router. */
  const PAGE_FETCH_TIMEOUT_MS = 8000;

  // Trailing-slash variants are intentionally omitted — resolveRoute()
  // normalises any path before lookup, so a single entry per route suffices.
  const ROUTES = {
    '/':             { page: 'home',         titleKey: 'page.titles.home',         descriptionKey: 'page.descriptions.home' },
    '/destinations': { page: 'destinations', titleKey: 'page.titles.destinations', descriptionKey: 'page.descriptions.destinations' },
    '/how-it-works': { page: 'how-it-works', titleKey: 'page.titles.howItWorks',   descriptionKey: 'page.descriptions.howItWorks' },
    '/support':      { page: 'support',      titleKey: 'page.titles.support',      descriptionKey: 'page.descriptions.support' },
    '/about':        { page: 'about',        titleKey: 'page.titles.about',        descriptionKey: 'page.descriptions.about' },
    '/privacy':      { page: 'privacy',      titleKey: 'page.titles.privacy',      descriptionKey: 'page.descriptions.privacy' },
    '/terms':        { page: 'terms',        titleKey: 'page.titles.terms',        descriptionKey: 'page.descriptions.terms' },
    '/join':            { page: 'join',            titleKey: 'page.titles.join',           descriptionKey: 'page.descriptions.join', robots: 'noindex, follow' },
    '/verify-email':    { page: 'verify-email',    titleKey: 'page.titles.verifyEmail',    descriptionKey: 'page.descriptions.verifyEmail', robots: 'noindex, nofollow' },
    '/reset-password':  { page: 'reset-password',  titleKey: 'page.titles.resetPassword',  descriptionKey: 'page.descriptions.resetPassword', robots: 'noindex, nofollow' },
    '/open-in-app':     { page: 'open-in-app',     titleKey: 'page.titles.openInApp',      descriptionKey: 'page.descriptions.openInApp', robots: 'noindex, nofollow' },
  };

  const NOT_FOUND_ROUTE = {
    page: 'not-found',
    titleKey: 'page.titles.notFound',
    descriptionKey: 'page.descriptions.notFound',
    robots: 'noindex, follow'
  };

  /* Page slug → candidate HTML partial paths (derived from ROUTES) */
  const PAGE_PARTIALS = {};
  Object.keys(ROUTES).forEach(function (path) {
    const page = ROUTES[path].page;
    PAGE_PARTIALS[page] = ['/pages/' + page, '/pages/' + page + '.html'];
  });
  PAGE_PARTIALS['not-found'] = ['/pages/not-found', '/pages/not-found.html'];

  /* Nav link mapping: page name → nav href for active state */
  const NAV_LINKS = {
    'home':         '/',
    'destinations': '/destinations/',
    'how-it-works': '/how-it-works/',
    'support':      '/support/',
    'about':        '/about/',
  };

  /* ── State ─────────────────────────────────────────────────── */
  let currentPage = null;
  let currentPath = null;
  let _pageInitialized = {}; // tracks which page-specific inits have run
  const _pageLoadPromises = {}; // inflight fetch promises keyed by pageName

  /* ── Helpers ───────────────────────────────────────────────── */
  function resolveRoute(path) {
    // Strip query/hash fragments first, then trailing slashes (except root)
    const clean = path.split('#')[0].split('?')[0] || '/';
    const normalized = clean === '/' ? '/' : clean.replace(/\/+$/, '');
    return ROUTES[normalized] || null;
  }

  function normalizePath(path) {
    const clean = (path || '/').split('#')[0].split('?')[0] || '/';
    // Strip trailing slashes (except root) — mirrors resolveRoute()
    return clean === '/' ? '/' : clean.replace(/\/+$/, '');
  }

  function getAllPages() {
    return document.querySelectorAll('[data-page]');
  }

  function translateText(key) {
    if (typeof window.t !== 'function') return '';
    const value = window.t(key);
    return typeof value === 'string' ? value : '';
  }

  /**
   * Announces a route change to assistive technology via an aria-live region.
   * Creates the live region on first use (hidden, polite).
   */
  function announceRouteChange(pageTitle) {
    let liveRegion = document.getElementById('route-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'route-announcer';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
      document.body.appendChild(liveRegion);
    }
    // Clear then set to ensure the announcement fires even if text is similar
    liveRegion.textContent = '';
    setTimeout(function () {
      const navigatedTo = translateText('aria.navigatedTo');
      liveRegion.textContent = pageTitle
        ? (navigatedTo || 'Navigated to') + ' ' + pageTitle
        : translateText('aria.pageChanged') || 'Page changed';
    }, 100);
  }

  function getPagePartialCandidates(pageName) {
    const entry = PAGE_PARTIALS[pageName];
    if (!entry) return [];
    return Array.isArray(entry) ? entry.slice() : [entry];
  }

  function fetchPagePartial(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, PAGE_FETCH_TIMEOUT_MS);

    return fetch(url, { credentials: 'same-origin', signal: controller.signal })
      .then(function (res) {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Page fetch failed (' + res.status + '): ' + url);
        return res.text();
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        throw err;
      });
  }

  function normalizePagePartialHtml(pageName, html) {
    if (typeof html !== 'string') return '';

    const trimmed = html.trim();
    const looksLikeFullDocument = /<!doctype|<html\b|<head\b|<body\b/i.test(trimmed);
    if (!looksLikeFullDocument) return html;

    if (typeof DOMParser !== 'function') {
      const pageMatch = trimmed.match(new RegExp('<[^>]+data-page=["\']' + pageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\'][^>]*>[\\s\\S]*<\\/[^>]+>\s*$', 'i'));
      if (pageMatch) return pageMatch[0];
      throw new Error('Full HTML document returned for page partial: ' + pageName);
    }

    const doc = new DOMParser().parseFromString(trimmed, 'text/html');
    const pageRoot = doc.querySelector('[data-page="' + pageName + '"]') || doc.querySelector('[data-page]');
    if (pageRoot) {
      return pageRoot.outerHTML;
    }

    throw new Error('Full HTML document returned without page fragment: ' + pageName);
  }

  function loadPagePartial(pageName, urls, index) {
    index = index || 0;
    const url = urls[index];
    if (!url) {
      return Promise.reject(new Error('No page partial URL configured for: ' + pageName));
    }

    return fetchPagePartial(url)
      .then(function (html) {
        return normalizePagePartialHtml(pageName, html);
      })
      .catch(function (err) {
        if (index + 1 >= urls.length) throw err;
        return loadPagePartial(pageName, urls, index + 1);
      });
  }

  function updateSeo(route, path) {
    if (!route) return;
    const title = translateText(route.titleKey);
    const description = translateText(route.descriptionKey);
    const normalizedPath = normalizePath(path || window.location.pathname);
    const canonicalUrl = window.location.origin + normalizedPath;

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
      const el = document.getElementById(id);
      if (!el) return;
      const next = /title/.test(id) ? title : description;
      if (next) el.setAttribute('content', next);
    });

    const robots = document.getElementById('meta-robots');
    if (robots) {
      robots.setAttribute('content', route.robots || 'index, follow');
    }

    const canonical = document.getElementById('canonical-url');
    if (canonical) {
      canonical.setAttribute('href', canonicalUrl);
    }

    const ogUrl = document.getElementById('og-url');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }
  }

  function setActiveNav(pageName) {
    const navHref = NAV_LINKS[pageName] || null;
    document.querySelectorAll('.nav__link').forEach(function (link) {
      const href = link.getAttribute('href');
      const isActive = href === navHref;
      link.classList.toggle('nav__link--active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    // Also update mobile menu links if present
    document.querySelectorAll('.mobile-nav__link').forEach(function (link) {
      const href = link.getAttribute('href');
      const isActive = href === navHref;
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

    const urls = getPagePartialCandidates(pageName);
    if (!urls.length) return Promise.resolve();

    _pageLoadPromises[pageName] = (function () {
      return loadPagePartial(pageName, urls)
        .then(function (html) {
        const main = document.getElementById('main-content');
        if (main) {
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          // Strip script elements — page behaviour is wired via the module
          // system and router hooks, not via inline scripts in HTML partials.
          tmp.querySelectorAll('script').forEach(function (el) { el.remove(); });
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
        console.error('[router] Failed to load page partial:', err);
        delete _pageLoadPromises[pageName];
        throw err;
      });
    })();

    return _pageLoadPromises[pageName];
  }

  function cleanupLegalToc() {
    if (typeof window.__simphoniaLegalTocCleanup === 'function') {
      window.__simphoniaLegalTocCleanup();
      window.__simphoniaLegalTocCleanup = null;
    }
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
      case 'not-found':
        if (typeof window.initNotFoundPage === 'function') {
          window.initNotFoundPage();
        }
        break;
    }
  }

  /* ── Core navigation ───────────────────────────────────────── */
  function navigateTo(path, pushState) {
    if (pushState === undefined) pushState = true;

    path = normalizePath(path);
    let route = resolveRoute(path);
    if (!route) {
      // Unknown route — keep the requested URL and show the SPA 404 page
      route = NOT_FOUND_ROUTE;
    }

    const pageName = route.page;

    // Already on this page/path
    if (pageName === currentPage && path === currentPath) return;

    // Update URL and title eagerly (better perceived performance)
    const resolvedTitle = translateText(route.titleKey);
    updateSeo(route, path);
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
        const target = document.querySelector('[data-page="' + pageName + '"]');
        if (target) {
          target.style.display = 'block';
        }

        if (pageName !== 'privacy' && pageName !== 'terms') {
          cleanupLegalToc();
        }

        // Update state
        currentPage = pageName;
        currentPath = path;
        window.currentRoute = pageName;

        // Update nav active state
        setActiveNav(pageName);

        // Accessibility: move focus to main content for screen readers
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
        announceRouteChange(resolvedTitle || pageName);

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
              cleanupLegalToc();
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
        if (pageName === 'not-found') {
          window.location.replace('/404.html');
          return;
        }
        // Fall back to home if loading another page failed
        if (pageName !== 'home') {
          currentPage = null; // reset guard so navigateTo home doesn't no-op
          currentPath = null;
          navigateTo('/', false);
        }
      });
  }

  /* ── Link interception ─────────────────────────────────────── */
  function handleClick(e) {
    // Only handle left clicks without modifier keys
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip external links, mailto, tel, anchors, etc.
    if (href.startsWith('http') || href.startsWith('//') ||
        href.startsWith('mailto:') || href.startsWith('tel:') ||
        href.startsWith('#') || link.hasAttribute('target') ||
        link.hasAttribute('download')) {
      return;
    }

    // All internal links use absolute paths — resolve directly
    const resolved = href;

    // Prevent default and navigate via SPA — navigateTo handles unknown
    // routes by showing the SPA 404 page, avoiding a full page reload.
    e.preventDefault();
    navigateTo(resolved);

    // Close mobile menu if open
    const hamburger = document.querySelector('.nav__hamburger[aria-expanded="true"]');
    if (hamburger) hamburger.click();
  }


  /* ── Popstate (back/forward) ───────────────────────────────── */
  function handlePopState() {
    navigateTo(window.location.pathname, false);
  }

  /* ── Public: initRouter() ──────────────────────────────────── */
  function initRouter() {
    // Intercept all internal link clicks
    document.addEventListener('click', handleClick);

    // Prefetch is handled by nav-prefetch.js — no duplicate listener needed here.

    // Handle back/forward navigation
    window.addEventListener('popstate', handlePopState);

    // Keep document.title translated when language changes
    document.addEventListener('simphonia:langchange', function () {
      // Reset page-init flags for data-dependent pages so they re-fetch
      // in the new language. UI-only inits (showcase templates) are excluded
      // to avoid redundant DOM work.
      const dataPages = ['destinations', 'support', 'not-found'];
      dataPages.forEach(function (p) { delete _pageInitialized[p]; });
      // Home marquee handles langchange internally via its own listener
      if (!currentPage) return;
      const langPath = window.location.pathname.split('#')[0].replace(/\/+$/, '') || '/';
      const route = resolveRoute(langPath) || NOT_FOUND_ROUTE;
      updateSeo(route, langPath);
      // Re-init the current page with the new language
      initPage(currentPage);
    });

    // Navigate to the current URL (initial page load)
    const initialPath = window.location.pathname || '/';
    navigateTo(initialPath, false);
  }

  // Expose
  window.initRouter = initRouter;
  window.navigateTo = navigateTo;
  window.__simphoniaRoutes = ROUTES;
}());

