/**
 * Simphonia Website — Main Entry Point
 *
 * Loaded as <script defer>. By the time this executes, the DOM is fully
 * parsed AND all prior <script defer> (CDN libs + layout.js + animations.js
 * + globe.js) have already run.
 */

const LAYOUT_ASSET_VERSION = '20260331';
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

  // Generic reveal classes — clear clip-path and any residual transforms
  document.querySelectorAll('.reveal,.reveal--left,.reveal--right,.reveal--scale')
    .forEach(function (el) {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
    });

  // Hero-specific elements set to autoAlpha:0 by _hero()
  [
    '.hero__h1 .line-1', '.hero__h1 .line-2',
    '.hero__desc', '.hero__actions', '.hero__trust-points', '.iphone-mockup',
    // Sub-page hero elements
    '.about-hero h1', '.about-hero p', '.about-hero .label',
    '.destinations-hero h1', '.destinations-hero p', '.destinations-hero .label',
    '.support-hero h1', '.support-hero p', '.support-hero .label',
    '.legal-hero h1', '.legal-hero p', '.legal-hero .label',
    // Story block children
    '.about-story__img', '.about-story > div',
    // Section-specific elements hidden by GSAP batch
    '.value-card', '.team-card', '.feat-card', '.step-card',
    '.dest-card', '.faq-item',
    // Section header children
    '.section-header .label', '.section-header h2', '.section-header p',
  ].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
    });
  });

  // Showcase section: reveal only the first panel and first screen so content
  // is visible if GSAP (or ScrollTrigger) never initialises. Revealing all
  // Showcase section: ensure first panel/screen is visible if GSAP fails
  document.querySelectorAll('.showcase-sticky__panel[data-panel="0"]').forEach(function (el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.pointerEvents = 'auto';
  });
  document.querySelectorAll('.sas-screen[data-screen="0"]').forEach(function (el) {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  });

  // CTA section buttons are hidden by _ctaButtonEntrance() via GSAP clipPath.
  // If the user never scrolls that far, make sure they're always visible.
  document.querySelectorAll('.cta-section .btn').forEach(function (el) {
    el.style.opacity = '1';
    el.style.clipPath = 'none';
    el.style.transform = 'none';
  });

  // Footer elements
  document.querySelectorAll('.footer__brand, .footer__col, .footer__bottom')
    .forEach(function (el) {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
    });

  // Also kick off typing effect if it hasn't started
  if (document.getElementById('typing-text') && !document.getElementById('typing-text').textContent) {
    initHeroTyping();
  }
}

async function bootstrapSite() {
  try {
    const layoutReady = await ensureLayoutBootstrap();

    if (!layoutReady) {
      console.error('[main] Shared layout bootstrap is unavailable. Check js/components/layout.js and clear any stale cached asset.');
      revealGsapFallbacks();
      return;
    }

    // 0. Apply theme immediately (prevents flash)
    window.initTheme();

    // 1. Inject shared shell (skip-link, bg-noise, stars, cursor)
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

    // 5b. Announcement banner (homepage only, session-dismissible)
    if (typeof window.injectAnnouncementBanner === 'function') {
      window.injectAnnouncementBanner();
    }

    // 6. Custom cursor
    initCursor();

    // 6b. Populate deduplicated showcase templates (hero bg, status bars, nav bars)
    populateShowcaseTemplates();

    // 7. Star background canvas
    if (document.getElementById('stars-canvas')) initStars();

    // 8. Three.js globe (hero page only)
    if (document.getElementById('globe-container')) initGlobe('globe-container');

    // 9. GSAP scroll animations — has internal retry loop for CDN timing safety
    initAnimations();

    // 9b. Hero typing effect — starts after hero entrance animation completes
    if (document.getElementById('typing-text')) {
      setTimeout(initHeroTyping, 1200);
    }

    // 10. Safety net — if GSAP still hasn't loaded after 5 s, ensure everything visible
    setTimeout(revealGsapFallbacks, 5000);

    // 11. Native anchor navigation + focus polish
    initSmoothScroll();

    // 12. Legal page table-of-contents active-link tracker
    initLegalToc();

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
    { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>', label: 'Home', idx: 0 },
    { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>', label: 'Browse', idx: 1 },
    { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>', label: 'My eSIMs', idx: 2 },
    { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', label: 'Profile', idx: 3 },
  ];

  document.querySelectorAll('[data-sas-nav]').forEach(function (el) {
    var activeIdx = parseInt(el.getAttribute('data-sas-nav'), 10);
    el.innerHTML = NAV_ITEMS.map(function (item) {
      var cls = item.idx === activeIdx ? 'sas-nav-item sas-nav-item--on' : 'sas-nav-item';
      return '<div class="' + cls + '"><span class="sas-nav-icon">' + item.icon + '</span>' + item.label + '</div>';
    }).join('');
  });
}

bootstrapSite();

// ============================================================
// Destinations Marquee — populated from backend + scrollable
// Uses the same guest-auth + endpoint as destinations/index.html
// ============================================================
(function initDestinationsMarquee() {
  const strip = document.querySelector('.hero__destinations-strip');
  if (!strip) return;

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

    const html = countries.map(function (d) {
      const flag = window.flagEmoji(d.countryCode);
      const name = d.countryName || d.countryCode;
      return '<li class="marquee-item"><span class="marquee-item__flag">' + flag + '</span>' + name + '</li>';
    }).join('');

    lists.forEach(function (ul, i) {
      if (i > 0) ul.setAttribute('aria-hidden', 'true');
      ul.innerHTML = html;
    });
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

  function startLoop() {
    if (!animating) {
      animating = true;
      requestAnimationFrame(loop);
    }
  }

  function loop() {
    if (!animating) return;

    if (!document.hidden) {
      // Normalization runs every frame — keeps the seamless loop intact
      // even when the user has manually scrolled past the reset point.
      const half = strip.scrollWidth / 2;
      if (half > 0 && strip.scrollLeft >= half) {
        strip.scrollLeft -= half;
      }

      if (!paused) {
        strip.scrollLeft += SPEED;
      }
    }

    requestAnimationFrame(loop);
  }

  // Only run the animation loop when the strip is visible on screen.
  if ('IntersectionObserver' in window) {
    var stripObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        startLoop();
      } else {
        animating = false;
      }
    });
    stripObserver.observe(strip);
  } else {
    // Fallback for older browsers — always animate
    startLoop();
  }

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

  // ── API fetch ──────────────────────────────────────────────
  const lang = (navigator.language || 'en').split('-')[0];

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
      // Backend unavailable (e.g. local dev without the server running) —
      // the fallback list already loaded above, so this is non-critical.
      console.warn('[marquee] API unavailable, using static fallback destinations:', err.message);
    });
}());

// ============================================================
// Legal TOC — shared by /privacy/ and /terms/
// Highlights the sidebar link matching the section currently
// visible at the top of the viewport.
// ============================================================
function initLegalToc() {
  const links = document.querySelectorAll('.legal-toc__link');
  if (!links.length) return;

  const sections = Array.from(links)
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
  links.forEach(l => {
    l.addEventListener('click', () => {
      const hash = l.getAttribute('href');
      if (hash) setActive(hash.slice(1));
      // Re-run after the scroll settles to keep the spy in sync
      setTimeout(update, 120);
    });
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
  update();
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
  // Skip on mobile where CSS hides the canvas (display:none → no offsetParent)
  if (!canvas.offsetParent && getComputedStyle(canvas).display === 'none') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const N = window.innerWidth < 768 ? 80 : 120;
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
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
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
// ============================================================
let _heroTypingActive = false;
let _heroTypingTimer = null;

// Cancel hero typing timer on page hide (bfcache / tab close)
window.addEventListener('pagehide', function () {
  if (_heroTypingTimer) {
    clearTimeout(_heroTypingTimer);
    _heroTypingTimer = null;
  }
  _heroTypingActive = false;
});

// Pause typing when tab is hidden, resume when visible
var _heroTypingPausedByVisibility = false;
var _heroTypingTickFn = null;

document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    // Pause: clear the pending timer
    if (_heroTypingTimer) {
      clearTimeout(_heroTypingTimer);
      _heroTypingTimer = null;
      _heroTypingPausedByVisibility = true;
    }
  } else if (_heroTypingPausedByVisibility && _heroTypingActive && _heroTypingTickFn) {
    // Resume: schedule the next tick immediately
    _heroTypingPausedByVisibility = false;
    _heroTypingTimer = setTimeout(_heroTypingTickFn, 100);
  }
});

function initHeroTyping() {
  const el = document.getElementById('typing-text');
  if (!el) return;
  if (_heroTypingActive) return;
  _heroTypingActive = true;

  const phrases = [
    'Wherever You Go.',
    'Without Limits.',
    'Across the Globe.',
    'Ready in Seconds.',
    'Always Online.',
  ];

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
        charIndex++;
        el.textContent = phrase.substring(0, charIndex);
        _heroTypingTimer = setTimeout(tick, TYPING_SPEED);
      } else {
        // Finished typing — pause then start deleting
        _heroTypingTimer = setTimeout(function () {
          isDeleting = true;
          tick();
        }, PAUSE_DURATION);
      }
    } else {
      // Deleting
      if (charIndex > 0) {
        charIndex--;
        el.textContent = phrase.substring(0, charIndex);
        _heroTypingTimer = setTimeout(tick, DELETING_SPEED);
      } else {
        // Finished deleting — move to next phrase
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        _heroTypingTimer = setTimeout(tick, TYPING_SPEED);
      }
    }
  }

  _heroTypingTickFn = tick;
  tick();
}

