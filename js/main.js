/**
 * Simphonia Website — Main Entry Point
 *
 * Loaded as <script defer>. By the time this executes, the DOM is fully
 * parsed AND all prior <script defer> (CDN libs + layout.js + animations.js)
 * have already run.
 */

const LAYOUT_ASSET_VERSION = '20260402';
const REQUIRED_LAYOUT_APIS = [
  'initTheme',
  'injectShell',
  'injectNav',
  'injectFooter',
  'injectNoscript',
  'injectScrollProgress',
  'injectMobileCTA',
  'injectBackToTop',
  'injectCookieBanner',
];

function hasLayoutBootstrap() {
  return REQUIRED_LAYOUT_APIS.every(function (name) {
    return typeof window[name] === 'function';
  });
}

function resolveMainScriptUrl() {
  if (document.currentScript && document.currentScript.src) {
    return new URL(document.currentScript.src, window.location.href);
  }

  const mainScript = Array.from(document.scripts).find(function (script) {
    return /\/js\/main\.js(?:\?|$)/.test(script.src || '');
  });

  if (mainScript && mainScript.src) {
    return new URL(mainScript.src, window.location.href);
  }

  return new URL('js/main.js', window.location.href);
}

function ensureLayoutBootstrap() {
  if (hasLayoutBootstrap()) return Promise.resolve(true);
  if (window.__simphoniaLayoutLoadPromise) return window.__simphoniaLayoutLoadPromise;

  const mainScriptUrl = resolveMainScriptUrl();
  const layoutUrl = new URL('./components/layout.js?v=' + encodeURIComponent(LAYOUT_ASSET_VERSION), mainScriptUrl);

  window.__simphoniaLayoutLoadPromise = new Promise(function (resolve) {
    const existing = document.querySelector('script[data-simphonia-layout-retry="true"]');
    if (existing) {
      existing.addEventListener('load', function () { resolve(hasLayoutBootstrap()); }, { once: true });
      existing.addEventListener('error', function () { resolve(false); }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = layoutUrl.href;
    script.defer = true;
    script.dataset.simphoniaLayoutRetry = 'true';
    script.onload = function () {
      resolve(hasLayoutBootstrap());
    };
    script.onerror = function () {
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return window.__simphoniaLayoutLoadPromise;
}

function revealGsapFallbacks() {
  if (document.documentElement.classList.contains('gsap-ready')) return;

  // Helper — apply visibility styles to all elements matching a selector string.
  // Avoids repeating the same 4 property assignments dozens of times.
  function revealAll(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
    });
  }

  // All elements that use clip-path / autoAlpha reveal patterns — single query.
  revealAll(
    '.reveal, .reveal--left, .reveal--right, .reveal--scale, ' +
    '.iphone-mockup, .hero-postcard__copy, .hero-postcard__phone-area, ' +
    '.about-hero h1, .about-hero p, .about-hero .label, ' +
    '.destinations-hero h1, .destinations-hero p, .destinations-hero .label, ' +
    '.support-hero h1, .support-hero p, .support-hero .label, ' +
    '.legal-hero h1, .legal-hero p, .legal-hero .label, ' +
    '.about-story__img, .about-story > div, ' +
    '.value-card, .team-card, .feat-card, .step-card, .dest-card, .faq-item, ' +
    '.section-header .label, .section-header h2, .section-header p, ' +
    '.cta-section .btn, ' +
    '.footer__brand, .footer__col, .footer__bottom'
  );

  // Showcase section: reveal only the first panel and first screen so content
  // is visible if GSAP (or ScrollTrigger) never initialises.
  document.querySelectorAll('.showcase-sticky__panel[data-panel="0"]').forEach(function (el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.pointerEvents = 'auto';
  });
  document.querySelectorAll('.sas-screen[data-screen="0"]').forEach(function (el) {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  });
  // Hide swipe hint — irrelevant when GSAP failed
  document.querySelectorAll('.showcase-swipe-hint').forEach(function (el) {
    el.style.display = 'none';
  });

  // Also kick off typing effect if it hasn't started
  var typingEl = document.getElementById('typing-text');
  if (typingEl && !typingEl.textContent) {
    initHeroTyping();
  }
}

async function bootstrapSite() {
  try {
    // Wait for i18n translations to load (fires in parallel with deferred scripts)
    if (window.i18nReady) {
      await window.i18nReady;
    }

    const layoutReady = await ensureLayoutBootstrap();

    if (!layoutReady) {
      console.error('[main] Shared layout bootstrap is unavailable. Check js/components/layout.js and clear any stale cached asset.');
      revealGsapFallbacks();
      return;
    }

    // 1. Apply theme immediately (prevents flash)
    window.initTheme();

    // 2. Inject shared shell (skip-link, bg-noise, stars, cursor)
    window.injectShell();

    // 3. Inject shared nav + footer
    window.injectNav();
    window.injectFooter();

    // 4. Inject noscript fallback
    window.injectNoscript();

    // 5. Inject progressive enhancement utilities
    window.injectScrollProgress();
    window.injectMobileCTA();
    window.injectBackToTop();
    window.injectCookieBanner();

    // 6. Custom cursor
    initCursor();

    // 7. Star background canvas (canvas is injected by injectShell())
    if (document.getElementById('stars-canvas')) initStars();

    // 8. Initialise the SPA router — this handles initial page display,
    //     animation init, and all subsequent in-app navigation.
    if (typeof window.initRouter === 'function') {
      window.initRouter();
    } else {
      // Fallback: no router (e.g., 404 page) — run animations directly
      initAnimations();
      initLegalToc();
    }

    // 9. Safety net — if GSAP still hasn't loaded after 5 s, ensure everything visible
    setTimeout(revealGsapFallbacks, 5000);

    // 10. Native anchor navigation + focus polish
    initSmoothScroll();


  } catch (err) {
    console.error('[main] Bootstrap failed:', err);
    // Ensure content is visible even if bootstrap errors out
    revealGsapFallbacks();
  }
}

// ============================================================
// Showcase Template Populator — clones hero bg, stamps shared UI
// ============================================================
function populateShowcaseTemplates() {
  // ── Clone hero background into showcase section ──
  var heroBg = document.querySelector('.hero-postcard__bg:not(.hero-postcard__bg--showcase)');
  var showcaseBg = document.getElementById('showcase-bg');
  if (heroBg && showcaseBg) {
    Array.from(heroBg.children).forEach(function (child) {
      showcaseBg.appendChild(child.cloneNode(true));
    });
  }

  // ── Stamp iOS status bar into every [data-sas-status] placeholder ──
  var STATUS_HTML =
    '<span class="sas-time">9:41</span>' +
    '<div class="sas-icons">' +
    '<svg viewBox="0 0 24 24" fill="#fff"><rect x="1" y="14" width="3" height="6" rx="1"/><rect x="6" y="10" width="3" height="10" rx="1"/><rect x="11" y="6" width="3" height="14" rx="1"/></svg>' +
    '<svg viewBox="0 0 24 24"><path d="M1.5 8.5a13 13 0 0 1 21 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M5 12.5a9 9 0 0 1 14 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="17" r="2" fill="#fff"/></svg>' +
    '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="16" height="10" rx="2" fill="none" stroke="#fff" stroke-width="1.5"/><rect x="3.5" y="8.5" width="11" height="7" rx="1" fill="#4ade80"/><path d="M19 10v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>' +
    '</div>';

  document.querySelectorAll('[data-sas-status]').forEach(function (el) {
    el.innerHTML = STATUS_HTML;
  });

  // ── Stamp bottom nav bar into every [data-sas-nav] placeholder ──
  var NAV_ITEMS = [
    { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>', i18nKey: 'home.showcase.navHome', label: 'Home', idx: 0 },
    { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>', i18nKey: 'home.showcase.navBrowse', label: 'Browse', idx: 1 },
    { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>', i18nKey: 'home.showcase.navMyEsims', label: 'My eSIMs', idx: 2 },
    { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', i18nKey: 'home.showcase.navProfile', label: 'Profile', idx: 3 },
  ];

  document.querySelectorAll('[data-sas-nav]').forEach(function (el) {
    var activeIdx = parseInt(el.getAttribute('data-sas-nav'), 10);
    el.innerHTML = NAV_ITEMS.map(function (item) {
      var cls = item.idx === activeIdx ? 'sas-nav-item sas-nav-item--on' : 'sas-nav-item';
      return '<div class="' + cls + '"><span class="sas-nav-icon">' + item.icon + '</span><span data-i18n="' + item.i18nKey + '">' + item.label + '</span></div>';
    }).join('');
  });
}

bootstrapSite();

// Expose home-specific initialisers so router.js can call them lazily
// after the home page partial is injected into the DOM.
window.populateShowcaseTemplates = populateShowcaseTemplates;
window.initHeroTyping = initHeroTyping;

// ============================================================
// Destinations Marquee — populated from backend + scrollable
// Exposed as window.initDestinationsMarquee and called lazily
// by the router once the home page partial is in the DOM.
// ============================================================
window.initDestinationsMarquee = function initDestinationsMarquee() {
  const strip = document.querySelector('.hero__destinations-strip');
  if (!strip) return;
  if (strip.dataset.marqueeInitialized === 'true') return;
  strip.dataset.marqueeInitialized = 'true';

  // Clone the marquee list for the seamless infinite scroll loop
  // (previously duplicated in HTML, now created dynamically to reduce payload)
  const track = strip.querySelector('.marquee-track');
  const originalList = track && track.querySelector('.marquee-list');
  if (originalList && track.querySelectorAll('.marquee-list').length < 2) {
    const clone = originalList.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  const API_BASE = (window.SIMPHONIA_API && window.SIMPHONIA_API.base) || 'https://api.simphonia.pt';

  // getGuestToken() is provided by js/auth.js (loaded before main.js) via window.getGuestToken
  var getGuestToken = window.getGuestToken;

  function populateLists(countries) {
    const lists = strip.querySelectorAll('.marquee-list');
    if (!lists.length || !countries.length) return;

    // Sanitize text to prevent XSS when injecting API data via innerHTML
    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    const html = countries.map(function (d) {
      const flag = window.flagEmoji(d.countryCode);
      const name = escapeHtml(d.countryName || d.countryCode);
      return '<li class="marquee-item"><span class="marquee-item__flag">' + flag + '</span>' + name + '</li>';
    }).join('');

    lists.forEach(function (ul, i) {
      if (i > 0) ul.setAttribute('aria-hidden', 'true');
      ul.innerHTML = html;
    });

    // Reveal the strip now that it has real API data
    strip.style.display = '';
  }

  // ── Auto-scroll + drag-to-scroll ──────────────────────────
  const SPEED = 0.6;    // px per animation frame
  const RESUME_DELAY = 3000;   // ms before auto-scroll resumes
  let paused = false;
  let resumeTimer = null;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  function scheduleResume() {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(function () { paused = false; }, RESUME_DELAY);
  }

  function cancelResume() {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }

  let animating = false;
  let rafId = null;
  let stripVisible = false; // tracks IntersectionObserver state

  function stopLoop() {
    animating = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function scheduleNextFrame() {
    if (!animating || document.hidden || !stripVisible) return;
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (animating || document.hidden || !stripVisible) return;
    animating = true;
    scheduleNextFrame();
  }

  function loop() {
    rafId = null;
    if (!animating || document.hidden || !stripVisible) {
      stopLoop();
      return;
    }

    // Normalization runs every frame — keeps the seamless loop intact
    // even when the user has manually scrolled past the reset point.
    const half = strip.scrollWidth / 2;
    if (half > 0 && strip.scrollLeft >= half) {
      strip.scrollLeft -= half;
    }

    if (!paused) {
      strip.scrollLeft += SPEED;
    }

    scheduleNextFrame();
  }

  // Only run the animation loop when the strip is visible on screen.
  if ('IntersectionObserver' in window) {
    var stripObserver = new IntersectionObserver(function (entries) {
      stripVisible = entries[0].isIntersecting;
      if (stripVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    });
    stripObserver.observe(strip);
  } else {
    // Fallback for older browsers — always animate
    stripVisible = true;
    startLoop();
  }

  // Pause/resume rAF loop when tab visibility changes
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopLoop();
    } else if (stripVisible) {
      startLoop();
    }
  });

  window.addEventListener('pagehide', stopLoop);
  window.addEventListener('pageshow', function () {
    if (stripVisible && !document.hidden) {
      startLoop();
    }
  });

  // ── Desktop: hover pauses; leaving restarts the 3 s timer ──
  strip.addEventListener('mouseenter', function () {
    cancelResume();
    paused = true;
  });

  strip.addEventListener('mouseleave', function () {
    if (!isDragging) scheduleResume();
  });

  // ── Desktop: drag-to-scroll ─────────────────────────────────
  strip.addEventListener('mousedown', function (e) {
    isDragging = true;
    paused = true;
    dragStartX = e.clientX;
    dragStartScroll = strip.scrollLeft;
    cancelResume();
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const half = strip.scrollWidth / 2;
    let next = dragStartScroll - dx;
    if (half > 0) next = ((next % half) + half) % half;
    strip.scrollLeft = next;
  });

  document.addEventListener('mouseup', function () {
    if (!isDragging) return;
    isDragging = false;
    // If mouse is still over the strip, keep paused until mouseleave
    if (!strip.matches(':hover')) scheduleResume();
  });

  // ── Mobile: press pauses; release starts the 3 s timer ─────
  strip.addEventListener('touchstart', function () {
    cancelResume();
    paused = true;
  }, { passive: true });

  strip.addEventListener('touchend', function () {
    scheduleResume();
  });

  strip.addEventListener('touchcancel', function () {
    scheduleResume();
  });

  // Initial animation start is handled by the IntersectionObserver above.
  // Fallback startLoop() is also handled there for browsers without IO support.

  // ── API fetch with retry ──────────────────────────────────
  function getCurrentLang() {
    return window.SIMPHONIA_LANG || (navigator.language || 'en').split('-')[0];
  }

  // Hide the marquee strip until the API populates it with real data.
  // No hardcoded fallback — if the API is unreachable, the strip stays hidden.
  strip.style.display = 'none';

  // Respect Save-Data / data-saver preference — skip the API call entirely
  // on metered connections to conserve bandwidth.
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.saveData || conn.effectiveType === 'slow-2g')) {
    // Strip stays hidden — no extra network request on metered connections
    return;
  }

  var RETRY_COUNT = 2;
  var RETRY_DELAY = 3000; // ms

  function fetchCountries(attempt) {
    attempt = attempt || 0;
    var lang = getCurrentLang();
    getGuestToken()
      .then(function (token) {
        var controller = new AbortController();
        var tid = setTimeout(function () { controller.abort(); }, 10000);
        return fetch(
          API_BASE + '/api/v1/countries/all?currency=EUR&lang=' + lang,
          { headers: { Authorization: 'Bearer ' + token }, signal: controller.signal }
        ).finally(function () { clearTimeout(tid); });
      })
      .then(function (res) {
        if (!res.ok) throw new Error('Countries fetch failed: ' + res.status);
        return res.json();
      })
      .then(function (envelope) {
        const countries = envelope.data || envelope;
        if (Array.isArray(countries) && countries.length) {
          populateLists(countries);
        }
      })
      .catch(function (err) {
        console.warn('[marquee] Attempt ' + (attempt + 1) + ' failed:', err.message);
        if (attempt < RETRY_COUNT) {
          setTimeout(function () { fetchCountries(attempt + 1); }, RETRY_DELAY * (attempt + 1));
        }
      });
  }

  fetchCountries();

  // Track the language used for the last marquee fetch
  var _lastMarqueeLang = getCurrentLang();

  // Re-fetch marquee countries when the language changes
  document.addEventListener('simphonia:langchange', function () {
    var newLang = getCurrentLang();
    if (newLang === _lastMarqueeLang) return;
    _lastMarqueeLang = newLang;

    // Clear existing marquee content
    var lists = strip.querySelectorAll('.marquee-list');
    lists.forEach(function (ul) { ul.innerHTML = ''; });
    strip.style.display = 'none';
    // Fetch with the new language
    fetchCountries(0);
  });
};

// ============================================================
// Legal TOC — shared by /privacy/ and /terms/
// Highlights the sidebar link matching the section currently
// visible at the top of the viewport.
// ============================================================
function initLegalToc() {
  if (typeof window.__simphoniaLegalTocCleanup === 'function') {
    window.__simphoniaLegalTocCleanup();
    window.__simphoniaLegalTocCleanup = null;
  }

  const links = Array.from(document.querySelectorAll('.legal-toc__link'));
  if (!links.length) return;

  const sections = links
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  const navH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10
  ) || 72;

  function setActive(id) {
    links.forEach(l => {
      l.classList.toggle(
        'legal-toc__link--active',
        l.getAttribute('href') === '#' + id
      );
    });
  }

  function update() {
    // Use a viewport-relative threshold (35 % of window height) so a section
    // heading that is visibly in the upper portion of the screen gets highlighted.
    // The minimum is navH + 28 so that a click-to-anchor scroll (which lands the
    // heading at scroll-margin-top ≈ navH + 24 px) still activates the correct
    // item immediately.
    const threshold = Math.max(navH + 28, window.innerHeight * 0.35);

    let current = sections[0];
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= threshold) {
        current = sections[i];
      }
    }
    setActive(current.id);
  }

  // Click handler: immediately highlight the correct link and, after
  // the browser finishes the anchor scroll, re-sync the scroll spy.
  const clickHandlers = new Map();
  links.forEach(l => {
    const onClick = () => {
      const hash = l.getAttribute('href');
      if (hash) setActive(hash.slice(1));
      // Re-run after the scroll settles to keep the spy in sync
      setTimeout(update, 120);
    };
    clickHandlers.set(l, onClick);
    l.addEventListener('click', onClick);
  });

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.__simphoniaLegalTocCleanup = function () {
    window.removeEventListener('scroll', onScroll);
    links.forEach(function (link) {
      const onClick = clickHandlers.get(link);
      if (onClick) {
        link.removeEventListener('click', onClick);
      }
    });
  };
  update();
  return window.__simphoniaLegalTocCleanup;
}

// ============================================================
// Custom Cursor
// ============================================================
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || !window.matchMedia('(hover: hover)').matches) return;

  let cx = 0, cy = 0, tx = 0, ty = 0;
  let rafId = null;

  function lerp() {
    cx += (tx - cx) * 0.14;
    cy += (ty - cy) * 0.14;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';

    // Keep running only while the cursor is still catching up (> 0.1 px delta).
    if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
      rafId = requestAnimationFrame(lerp);
    } else {
      rafId = null; // loop goes idle until the next mousemove
    }
  }

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    cursor.classList.add('cursor--visible');
    if (!rafId && !document.hidden) rafId = requestAnimationFrame(lerp);
  });

  // Resume loop if the user returns to the tab while the mouse is in motion.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !rafId && cursor.classList.contains('cursor--visible')) {
      rafId = requestAnimationFrame(lerp);
    }
  });

  const SEL = [
    'a', 'button', '.glass-card', '.feat-card', '.bento-item', '.dest-card',
    '.feature-card', '.step-card', '.metric-card',
    '.filter-tab', '.faq-item summary', '.team-card',
    'input', 'textarea', 'select',
  ].join(',');

  // Single pointerover listener replaces separate mouseover + mouseout,
  // halving the number of document-level event listeners.
  document.addEventListener('pointerover', (e) => {
    if (!e.target || typeof e.target.closest !== 'function') return;
    cursor.classList.toggle('cursor--hover', !!e.target.closest(SEL));
  });
}

// ============================================================
// Animated Star Background
// ============================================================
function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  // Skip on tablets/mobiles — CSS hides the canvas at ≤960px (display:none)
  // and running the animation on hidden elements wastes battery and CPU.
  if (window.innerWidth <= 960) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Fallback: also check computed style in case CSS wasn't loaded yet
  if (getComputedStyle(canvas).display === 'none') return;

  // Respect data-saver preference on desktop too
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && conn.saveData) return;

  const ctx = canvas.getContext('2d');
  // Reduce star count on lower-resolution or lower-powered screens
  const N = window.innerWidth < 1280 ? 80 : 120;
  let w, h, stars = [];

  // Cache the star colour so we don't hit getComputedStyle every frame.
  let starRgb = '255,255,255';
  function refreshStarColor() {
    starRgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--star-color').trim() || '255,255,255';
  }
  refreshStarColor();
  // Re-read only when the theme attribute changes, not every frame.
  new MutationObserver(refreshStarColor).observe(
    document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }
  );

  function resize() {
    var oldW = w, oldH = h;
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    // Redistribute stars that fall outside new bounds (e.g. window grew)
    if (stars.length && (w > oldW || h > oldH)) {
      for (var i = 0; i < stars.length; i++) {
        if (stars[i].x > w) stars[i].x = Math.random() * w;
        if (stars[i].y > h) stars[i].y = Math.random() * h;
      }
    }
  }

  function populate() {
    resize();
    stars = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      a: Math.random() * 0.55 + 0.2,
    }));
  }

  let rafId = null;
  let isCanvasVisible = true;

  function startDraw() {
    if (rafId) return; // already running
    rafId = requestAnimationFrame(draw);
  }

  function stopDraw() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function draw() {
    rafId = null; // clear before scheduling next
    if (document.hidden || !isCanvasVisible) return; // stop loop when hidden

    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = w; else if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h; else if (s.y > h) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + starRgb + ',' + s.a + ')';
      ctx.fill();
    }
    rafId = requestAnimationFrame(draw);
  }

  // Pause the rAF loop when the canvas scrolls out of view to save CPU
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      isCanvasVisible = entries[0].isIntersecting;
      if (isCanvasVisible && !document.hidden) startDraw();
      else stopDraw();
    }, { threshold: 0 }).observe(canvas);
  }

  // Also pause/resume on tab visibility change
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && isCanvasVisible) startDraw();
    else stopDraw();
  });

  // Pause/resume if the user toggles reduced-motion in OS settings mid-session
  var reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotionMQ.addEventListener('change', function (e) {
    if (e.matches) { stopDraw(); }
    else if (isCanvasVisible && !document.hidden) { startDraw(); }
  });

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }, { passive: true });
  populate();
  startDraw();
}

// ============================================================
// Native Anchor Navigation
// ============================================================
function initSmoothScroll() {
  const scrollCoordinator = window.scrollCoordinator;

  const focusHashTarget = () => {
    if (scrollCoordinator && typeof scrollCoordinator.focusHashTarget === 'function') {
      const target = scrollCoordinator.focusHashTarget();
      if (target && typeof scrollCoordinator.scheduleRefresh === 'function') {
        scrollCoordinator.scheduleRefresh();
      }
      return;
    }

    const hash = window.location.hash;
    if (!hash) return;

    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;

    requestAnimationFrame(() => {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    });
  };

  window.addEventListener('hashchange', focusHashTarget);
  focusHashTarget();
}

// ============================================================
// Hero Typing Effect — mirrors Flutter TypingPlaceholder
// All state is encapsulated inside initHeroTyping() to avoid
// polluting the global scope.
// ============================================================
function initHeroTyping() {
  const el = document.getElementById('typing-text');
  if (!el) return;

  // Guard: only initialise once even if called multiple times
  if (el.dataset.typingActive === 'true') return;
  el.dataset.typingActive = 'true';

  // ── local state (no longer on window) ──
  let active = true;
  let timer = null;
  let pausedByVisibility = false;

  function getTypingPhrases() {
    var translated = window.t('home.hero.typingPhrases');
    if (Array.isArray(translated)) return translated;
    // t() returns the key itself if the translation isn't an array (shouldn't happen)
    return [];
  }

  let phrases = getTypingPhrases();

  const TYPING_SPEED = 100;   // ms per character (typing)
  const DELETING_SPEED = 50;   // ms per character (deleting)
  const PAUSE_DURATION = 2000; // ms pause after fully typed

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function tick() {
    const phrase = phrases[phraseIndex];

    if (!isDeleting) {
      // Typing
      if (charIndex < phrase.length) {
        // Suppress aria-live during typing to prevent per-letter announcements
        if (charIndex === 0) el.setAttribute('aria-live', 'off');
        charIndex++;
        el.textContent = phrase.substring(0, charIndex);
        timer = setTimeout(tick, TYPING_SPEED);
      } else {
        // Finished typing — re-enable aria-live so the full phrase is announced
        el.setAttribute('aria-live', 'polite');
        // Pause then start deleting
        timer = setTimeout(function () {
          isDeleting = true;
          tick();
        }, PAUSE_DURATION);
      }
    } else {
      // Deleting — suppress announcements
      if (charIndex === phrase.length) el.setAttribute('aria-live', 'off');
      if (charIndex > 0) {
        charIndex--;
        el.textContent = phrase.substring(0, charIndex);
        timer = setTimeout(tick, DELETING_SPEED);
      } else {
        // Finished deleting — move to next phrase
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timer = setTimeout(tick, TYPING_SPEED);
      }
    }
  }

  // Pause typing when tab is hidden, resume on becoming visible
  document.addEventListener('visibilitychange', function onVisibility() {
    if (!active) {
      document.removeEventListener('visibilitychange', onVisibility);
      return;
    }
    if (document.hidden) {
      if (timer) { clearTimeout(timer); timer = null; pausedByVisibility = true; }
    } else if (pausedByVisibility) {
      pausedByVisibility = false;
      timer = setTimeout(tick, 100);
    }
  });

  // Restart typing effect with new translated phrases when language changes
  document.addEventListener('simphonia:langchange', function () {
    if (!active) return;
    // Clear current animation
    if (timer) { clearTimeout(timer); timer = null; }
    // Reload phrases with new language
    phrases = getTypingPhrases();
    // Reset state and restart from the beginning
    phraseIndex = 0;
    charIndex = 0;
    isDeleting = false;
    el.textContent = '';
    timer = setTimeout(tick, 200);
  });

  // Clean up on page hide (bfcache / tab close)
  window.addEventListener('pagehide', function onPageHide() {
    active = false;
    if (timer) { clearTimeout(timer); timer = null; }
    window.removeEventListener('pagehide', onPageHide);
  }, { once: true });

  tick();
}

