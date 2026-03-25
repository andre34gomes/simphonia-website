/**
 * Simphonia Website — Main Entry Point
 *
 * Loaded as <script defer>. By the time this executes, the DOM is fully
 * parsed AND all prior <script defer> (CDN libs + layout.js + animations.js
 * + globe.js) have already run.
 */

// 0. Apply theme immediately (prevents flash)
initTheme();

// 1. Inject shared shell (skip-link, bg-noise, stars, cursor)
injectShell();

// 3. Inject shared nav + footer
injectNav();
injectFooter();

// 4. Inject noscript fallback
injectNoscript();

// 5. Inject progressive enhancement utilities
injectScrollProgress();
injectMobileCTA();
injectBackToTop();
injectCookieBanner();

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
setTimeout(function () {
  if (!document.documentElement.classList.contains('gsap-ready')) {
    // Generic reveal classes — CSS hides them with visibility:hidden
    document.querySelectorAll('.reveal,.reveal--left,.reveal--right,.reveal--scale')
      .forEach(function (el) {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.transform = 'none';
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
      '.dest-card', '.dest-grid-card', '.faq-item',
      // Section header children
      '.section-header .label', '.section-header h2', '.section-header p',
    ].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.transform = 'none';
      });
    });
    // Footer elements
    document.querySelectorAll('.footer__brand, .footer__col, .footer__bottom')
      .forEach(function (el) {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.transform = 'none';
      });
    // Also kick off typing effect if it hasn't started
    if (document.getElementById('typing-text') && !document.getElementById('typing-text').textContent) {
      initHeroTyping();
    }
  }
}, 5000);

// 9. Native anchor navigation + focus polish
initSmoothScroll();

// ============================================================
// Custom Cursor
// ============================================================
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || !window.matchMedia('(hover: hover)').matches) return;

  let cx = 0, cy = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    cursor.classList.add('cursor--visible');
  });

  (function lerp() {
    cx += (tx - cx) * 0.14;
    cy += (ty - cy) * 0.14;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(lerp);
  })();

  const SEL = [
    'a', 'button', '.glass-card', '.feat-card', '.bento-item', '.dest-card',
    '.dest-grid-card', '.feature-card', '.step-card', '.metric-card',
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

  const ctx = canvas.getContext('2d');
  const N   = 160;
  let w, h, stars = [];

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

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const starRgb = getComputedStyle(document.documentElement).getPropertyValue('--star-color').trim() || '255,255,255';
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
    requestAnimationFrame(draw);
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

