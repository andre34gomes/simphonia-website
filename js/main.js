/**
 * Simphonia Website — Main Entry Point
 *
 * Bootstraps shared layout, cursor, star background,
 * then conditionally loads globe + GSAP animations.
 */

import { injectNav, injectFooter } from './components/layout.js';
import { initGlobe } from './globe.js';
import { initAnimations } from './animations.js';

// ── Boot ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject shared layout
  injectNav();
  injectFooter();

  // 2. Custom cursor (pointer devices only)
  initCursor();

  // 3. Star background
  if (document.getElementById('stars-canvas')) {
    initStars();
  }

  // 4. 3D Globe (hero only)
  if (document.getElementById('globe-container')) {
    initGlobe('globe-container');
  }

  // 5. GSAP scroll animations
  initAnimations();

  // 6. Smooth scroll for anchor links
  initSmoothScroll();
});

// ── Custom Cursor ─────────────────────────────────────────

function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  let cx = 0, cy = 0;
  let tx = 0, ty = 0;

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!cursor.classList.contains('cursor--visible')) {
      cursor.classList.add('cursor--visible');
    }
  });

  // Smooth follow with lerp
  function update() {
    cx += (tx - cx) * 0.15;
    cy += (ty - cy) * 0.15;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(update);
  }
  update();

  // Hover expansion
  const hoverTargets = 'a, button, .glass-card, .bento-item, .dest-card, .feature-card, .price-card, .store-badge, .filter-tab, .faq-item summary, .compat-brand-card, .team-card, input';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      cursor.classList.add('cursor--hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      cursor.classList.remove('cursor--hover');
    }
  });
}

// ── Star Background ───────────────────────────────────────

function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let stars = [];
  const STAR_COUNT = 160;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function create() {
    resize();
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;

      if (s.x < 0) s.x = width;
      if (s.x > width) s.x = 0;
      if (s.y < 0) s.y = height;
      if (s.y > height) s.y = 0;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  create();
  draw();
}

// ── Smooth Scroll ─────────────────────────────────────────

function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    const hashIndex = href.indexOf('#');
    if (hashIndex === -1) return;

    const hash = href.substring(hashIndex);
    const target = document.querySelector(hash);
    if (!target) return;

    // Only prevent default if it's a same-page anchor
    const pagePart = href.substring(0, hashIndex);
    const currentPath = window.location.pathname;
    if (pagePart && !currentPath.endsWith(pagePart) && pagePart !== '') return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

