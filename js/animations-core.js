/**
 * Simphonia — Animation Core (shared across all pages)
 *
 * Contains: helpers, lib-wait, ScrollTrigger refresh scheduler,
 * initAnimations() orchestrator, generic reveals, footer reveal,
 * magnetic buttons, section header split, section dividers.
 *
 * Split from the original monolithic animations.js (1,208 lines)
 * into three focused modules loaded by all pages.
 *
 * @see animations-home.js  — homepage-specific animations
 * @see animations-subpages.js — subpage-specific animations
 */

/* ───────────────────────────────────────────────────────────
   Constants
   ─────────────────────────────────────────────────────────── */
const SECTION_SPECIFIC_SEL =
  '.feat-card, .step-card, .bento-item, ' +
  '.faq-item, .team-card, .value-card, .dest-card, .dest-grid-card, ' +
  '.feature-card, .section-header';

/* ───────────────────────────────────────────────────────────
   Helpers (exposed globally for home/subpage modules)
   ─────────────────────────────────────────────────────────── */
function _isSpecific(el) {
  try { return el.matches(SECTION_SPECIFIC_SEL); } catch (_) { return false; }
}

function _isHeroChild(el) {
  try {
    return !!el.closest('.about-hero, .destinations-hero, .support-hero, .legal-hero, .hero--v2');
  } catch (_) { return false; }
}

function _isCTAChild(el) {
  try { return !!el.closest('.cta-section'); } catch (_) { return false; }
}

function _isStoryBlock(el) {
  try { return !!el.closest('.about-story'); } catch (_) { return false; }
}

function _st(trigger, startPct) {
  return { trigger: trigger, start: 'top ' + (startPct || '88%'), once: true };
}

function _batchReveal(selector, fromVars, tweenVars, batchMax) {
  if (!document.querySelector(selector)) return;
  const from = Object.assign({ clipPath: 'inset(0 0 100% 0)' }, fromVars);
  const to = Object.assign({ clipPath: 'inset(0 0 0% 0)', overwrite: 'auto' }, tweenVars);
  ScrollTrigger.batch(selector, {
    batchMax: batchMax || 4,
    onEnter: function (batch) {
      gsap.fromTo(batch, from, to);
    },
    start: 'top 88%',
    once: true,
  });
}

/* ───────────────────────────────────────────────────────────
   Wait for GSAP + ScrollTrigger (max 4 s)
   ─────────────────────────────────────────────────────────── */
function _waitForLibs() {
  return new Promise(function (resolve, reject) {
    const start = Date.now();
    (function check() {
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        return resolve();
      }
      if (Date.now() - start > 4000) {
        return reject(new Error('GSAP/ScrollTrigger not loaded'));
      }
      setTimeout(check, 80);
    })();
  });
}

function _scheduleScrollRefresh(options) {
  if (window.scrollCoordinator && typeof window.scrollCoordinator.scheduleRefresh === 'function') {
    window.scrollCoordinator.scheduleRefresh(options);
    return;
  }

  function flush() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      });
    });
  }

  if (options && options.waitForLoad && document.readyState !== 'complete') {
    window.addEventListener('load', flush, { once: true });
  } else {
    flush();
  }
}

/* ───────────────────────────────────────────────────────────
   PUBLIC: resetAnimations()
   Kills all ScrollTrigger instances and resets the init guard
   so initAnimations() can be called again on SPA page change.
   ─────────────────────────────────────────────────────────── */
window.resetAnimations = function () {
  _animationsInitialized = false;
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
  }
  // Cancel the showcase segment LERP loop (animations-home.js) if it is running.
  if (typeof _segLerpCancelFn === 'function') {
    _segLerpCancelFn();
    _segLerpCancelFn = null;
  }
  // Immediately reset showcase segment fill widths so stale inline styles
  // don't flash when the home page is re-shown before _stickyShowcase() re-runs.
  document.querySelectorAll('.showcase-segment__fill').forEach(function (el) {
    el.style.width = '0%';
  });
};

/* ───────────────────────────────────────────────────────────
   PUBLIC: initAnimations()
   ─────────────────────────────────────────────────────────── */
let _animationsInitialized = false;

function initAnimations() {
  if (_animationsInitialized) return;
  _animationsInitialized = true;

  _waitForLibs()
    .then(function () {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      document.documentElement.classList.add('gsap-ready');

      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({
        limitCallbacks: true,
        ignoreMobileResize: true,
      });

      // ── Core animations (all pages) ──
      _genericReveals();
      _sectionDividers();
      _sectionHeaderSplit();
      _footerReveal();
      _magneticButtons();

      // Determine which page is currently active so we only create
      // ScrollTriggers on visible elements (hidden elements have zero
      // dimensions and cause incorrect position calculations).
      const _activePage = window.currentRoute || 'home';

      // ── Home page animations ──
      if (_activePage === 'home' && typeof _initHomeAnimations === 'function') {
        _initHomeAnimations();
      }

      // ── Sub-page animations ──
      if (_activePage !== 'home' && typeof _initSubpageAnimations === 'function') {
        _initSubpageAnimations();
      }

      // ── Defer the initial measurement until the page layout is stable ──
      _scheduleScrollRefresh({ waitForLoad: true });
    })
    .catch(function () {
      // GSAP never loaded — the safety-net in main.js handles visibility
    });
}

/* ═══════════════════════════════════════════════════════════
   Core animation modules (shared by all pages)
   ═══════════════════════════════════════════════════════════ */

// ── GENERIC REVEALS ──────────────────────────────────────
function _genericReveals() {
  function _skip(el) {
    return _isSpecific(el) || _isHeroChild(el) || _isCTAChild(el) || _isStoryBlock(el);
  }

  document.querySelectorAll('.reveal').forEach(function (el) {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', y: 10 },
      {
        clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.5, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el)
      }
    );
  });

  document.querySelectorAll('.reveal--left').forEach(function (el) {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', x: -14 },
      {
        clipPath: 'inset(0 0 0% 0)', x: 0, duration: 0.55, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el, '85%')
      }
    );
  });

  document.querySelectorAll('.reveal--right').forEach(function (el) {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', x: 14 },
      {
        clipPath: 'inset(0 0 0% 0)', x: 0, duration: 0.55, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el, '85%')
      }
    );
  });

  document.querySelectorAll('.reveal--scale').forEach(function (el) {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', scale: 0.97 },
      {
        clipPath: 'inset(0 0 0% 0)', scale: 1, duration: 0.5, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el)
      }
    );
  });
}

// ── SECTION DIVIDERS ─────────────────────────────────────
function _insertDividersIn(root) {
  if (!root) return;

  const children = Array.from(root.children).filter(function (el) {
    return !el.classList.contains('section-divider');
  });

  children.forEach(function (el, i) {
    if (i === 0) return;
    // Skip [data-page] wrapper divs — never insert between page containers
    if (el.hasAttribute('data-page')) return;
    const tag = el.tagName.toLowerCase();
    if (tag !== 'section' && tag !== 'div' && tag !== 'article' && tag !== 'aside') return;
    const prev = el.previousElementSibling;
    if (prev && prev.classList.contains('section-divider')) return;

    const div = document.createElement('div');
    div.className = 'section-divider';
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML =
      '<span class="section-divider__line section-divider__line--left"></span>' +
      '<span class="section-divider__dot"></span>' +
      '<span class="section-divider__line section-divider__line--right"></span>';
    root.insertBefore(div, el);
  });
}

function _sectionDividers() {
  // In SPA mode, insert dividers within each page container independently.
  const pageContainers = document.querySelectorAll('[data-page]');
  if (pageContainers.length) {
    pageContainers.forEach(function (page) {
      _insertDividersIn(page);
    });
    return;
  }
  // Fallback: operate on main directly
  _insertDividersIn(document.querySelector('main'));
}

// ── SECTION HEADER SPLIT ─────────────────────────────────
function _sectionHeaderSplit() {
  document.querySelectorAll('.section-header').forEach(function (header) {
    const label = header.querySelector('.label');
    const h2 = header.querySelector('h2');
    const p = header.querySelector('p');

    const targets = [label, h2, p].filter(Boolean);
    if (!targets.length) return;

    header.classList.remove('reveal');
    gsap.set(targets, { clipPath: 'inset(0 0 100% 0)' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: header, start: 'top 86%', once: true },
      defaults: { ease: 'power2.out', overwrite: 'auto' },
    });

    if (label) tl.fromTo(label, { clipPath: 'inset(0 0 100% 0)', y: 6 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.38 }, 0);
    if (h2) tl.fromTo(h2, { clipPath: 'inset(0 0 100% 0)', y: 8 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.5 }, 0.1);
    if (p) tl.fromTo(p, { clipPath: 'inset(0 0 100% 0)', y: 8 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.44 }, 0.22);
  });
}

// ── FOOTER REVEAL ────────────────────────────────────────
function _footerReveal() {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  const elements = footer.querySelectorAll('.footer__brand, .footer__col, .footer__bottom');
  if (!elements.length) return;

  // Initial state: hidden
  gsap.set(elements, { clipPath: 'inset(0 0 100% 0)' });

  let triggered = false;
  function trigger() {
    if (triggered) return;
    triggered = true;
    gsap.to(elements, {
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.61,
      stagger: 0.08,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }

  // Primary mechanism: ScrollTrigger
  ScrollTrigger.create({
    trigger: footer,
    start: 'top bottom',
    once: true,
    onEnter: trigger,
    onRefresh: function (self) {
      if (self.isActive && !triggered) trigger();
    }
  });

  // Safety net: if ScrollTrigger hasn't fired after page is fully loaded + 1.5s,
  // force the footer visible. Covers edge cases like very short pages.
  setTimeout(function () {
    if (!triggered) trigger();
  }, 1500);
}

// ── MAGNETIC BUTTONS ─────────────────────────────────────
function _magneticButtons() {
  if (!window.matchMedia('(hover: hover)').matches) return;

  const SEL = '.btn--primary, .btn--outline';
  let activeBtn = null; // track which button the mouse is currently inside

  document.addEventListener('mousemove', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const btn = e.target.closest(SEL);
    if (!btn) {
      // If the mouse left a magnetic button, spring it back
      if (activeBtn) {
        gsap.to(activeBtn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        activeBtn = null;
      }
      return;
    }
    activeBtn = btn;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  }, { passive: true });

  document.addEventListener('mouseout', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const btn = e.target.closest(SEL);
    if (!btn) return;
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    if (activeBtn === btn) activeBtn = null;
  }, { passive: true });
}
