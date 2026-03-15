/**
 * Simphonia Website — Main Entry Point
 *
 * Loaded as <script type="module"> which is implicitly deferred.
 * By the time this module executes, the DOM is fully parsed AND all prior
 * <script defer> CDN tags (Three.js, GSAP, ScrollTrigger) have already run.
 * No DOMContentLoaded wrapper is needed.
 */

import { injectShell, injectNav, injectFooter, injectNoscript } from './components/layout.js';
import { initGlobe }               from './globe.js';
import { initAnimations }          from './animations.js';

// 1. Inject shared shell (skip-link, bg-noise, stars, cursor)
injectShell();

// 2. Inject shared nav + footer
injectNav();
injectFooter();

// 3. Inject noscript fallback
injectNoscript();

// 4. Custom cursor
initCursor();

// 5. Star background canvas
if (document.getElementById('stars-canvas')) initStars();

// 6. Three.js globe (hero page only)
if (document.getElementById('globe-container')) initGlobe('globe-container');

// 7. GSAP scroll animations — has internal retry loop for CDN timing safety
initAnimations();

// 8. Smooth anchor scroll
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
    '.feature-card', '.price-card', '.step-card', '.metric-card', '.store-badge',
    '.filter-tab', '.faq-item summary', '.compat-brand-card', '.team-card',
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
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = w; else if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h; else if (s.y > h) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + s.a + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  populate();
  draw();
}

// ============================================================
// Smooth Anchor Scroll
// ============================================================
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;

    const href    = link.getAttribute('href');
    const hashIdx = href.indexOf('#');
    if (hashIdx === -1) return;

    const hash   = href.slice(hashIdx);
    const target = document.querySelector(hash);
    if (!target) return;

    const page = href.slice(0, hashIdx);
    if (page && !window.location.pathname.endsWith(page) && page !== '') return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
