/**
 * Simphonia Website — Main Entry Point
 *
 * Loaded as <script defer>. By the time this executes, the DOM is fully
 * parsed AND all prior <script defer> (CDN libs + layout.js + animations.js
 * + globe.js) have already run.
 */

const LAYOUT_ASSET_VERSION = '20260326-10';
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
  const layoutReady = await ensureLayoutBootstrap();

  if (!layoutReady) {
    console.error('[main] Shared layout bootstrap is unavailable. Check js/components/layout.js and clear any stale cached asset.');
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

  // 6. Custom cursor
  initCursor();

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
}

bootstrapSite();

// ============================================================
// Destinations Marquee — populated from backend + scrollable
// Uses the same guest-auth + endpoint as destinations/index.html
// ============================================================
(function initDestinationsMarquee() {
  var strip = document.querySelector('.hero__destinations-strip');
  if (!strip) return;

  var API_BASE  = 'https://api.simphonia.pt';
  var TOKEN_KEY = 'simphonia_guest_token';
  var EXPIRY_KEY = 'simphonia_guest_expiry';
  var EXPIRY_MARGIN_MS = 60000;

  // ── Helpers ────────────────────────────────────────────────
  function flagEmoji(code) {
    if (!code || code.length < 2) return '';
    return Array.from(code.toUpperCase().slice(0, 2))
      .map(function (c) { return String.fromCodePoint(c.charCodeAt(0) + 127397); })
      .join('');
  }

  function getGuestToken() {
    var stored = localStorage.getItem(TOKEN_KEY);
    var expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    if (stored && Date.now() < expiry - EXPIRY_MARGIN_MS) {
      return Promise.resolve(stored);
    }
    return fetch(API_BASE + '/api/v1/auth/guest', { method: 'POST' })
      .then(function (res) {
        if (!res.ok) throw new Error('Guest auth failed: ' + res.status);
        return res.json();
      })
      .then(function (envelope) {
        var data = envelope.data || envelope;
        localStorage.setItem(TOKEN_KEY,  data.token);
        localStorage.setItem(EXPIRY_KEY, Date.now() + data.expiresIn * 1000);
        return data.token;
      });
  }

  function populateLists(countries) {
    var lists = strip.querySelectorAll('.marquee-list');
    if (!lists.length || !countries.length) return;

    var html = countries.map(function (d) {
      var flag = flagEmoji(d.countryCode);
      var name = d.countryName || d.countryCode;
      return '<li class="marquee-item"><span class="marquee-item__flag">' + flag + '</span>' + name + '</li>';
    }).join('');

    lists.forEach(function (ul, i) {
      if (i > 0) ul.setAttribute('aria-hidden', 'true');
      ul.innerHTML = html;
    });
  }

  // ── Auto-scroll + drag-to-scroll ──────────────────────────
  var SPEED        = 0.6;    // px per animation frame
  var RESUME_DELAY = 3000;   // ms before auto-scroll resumes
  var paused       = false;
  var resumeTimer  = null;
  var isDragging   = false;
  var dragStartX   = 0;
  var dragStartScroll = 0;

  function scheduleResume() {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(function () { paused = false; }, RESUME_DELAY);
  }

  function cancelResume() {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }

  function loop() {
    if (!document.hidden) {
      // Normalization runs every frame — keeps the seamless loop intact
      // even when the user has manually scrolled past the reset point.
      var half = strip.scrollWidth / 2;
      if (half > 0 && strip.scrollLeft >= half) {
        strip.scrollLeft -= half;
      }

      if (!paused) {
        strip.scrollLeft += SPEED;
      }
    }

    requestAnimationFrame(loop);
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
    isDragging      = true;
    paused          = true;
    dragStartX      = e.clientX;
    dragStartScroll = strip.scrollLeft;
    cancelResume();
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    var dx   = e.clientX - dragStartX;
    var half = strip.scrollWidth / 2;
    var next = dragStartScroll - dx;
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

  requestAnimationFrame(loop);

  // ── API fetch ──────────────────────────────────────────────
  var lang = (navigator.language || 'en').split('-')[0];

  getGuestToken()
    .then(function (token) {
      return fetch(
        API_BASE + '/api/v1/countries?currency=EUR&lang=' + lang,
        { headers: { Authorization: 'Bearer ' + token } }
      );
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Countries fetch failed: ' + res.status);
      return res.json();
    })
    .then(function (envelope) {
      var countries = envelope.data || envelope;
      if (Array.isArray(countries) && countries.length) {
        populateLists(countries);
      }
    })
    .catch(function (err) {
      // Keep the static fallback items on error — no visible disruption
      console.warn('[marquee] Could not load destinations from API:', err);
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

  function update() {
    let current = sections[0];
    sections.forEach(s => {
      if (s.getBoundingClientRect().top <= navH + 40) current = s;
    });
    links.forEach(l => {
      l.classList.toggle(
        'legal-toc__link--active',
        l.getAttribute('href') === '#' + current.id
      );
    });
  }

  window.addEventListener('scroll', update, { passive: true });
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
    cursor.style.top  = cy + 'px';

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

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(SEL)) cursor.classList.add('cursor--hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(SEL)) cursor.classList.remove('cursor--hover');
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
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function populate() {
    resize();
    stars = Array.from({ length: N }, () => ({
      x:  Math.random() * w,
      y:  Math.random() * h,
      r:  Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      a:  Math.random() * 0.55 + 0.2,
    }));
  }

  let rafId = null;

  function draw() {
    rafId = requestAnimationFrame(draw);
    if (document.hidden) return; // don't paint while the tab is invisible

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
  }

  window.addEventListener('resize', resize, { passive: true });
  populate();
  draw();
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
function initHeroTyping() {
  var el = document.getElementById('typing-text');
  if (!el) return;

  var phrases = [
    'Wherever You Go.',
    'Without Limits.',
    'Across the Globe.',
    'Ready in Seconds.',
    'Always Online.',
  ];

  var TYPING_SPEED   = 100;   // ms per character (typing)
  var DELETING_SPEED  = 50;   // ms per character (deleting)
  var PAUSE_DURATION  = 2000; // ms pause after fully typed

  var phraseIndex = 0;
  var charIndex   = 0;
  var isDeleting  = false;
  var timer       = null;

  function tick() {
    var phrase = phrases[phraseIndex];

    if (!isDeleting) {
      // Typing
      if (charIndex < phrase.length) {
        charIndex++;
        el.textContent = phrase.substring(0, charIndex);
        timer = setTimeout(tick, TYPING_SPEED);
      } else {
        // Finished typing — pause then start deleting
        timer = setTimeout(function () {
          isDeleting = true;
          tick();
        }, PAUSE_DURATION);
      }
    } else {
      // Deleting
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

  tick();
}

