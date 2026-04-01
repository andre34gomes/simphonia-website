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
var SECTION_SPECIFIC_SEL =
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
  var from = Object.assign({ clipPath: 'inset(0 0 100% 0)' }, fromVars);
  var to   = Object.assign({ clipPath: 'inset(0 0 0% 0)', overwrite: 'auto' }, tweenVars);
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
    var start = Date.now();
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
   PUBLIC: initAnimations()
   ─────────────────────────────────────────────────────────── */
var _animationsInitialized = false;

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

      // ── Home page animations ──
      if (typeof _initHomeAnimations === 'function') _initHomeAnimations();

      // ── Sub-page animations ──
      if (typeof _initSubpageAnimations === 'function') _initSubpageAnimations();

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

  document.querySelectorAll('.reveal').forEach(function(el) {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', y: 10 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.5, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el) }
    );
  });

  document.querySelectorAll('.reveal--left').forEach(function(el) {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', x: -14 },
      { clipPath: 'inset(0 0 0% 0)', x: 0, duration: 0.55, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el, '85%') }
    );
  });

  document.querySelectorAll('.reveal--right').forEach(function(el) {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', x: 14 },
      { clipPath: 'inset(0 0 0% 0)', x: 0, duration: 0.55, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el, '85%') }
    );
  });

  document.querySelectorAll('.reveal--scale').forEach(function(el) {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', scale: 0.97 },
      { clipPath: 'inset(0 0 0% 0)', scale: 1, duration: 0.5, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el) }
    );
  });
}

// ── SECTION DIVIDERS ─────────────────────────────────────
function _sectionDividers() {
  var main = document.querySelector('main');
  if (!main) return;

  var children = Array.from(main.children).filter(function(el) {
    return !el.classList.contains('section-divider');
  });

  children.forEach(function(el, i) {
    if (i === 0) return;
    var tag = el.tagName.toLowerCase();
    if (tag !== 'section' && tag !== 'div' && tag !== 'article' && tag !== 'aside') return;
    var prev = el.previousElementSibling;
    if (prev && prev.classList.contains('section-divider')) return;

    var div = document.createElement('div');
    div.className = 'section-divider';
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML =
      '<span class="section-divider__line section-divider__line--left"></span>' +
      '<span class="section-divider__dot"></span>' +
      '<span class="section-divider__line section-divider__line--right"></span>';
    main.insertBefore(div, el);
  });
}

// ── SECTION HEADER SPLIT ─────────────────────────────────
function _sectionHeaderSplit() {
  document.querySelectorAll('.section-header').forEach(function(header) {
    var label = header.querySelector('.label');
    var h2    = header.querySelector('h2');
    var p     = header.querySelector('p');

    var targets = [label, h2, p].filter(Boolean);
    if (!targets.length) return;

    header.classList.remove('reveal');
    gsap.set(targets, { clipPath: 'inset(0 0 100% 0)' });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: header, start: 'top 86%', once: true },
      defaults: { ease: 'power2.out', overwrite: 'auto' },
    });

    if (label) tl.fromTo(label, { clipPath: 'inset(0 0 100% 0)', y: 6 },
                                  { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.38 }, 0);
    if (h2)    tl.fromTo(h2,    { clipPath: 'inset(0 0 100% 0)', y: 8 },
                                  { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.5  }, 0.1);
    if (p)     tl.fromTo(p,     { clipPath: 'inset(0 0 100% 0)', y: 8 },
                                  { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.44 }, 0.22);
  });
}

// ── FOOTER REVEAL ────────────────────────────────────────
function _footerReveal() {
  var footer = document.querySelector('.footer');
  if (!footer) return;

  var brand  = footer.querySelector('.footer__brand');
  var cols   = footer.querySelectorAll('.footer__col');
  var bottom = footer.querySelector('.footer__bottom');

  var targets = [];
  if (brand) targets.push(brand);
  cols.forEach(function(c) { targets.push(c); });
  if (bottom) targets.push(bottom);
  if (!targets.length) return;

  var revealed = false;

  function forceShow() {
    if (revealed) return;
    revealed = true;
    targets.forEach(function(t) { t.style.clipPath = 'inset(0 0 0% 0)'; });
  }

  // Set the initial hidden state via JS (not CSS)
  gsap.set(targets, { clipPath: 'inset(0 0 100% 0)' });

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: footer,
      start: 'top 95%',
      once: true,
      onEnter: function() { revealed = true; },
    },
  });

  if (brand) {
    tl.to(brand,
      { clipPath: 'inset(0 0 0% 0)', duration: 0.48, ease: 'power2.out' }, 0);
  }
  if (cols.length) {
    tl.to(cols,
      { clipPath: 'inset(0 0 0% 0)', duration: 0.44, stagger: 0.07, ease: 'power2.out' }, 0.08);
  }
  if (bottom) {
    tl.to(bottom,
      { clipPath: 'inset(0 0 0% 0)', duration: 0.4, ease: 'power2.out' }, 0.26);
  }

  // Check after layout settles (window load) — footer might already be in view
  function checkAndReveal() {
    if (revealed) return;
    if (footer.getBoundingClientRect().top < window.innerHeight * 1.05) {
      revealed = true;
      tl.progress(1);
    }
  }

  checkAndReveal();
  if (document.readyState === 'complete') {
    setTimeout(checkAndReveal, 100);
  } else {
    window.addEventListener('load', function() { setTimeout(checkAndReveal, 100); }, { once: true });
  }

  // Absolute safety net: force footer visible after 2 seconds no matter what
  setTimeout(forceShow, 2000);
}

// ── MAGNETIC BUTTONS ─────────────────────────────────────
function _magneticButtons() {
  if (!window.matchMedia('(hover: hover)').matches) return;

  var SEL = '.btn--primary, .btn--outline';
  var activeBtn = null; // track which button the mouse is currently inside

  document.addEventListener('mousemove', function(e) {
    var btn = e.target.closest(SEL);
    if (!btn) {
      // If the mouse left a magnetic button, spring it back
      if (activeBtn) {
        gsap.to(activeBtn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        activeBtn = null;
      }
      return;
    }
    activeBtn = btn;
    var rect = btn.getBoundingClientRect();
    var x = e.clientX - rect.left - rect.width / 2;
    var y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  }, { passive: true });

  document.addEventListener('mouseout', function(e) {
    var btn = e.target.closest(SEL);
    if (!btn) return;
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    if (activeBtn === btn) activeBtn = null;
  }, { passive: true });
}

