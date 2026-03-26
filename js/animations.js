/**
 * Simphonia — GSAP Scroll Animations v5
 *
 * Complete refactor — fixes the ScrollTrigger.refresh() bug that was
 * consuming/swallowing the browser's first scroll event.
 *
 * Key changes from v4:
 *   - ScrollTrigger.refresh() is deferred until AFTER window "load" event
 *     (images & fonts settled → correct trigger positions, no swallowed scroll)
 *   - Replaced setTimeout poll with a proper "wait for libs" promise
 *   - ScrollTrigger.config uses ignoreMobileResize to avoid spurious refreshes
 *   - Double-rAF guarantees one full composite + paint before refresh
 */

/* ───────────────────────────────────────────────────────────
   Constants
   ─────────────────────────────────────────────────────────── */
var SECTION_SPECIFIC_SEL =
  '.feat-card, .step-card, .bento-item, ' +
  '.faq-item, .team-card, .value-card, .dest-card, .dest-grid-card, ' +
  '.feature-card, .section-header';

/* ───────────────────────────────────────────────────────────
   Helpers
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

/**
 * Delegate ScrollTrigger refresh scheduling to the shared scroll coordinator.
 * Fallback to a local double-rAF only if the shared layout layer isn't present.
 */
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

      // ── Set up all animations ──
      _hero();
      _genericReveals();
      _stepCards();
      _featureCards();
      _stickyShowcase();
      _faqItems();

      // Sub-page animations
      _subpageHeroParallax();
      _aboutStorySlideIn();
      _valueCards3D();
      _teamCardsStagger();
      _destCardsHover3D();
      _ctaSectionReveal();
      _sectionDividers();
      _howItWorksTimeline();
      _numberCountUp();

      // Enhanced animations
      // _phoneFloat(); // phone float disabled — static mockup with badge chips
      _footerReveal();
      _featCardIconPulse();
      _magneticButtons();

      // ── New in v6 ──
      _sectionHeaderSplit();

      _stepCardIconHover();
      _featCardRevealPulse();
      _ctaButtonEntrance();
      _numberCountUpFlash();

      // ── Defer the initial measurement until the page layout is stable ──
      _scheduleScrollRefresh({ waitForLoad: true });
    })
    .catch(function () {
      // GSAP never loaded — the safety-net in main.js handles visibility
    });
}

/* ═══════════════════════════════════════════════════════════
   Individual animation modules
   ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// 1. HERO
// ─────────────────────────────────────────────────────────
function _hero() {
  if (document.querySelector('.hero--v2')) {
    gsap.set([
      '.hero__h1 .line-1',
      '.hero__h1 .line-2',
    ], { clipPath: 'inset(0 0 100% 0)' });

    gsap.set([
      '.hero__desc',
      '.hero__actions',
      '.hero__trust-points',
    ], { autoAlpha: 0 });

    gsap.set('.iphone-mockup', { autoAlpha: 0, x: 50 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' } });

    tl
      .fromTo('.hero__h1 .line-1',
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.55 }, 0.1)
      .fromTo('.hero__h1 .line-2',
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.5  }, 0.38)
      .fromTo('.hero__desc',       { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5  }, 0.55)
      .fromTo('.hero__actions',    { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.65)
      .fromTo('.hero__trust-points', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.75)
      .to('.iphone-mockup',        { autoAlpha: 1, x: 0, duration: 1.0, ease: 'power2.out' }, 0.1);

    return;
  }

  // Skip fallback for sub-pages that have their own hero animation handler
  if (document.querySelector('.about-hero, .destinations-hero, .support-hero, .legal-hero')) {
    return;
  }

  const h1 = document.querySelector('h1');
  if (h1) {
    gsap.fromTo(h1,
      { autoAlpha: 0, y: 36 },
      { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.1, ease: 'power3.out' }
    );
  }
}

// ─────────────────────────────────────────────────────────
// 2. GENERIC REVEALS
// ─────────────────────────────────────────────────────────
function _genericReveals() {
  function _skip(el) {
    return _isSpecific(el) || _isHeroChild(el) || _isCTAChild(el) || _isStoryBlock(el);
  }

  document.querySelectorAll('.reveal').forEach(el => {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', y: 10 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.5, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el) }
    );
  });

  document.querySelectorAll('.reveal--left').forEach(el => {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', x: -14 },
      { clipPath: 'inset(0 0 0% 0)', x: 0, duration: 0.55, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el, '85%') }
    );
  });

  document.querySelectorAll('.reveal--right').forEach(el => {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', x: 14 },
      { clipPath: 'inset(0 0 0% 0)', x: 0, duration: 0.55, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el, '85%') }
    );
  });

  document.querySelectorAll('.reveal--scale').forEach(el => {
    if (_skip(el)) return;
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', scale: 0.97 },
      { clipPath: 'inset(0 0 0% 0)', scale: 1, duration: 0.5, ease: 'power2.out',
        overwrite: 'auto', scrollTrigger: _st(el) }
    );
  });
}

// ─────────────────────────────────────────────────────────
// 4. STEP CARDS
// ─────────────────────────────────────────────────────────
function _stepCards() {
  _batchReveal('.step-card',
    { y: 16 },
    { y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 },
    3
  );
}

// ─────────────────────────────────────────────────────────
// 5. FEATURE CARDS
// ─────────────────────────────────────────────────────────
function _featureCards() {
  _batchReveal('.feat-card',
    { y: 12 },
    { y: 0, duration: 0.48, ease: 'power2.out', stagger: 0.08 },
    3
  );
  _batchReveal('.feature-card',
    { y: 12 },
    { y: 0, duration: 0.48, ease: 'power2.out', stagger: 0.09 },
    3
  );
}

// ─────────────────────────────────────────────────────────
// 7. STICKY SHOWCASE — GSAP pin + Apple-style cross-fade panels
// ─────────────────────────────────────────────────────────
function _stickyShowcase() {
  var section = document.querySelector('.showcase-sticky');
  if (!section) return;

  var scene   = section.querySelector('.showcase-sticky__scene');
  var stage   = document.getElementById('showcasePanelsStage');
  var segsEl  = document.getElementById('showcaseSegments');
  if (!scene || !stage) return;

  var panels     = stage.querySelectorAll('.showcase-sticky__panel');
  var panelCount = panels.length;
  if (!panelCount) return;

  /* Vertical layout on narrow viewports is handled by CSS only —
     always use the pinned GSAP showcase so animations are preserved. */
  // var isCompactViewport = window.innerWidth < 1024;

  /* ── Build segment fill bars ── */
  var segFills = [];
  if (segsEl) {
    segsEl.querySelectorAll('.showcase-segment').forEach(function(seg) {
      var fill = document.createElement('div');
      fill.className = 'showcase-segment__fill';
      seg.appendChild(fill);
      segFills.push(fill);
    });
  }

  /* ── Stack all panels absolute + hidden ── */
  panels.forEach(function(p) {
    gsap.set(p, { position: 'absolute', opacity: 0, y: 40 });
  });

  var lastActive = -1;
  var screens    = section.querySelectorAll('.sas-screen');

  function showScreen(newIdx) {
    if (!screens.length || newIdx === lastActive || !screens[newIdx]) return;

    screens.forEach(function (screen, i) {
      gsap.killTweensOf(screen);
      if (i !== newIdx) {
        gsap.to(screen, {
          opacity: 0,
          duration: 0.28,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        screen.style.pointerEvents = 'none';
      }
    });

    gsap.fromTo(screens[newIdx],
      { opacity: Number(gsap.getProperty(screens[newIdx], 'opacity')) || 0 },
      {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      }
    );
    screens[newIdx].style.pointerEvents = 'auto';
    lastActive = newIdx;
  }

  function setupCompactShowcase() {
    if (segsEl) {
      segsEl.querySelectorAll('.showcase-segment__fill').forEach(function (fill) {
        fill.remove();
      });
    }

    screens.forEach(function (screen, i) {
      gsap.set(screen, { opacity: i === 0 ? 1 : 0, scale: 1, y: 0 });
      screen.style.pointerEvents = i === 0 ? 'auto' : 'none';
    });
    lastActive = 0;

    panels.forEach(function (panel, idx) {
      var ghostNum = panel.querySelector('.showcase-panel__ghost-num');
      var meta     = panel.querySelector('.showcase-panel__meta');
      var title    = panel.querySelector('.showcase-panel__title');
      var desc     = panel.querySelector('.showcase-panel__desc');

      if (ghostNum) {
        gsap.fromTo(ghostNum,
          { opacity: 0, x: 24 },
          {
            opacity: 0.045,
            x: 0,
            duration: 0.7,
            ease: 'power3.out',
            overwrite: 'auto',
            scrollTrigger: { trigger: panel, start: 'top 88%', once: true },
          }
        );
      }

      if (meta) {
        gsap.fromTo(meta,
          { clipPath: 'inset(0 0 100% 0)', y: 8 },
          {
            clipPath: 'inset(0 0 0% 0)',
            y: 0,
            duration: 0.38,
            ease: 'power2.out',
            overwrite: 'auto',
            scrollTrigger: { trigger: panel, start: 'top 88%', once: true },
          }
        );
      }

      if (title) {
        gsap.fromTo(title,
          { clipPath: 'inset(0 0 100% 0)', y: 10 },
          {
            clipPath: 'inset(0 0 0% 0)',
            y: 0,
            duration: 0.52,
            ease: 'power2.out',
            overwrite: 'auto',
            scrollTrigger: { trigger: panel, start: 'top 86%', once: true },
          }
        );
      }

      if (desc) {
        gsap.fromTo(desc,
          { clipPath: 'inset(0 0 100% 0)', y: 8 },
          {
            clipPath: 'inset(0 0 0% 0)',
            y: 0,
            duration: 0.44,
            ease: 'power2.out',
            overwrite: 'auto',
            scrollTrigger: { trigger: panel, start: 'top 84%', once: true },
          }
        );
      }

      ScrollTrigger.create({
        trigger: panel,
        start: 'top center',
        end: 'bottom center',
        onEnter: function () { showScreen(idx); },
        onEnterBack: function () { showScreen(idx); },
      });
    });
  }

  /* Compact (non-animated) showcase is no longer used —
     vertical layout with animations is handled by the CSS media queries.
  if (isCompactViewport) {
    setupCompactShowcase();
    return;
  }
  */

  /* ── Transition between panels + phone screens ── */
  function transitionTo(newIdx, prevIdx) {
    var forward = newIdx > prevIdx;
    var panelDelay = prevIdx >= 0 ? 0.1 : 0;

    /* ─── FAST-SCROLL GUARD: kill every in-flight tween on all panels/screens,
           then instantly zero-out anything that is neither the outgoing nor
           incoming slot.  This prevents overlap when the user scrolls through
           multiple steps faster than a single transition can complete. ─── */
    panels.forEach(function (p, i) {
      gsap.killTweensOf(p);
      /* Also kill tweens on inner elements */
      var ghost = p.querySelector('.showcase-panel__ghost-num');
      var meta  = p.querySelector('.showcase-panel__meta');
      var ttl   = p.querySelector('.showcase-panel__title');
      var dsc   = p.querySelector('.showcase-panel__desc');
      [ghost, meta, ttl, dsc].forEach(function (el) { if (el) gsap.killTweensOf(el); });

      if (i !== newIdx && i !== prevIdx) {
        gsap.set(p, { opacity: 0, y: 0, scale: 1 });
      }
    });
    screens.forEach(function (s, i) {
      gsap.killTweensOf(s);
      if (i !== newIdx) {
        gsap.set(s, { opacity: 0, scale: 1, y: 0 });
        s.style.pointerEvents = 'none';
      }
    });

    /* ─── Outgoing panel: scale down + slide out ─── */
    if (prevIdx >= 0 && panels[prevIdx]) {
      gsap.to(panels[prevIdx], {
        opacity:  0,
        y:        forward ? -60 : 60,
        scale:    0.92,
        duration: 0.42,
        ease:     'power3.in',
        onComplete: function () {
          gsap.set(panels[prevIdx], { scale: 1, y: 0 });
        },
      });
    }

    /* ─── Prep incoming panel inner elements ─── */
    var ghostNum = panels[newIdx].querySelector('.showcase-panel__ghost-num');
    var meta     = panels[newIdx].querySelector('.showcase-panel__meta');
    var title    = panels[newIdx].querySelector('.showcase-panel__title');
    var desc     = panels[newIdx].querySelector('.showcase-panel__desc');

    var fromY = forward ? 68 : -68;
    if (prevIdx < 0) fromY = 28;

    gsap.set(panels[newIdx], { y: fromY, scale: 0.95 });
    if (ghostNum) gsap.set(ghostNum, { opacity: 0, x: forward ? 36 : -36 });
    if (meta)     gsap.set(meta,     { opacity: 0, y: forward ? 14 : -14 });
    if (title)    gsap.set(title,    { opacity: 0, y: forward ? 24 : -24 });
    if (desc)     gsap.set(desc,     { opacity: 0, y: forward ? 20 : -20 });

    /* ─── Animate panel in ─── */
    gsap.to(panels[newIdx], {
      opacity:  1,
      y:        0,
      scale:    1,
      duration: 0.72,
      delay:    panelDelay,
      ease:     'expo.out',
    });

    /* ─── Stagger inner elements ─── */
    var eD = panelDelay + 0.08;
    if (ghostNum) gsap.to(ghostNum, { opacity: 0.045, x: 0, duration: 0.85, delay: eD,        ease: 'expo.out' });
    if (meta)     gsap.to(meta,     { opacity: 1,     y: 0, duration: 0.5,  delay: eD + 0.04, ease: 'power3.out' });
    if (title)    gsap.to(title,    { opacity: 1,     y: 0, duration: 0.72, delay: eD + 0.10, ease: 'expo.out' });
    if (desc)     gsap.to(desc,     { opacity: 1,     y: 0, duration: 0.65, delay: eD + 0.18, ease: 'power3.out' });

    /* ─── Phone screens: plain opacity cross-fade (no movement) ─── */
    if (screens.length) {
      gsap.fromTo(screens[newIdx],
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.55,
          delay: prevIdx >= 0 ? 0.15 : 0,
          ease: 'power2.out',
        }
      );
      screens[newIdx].style.pointerEvents = 'auto';
    }
  }

  /* ── Live-scrub segment fills ── */
  function updateSegs(progress) {
    /* Clamp against sub-zero / over-one values GSAP can emit at edges */
    var p      = Math.min(Math.max(progress, 0), 1);
    var raw    = p * panelCount;
    var active = Math.min(Math.floor(raw), panelCount - 1);
    /* frac: how far into the current panel's dwell range (0 → 1).
       raw - active rises naturally from 0 to 1 for every panel,
       including the last one — no special-casing needed.
       Math.min(..., 1) handles the progress === 1.0 boundary where
       raw === panelCount exactly. */
    var frac   = Math.min(raw - active, 1);
    segFills.forEach(function (fill, i) {
      fill.style.width = i < active   ? '100%'
                       : i === active ? (frac * 100).toFixed(1) + '%'
                       : '0%';
    });
  }

  /* ── Setup: measure + create ScrollTrigger ── */
  function setup() {
    /* Measure tallest panel so the stage never collapses */
    var maxH = 0;
    panels.forEach(function(p) {
      gsap.set(p, { position: 'relative', opacity: 1, y: 0 });
      maxH = Math.max(maxH, p.offsetHeight);
      gsap.set(p, { position: 'absolute', opacity: 0, y: 40 });
    });
    /* On desktop, set a fixed min-height so absolute panels don't collapse the stage.
       On ≤1024 px the stage uses flex:1 inside a stretched grid, so skip the inline value. */
    if (maxH && window.innerWidth > 1024) {
      stage.style.minHeight = (maxH + 24) + 'px';
    }

    /* Hide all phone screens; screen 0 shown with first panel */
    if (screens.length) {
      screens.forEach(function(s, i) {
        gsap.set(s, { opacity: i === 0 ? 1 : 0, scale: 1, y: 0 });
        s.style.pointerEvents = i === 0 ? 'auto' : 'none';
      });
    }

    /* Show first panel instantly — no startup animation */
    gsap.set(panels[0], { opacity: 1, y: 0, scale: 1 });
    var g0 = panels[0].querySelector('.showcase-panel__ghost-num');
    var m0 = panels[0].querySelector('.showcase-panel__meta');
    var t0 = panels[0].querySelector('.showcase-panel__title');
    var d0 = panels[0].querySelector('.showcase-panel__desc');
    if (g0) gsap.set(g0, { opacity: 0.045, x: 0 });
    if (m0) gsap.set(m0, { opacity: 1, y: 0 });
    if (t0) gsap.set(t0, { opacity: 1, y: 0 });
    if (d0) gsap.set(d0, { opacity: 1, y: 0 });

    lastActive = 0;
    updateSegs(0);

    /*
     *  GSAP pins the scene to the viewport.
     *  Each panel owns one viewport-height of scroll dwell time.
     *  onUpdate fires on every tick — used for both panel switching
     *  (threshold) and segment fill (continuous scrub).
     */
    ScrollTrigger.create({
      trigger      : scene,
      start        : 'top top',
      end          : '+=' + ((panelCount - 1) * window.innerHeight),
      pin          : true,
      pinSpacing   : true,
      anticipatePin: 1,
      onUpdate     : function(self) {
        var p   = self.progress;
        var idx = Math.min(Math.floor(p * panelCount), panelCount - 1);

        if (idx !== lastActive) {
          var prev = lastActive;
          lastActive = idx;
          transitionTo(idx, prev);
        }

        updateSegs(p);
      },
      /* Mark complete the first time the user scrolls all the way through */
      onLeave: function() {
        window.showcaseScrollComplete = true;
      },
      /* Fire the download highlight as the user scrolls back up toward the hero
         — 300 ms delay so the animation lands right as the buttons come into view */
      onLeaveBack: function() {
        if (window.showcaseScrollComplete && typeof window.highlightDownloadBtns === 'function') {
          setTimeout(window.highlightDownloadBtns, 300);
        }
      },
    });
  }

  if (document.readyState === 'complete') {
    setup();
  } else {
    window.addEventListener('load', setup, { once: true });
  }
}

/* _updateShowcaseCounter kept as no-op for safety */
function _updateShowcaseCounter() {}

// (No _heroParallax function — removed in v5, phone mockup is now static/clickable)

// ─────────────────────────────────────────────────────────
// 10. FAQ ITEMS
// ─────────────────────────────────────────────────────────
function _faqItems() {
  const list = document.querySelector('.faq-list');
  if (!list) return;

  gsap.fromTo(
    list.querySelectorAll('.faq-item'),
    { clipPath: 'inset(0 0 100% 0)', y: 8 },
    {
      clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.42, stagger: 0.07,
      ease: 'power2.out', overwrite: 'auto',
      scrollTrigger: { trigger: list, start: 'top 82%', once: true },
    }
  );
}

// ─────────────────────────────────────────────────────────
// 12. SUB-PAGE HERO PARALLAX — parallax depth on about/dest/support heroes
// ─────────────────────────────────────────────────────────
function _subpageHeroParallax() {
  var heroes = document.querySelectorAll('.about-hero, .destinations-hero, .support-hero, .legal-hero');
  heroes.forEach(function(hero) {
    var h1 = hero.querySelector('h1');
    var p = hero.querySelector('p');
    var label = hero.querySelector('.label');

    // Clip-path wipe for the eyebrow label and headline — they reveal, not load
    if (label) {
      gsap.fromTo(label,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.4, delay: 0.1, ease: 'power2.out' }
      );
    }
    if (h1) {
      gsap.fromTo(h1,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.52, delay: 0.18, ease: 'power2.out' }
      );
    }
    // Secondary elements use a short fade (not scroll-triggered, just page load)
    if (p) {
      gsap.fromTo(p,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.32, ease: 'power3.out' }
      );
    }

    // Search bar & filter tabs (destinations page)
    var searchBar = hero.querySelector('.search-bar');
    if (searchBar) {
      gsap.fromTo(searchBar,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.5, ease: 'power3.out' }
      );
    }
    var filterTabs = hero.querySelector('.filter-tabs');
    if (filterTabs) {
      gsap.fromTo(filterTabs,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.6, ease: 'power3.out' }
      );
    }

    // Scroll indicator — fades in last, after hero text settles
    var scrollIndicator = hero.querySelector('.hero__scroll');
    if (scrollIndicator) {
      gsap.fromTo(scrollIndicator,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.65, ease: 'power3.out' }
      );
    }
  });
}

// ─────────────────────────────────────────────────────────
// 13. ABOUT STORY SLIDE-IN — alternate left/right slide with 3D rotation
// ─────────────────────────────────────────────────────────
function _aboutStorySlideIn() {
  var stories = document.querySelectorAll('.about-story');
  if (!stories.length) return;

  stories.forEach(function(story, i) {
    // Remove the CSS visibility:hidden that comes from the .reveal class
    story.classList.remove('reveal');

    var img = story.querySelector('.about-story__img');
    // Find the text sibling regardless of DOM order (img can be first or second child)
    var textBlock = Array.from(story.children).find(function(c) { return c !== img; });
    var isEven = i % 2 === 0;

    if (img) {
      gsap.fromTo(img,
        { autoAlpha: 0, x: isEven ? -80 : 80, rotateY: isEven ? -8 : 8, scale: 0.92 },
        {
          autoAlpha: 1, x: 0, rotateY: 0, scale: 1,
          duration: 1.1, ease: 'power3.out', overwrite: 'auto',
          scrollTrigger: { trigger: story, start: 'top 80%', once: true },
        }
      );
    }
    if (textBlock && textBlock !== img) {
      gsap.fromTo(textBlock,
        { autoAlpha: 0, x: isEven ? 60 : -60, y: 20 },
        {
          autoAlpha: 1, x: 0, y: 0,
          duration: 1, ease: 'power3.out', delay: 0.15, overwrite: 'auto',
          scrollTrigger: { trigger: story, start: 'top 80%', once: true },
        }
      );
    }

    // Parallax on scroll after reveal
    if (img) {
      gsap.to(img, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: story,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
      });
    }
  });
}

// ─────────────────────────────────────────────────────────
// 14. VALUE CARDS — 3D tilt + staggered scale-up reveal
// ─────────────────────────────────────────────────────────
function _valueCards3D() {
  var cards = document.querySelectorAll('.value-card');
  if (!cards.length) return;

  // Strip .reveal so the CSS clip-path pre-state doesn't hide these cards —
  // this function owns the reveal, not _genericReveals().
  cards.forEach(function(card) { card.classList.remove('reveal'); });
  gsap.set(cards, { autoAlpha: 0 });

  ScrollTrigger.batch(cards, {
    batchMax: 4,
    onEnter: function(batch) {
      gsap.fromTo(batch,
        { autoAlpha: 0, y: 28, rotateX: 5 },
        {
          autoAlpha: 1, y: 0, rotateX: 0,
          duration: 0.7, stagger: 0.1,
          ease: 'back.out(1.4)', overwrite: 'auto',
        }
      );
    },
    start: 'top 85%',
    once: true,
  });

  // Interactive 3D tilt on hover
  cards.forEach(function(card) {
    card.style.transformStyle = 'preserve-3d';
    card.style.perspective = '800px';

    card.addEventListener('mouseenter', function() {
      gsap.to(card, { scale: 1.04, duration: 0.3, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', function() {
      gsap.to(card, { scale: 1, rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotateY: x * 12,
        rotateX: -y * 12,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
  });
}

// ─────────────────────────────────────────────────────────
// 15. TEAM CARDS — cascade stagger from center outward
// ─────────────────────────────────────────────────────────
function _teamCardsStagger() {
  var cards = document.querySelectorAll('.team-card');
  if (!cards.length) return;

  cards.forEach(function(card) { card.classList.remove('reveal'); });
  gsap.set(cards, { autoAlpha: 0 });

  ScrollTrigger.batch(cards, {
    batchMax: 4,
    onEnter: function(batch) {
      gsap.fromTo(batch,
        { autoAlpha: 0, y: 22, rotateY: -10 },
        {
          autoAlpha: 1, y: 0, rotateY: 0,
          duration: 0.65, stagger: 0.09,
          ease: 'back.out(1.6)', overwrite: 'auto',
        }
      );
    },
    start: 'top 85%',
    once: true,
  });
}

// ─────────────────────────────────────────────────────────
// 16. DESTINATION CARDS — 3D perspective reveal on scroll
// ─────────────────────────────────────────────────────────
function _destCardsHover3D() {
  var cards = document.querySelectorAll('.dest-card, .dest-grid-card');
  if (!cards.length) return;

  cards.forEach(function(card) {
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mouseenter', function() {
      gsap.to(card, { scale: 1.03, y: -6, duration: 0.35, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', function() {
      gsap.to(card, { scale: 1, y: 0, rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotateY: x * 10,
        rotateX: -y * 8,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
  });
}

// ─────────────────────────────────────────────────────────
// 17. CTA SECTION — dramatic scale-up reveal with glow pulse
// ─────────────────────────────────────────────────────────
function _ctaSectionReveal() {
  var ctas = document.querySelectorAll('.cta-section');
  ctas.forEach(function(cta) {
    var inner = cta.querySelector('.container');
    if (!inner) return;

    // Also grab any .reveal children so they don't stay invisible
    var revealChildren = inner.querySelectorAll('.reveal, .reveal--scale');

    gsap.fromTo(inner,
      { clipPath: 'inset(0 0 100% 0)', y: 12 },
      {
        clipPath: 'inset(0 0 0% 0)', y: 0,
        duration: 0.6, ease: 'power2.out', overwrite: 'auto',
        scrollTrigger: { trigger: cta, start: 'top 82%', once: true },
        onStart: function() {
          // Immediately make inner reveal children visible
          // (they were skipped by _genericReveals via _isCTAChild)
          revealChildren.forEach(function(child) {
            gsap.set(child, { clipPath: 'none', y: 0 });
          });
        },
      }
    );
  });
}

// ─────────────────────────────────────────────────────────
// 19. SECTION DIVIDERS — inject between sections + animate
//     Diamond dot appears first, then gradient lines grow
//     outward from center. Applied to every section transition
//     on every page — no exclusions.
// ─────────────────────────────────────────────────────────
function _sectionDividers() {
  var main = document.querySelector('main');
  if (!main) return;

  // Inject a static divider before every section except the hero (index 0).
  // Guards:
  //  1. Filter out elements that are already section-dividers from the walk.
  //  2. Skip any element whose immediate previous sibling is already a divider
  //     — prevents double-injection if this function ever runs more than once.
  var children = Array.from(main.children).filter(function(el) {
    return !el.classList.contains('section-divider');
  });

  children.forEach(function(el, i) {
    if (i === 0) return;
    // Only inject before actual content elements — never before <script>, <style>, etc.
    var tag = el.tagName.toLowerCase();
    if (tag !== 'section' && tag !== 'div' && tag !== 'article' && tag !== 'aside') return;
    // Belt-and-suspenders: skip if a divider is already sitting right before this element
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

// ─────────────────────────────────────────────────────────
// 19b. HOW-IT-WORKS TIMELINE — track scrub + node + card reveals
// ─────────────────────────────────────────────────────────
function _howItWorksTimeline() {
  var track = document.querySelector('.timeline__track');
  if (!track) return; // only runs on the how-it-works page

  // Track grows top-to-bottom as user scrolls through the section
  gsap.fromTo(track,
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      transformOrigin: 'top center',
      scrollTrigger: {
        trigger: '#steps-timeline',
        start: 'top 75%',
        end: 'bottom 40%',
        scrub: 1.2,
      },
    }
  );

  // Nodes scale in one by one
  document.querySelectorAll('.timeline__node').forEach(function(node) {
    gsap.fromTo(node,
      { scale: 0, autoAlpha: 0 },
      {
        scale: 1, autoAlpha: 1,
        duration: 0.55,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: node, start: 'top 82%', once: true },
      }
    );
  });

  // Left cards slide in from the left
  document.querySelectorAll('.timeline__step--left .timeline__card').forEach(function(card) {
    gsap.fromTo(card,
      { autoAlpha: 0, x: -70 },
      {
        autoAlpha: 1, x: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 80%', once: true },
      }
    );
  });

  // Right cards slide in from the right
  document.querySelectorAll('.timeline__step--right .timeline__card').forEach(function(card) {
    gsap.fromTo(card,
      { autoAlpha: 0, x: 70 },
      {
        autoAlpha: 1, x: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 80%', once: true },
      }
    );
  });
}

// ─────────────────────────────────────────────────────────
// 20. NUMBER COUNT UP — for about page impact numbers
// ─────────────────────────────────────────────────────────
function _numberCountUp() {
  var numEls = document.querySelectorAll('[data-count-up]');
  if (!numEls.length) return;

  numEls.forEach(function(el) {
    var target = parseFloat(el.dataset.countUp);
    var suffix = el.dataset.suffix || '';
    var decimals = target % 1 !== 0 ? 1 : 0;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: function() {
        var obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: function() {
            el.textContent = obj.val.toFixed(decimals) + suffix;
          },
          onComplete: function() {
            el.textContent = target.toFixed(decimals) + suffix;
          },
        });
      },
    });
  });
}


// ─────────────────────────────────────────────────────────
// 23. PHONE FLOAT — activate floating animation after hero entrance
// ─────────────────────────────────────────────────────────
function _phoneFloat() {
  var phone = document.querySelector('.iphone-mockup');
  if (!phone || !document.querySelector('.hero--v2')) return;

  // Wait for the hero entrance animation to finish, then add float class
  setTimeout(function() {
    phone.classList.add('is-floating');
  }, 2200);
}

// ─────────────────────────────────────────────────────────
// 24. FOOTER REVEAL — staggered fade-in for footer sections
// ─────────────────────────────────────────────────────────
function _footerReveal() {
  var footer = document.querySelector('.footer');
  if (!footer) return;

  var brand  = footer.querySelector('.footer__brand');
  var cols   = footer.querySelectorAll('.footer__col');
  var bottom = footer.querySelector('.footer__bottom');

  // Collect all targets that exist
  var targets = [];
  if (brand) targets.push(brand);
  cols.forEach(function(c) { targets.push(c); });
  if (bottom) targets.push(bottom);
  if (!targets.length) return;

  // Single coordinated timeline triggered once
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: footer,
      start: 'top 90%',
      once: true,
    },
  });

  if (brand) {
    tl.fromTo(brand,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 0.48, ease: 'power2.out' },
      0
    );
  }

  if (cols.length) {
    tl.fromTo(cols,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 0.44, stagger: 0.07, ease: 'power2.out' },
      0.08
    );
  }

  if (bottom) {
    tl.fromTo(bottom,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 0.4, ease: 'power2.out' },
      0.26
    );
  }
}

// ─────────────────────────────────────────────────────────
// 27. FEATURE CARD ICON PULSE — glow animation on scroll enter
// ─────────────────────────────────────────────────────────
function _featCardIconPulse() {
  var icons = document.querySelectorAll('.feat-card__icon');
  if (!icons.length) return;

  icons.forEach(function(icon) {
    gsap.fromTo(icon,
      { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0)' },
      {
        boxShadow: '0 0 24px 4px rgba(212, 175, 55, 0.2)',
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: icon, start: 'top 85%', once: true },
        onComplete: function() {
          // Pulse back to subtle
          gsap.to(icon, {
            boxShadow: '0 0 12px 0 rgba(212, 175, 55, 0.08)',
            duration: 1,
            ease: 'power2.inOut',
          });
        },
      }
    );
  });
}

// ─────────────────────────────────────────────────────────
// 28. MAGNETIC BUTTONS — subtle pull-toward-cursor on hover
// ─────────────────────────────────────────────────────────
function _magneticButtons() {
  if (!window.matchMedia('(hover: hover)').matches) return;

  var btns = document.querySelectorAll('.btn--primary, .btn--outline');
  btns.forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * 0.15,
        y: y * 0.15,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
    btn.addEventListener('mouseleave', function() {
      gsap.to(btn, {
        x: 0, y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
      });
    });
  });
}

// ─────────────────────────────────────────────────────────
// 29. SECTION HEADER SPLIT — stagger label → h2 → p separately
//     Skips section-headers from generic .reveal handling
// ─────────────────────────────────────────────────────────
function _sectionHeaderSplit() {
  document.querySelectorAll('.section-header').forEach(function(header) {
    var label = header.querySelector('.label');
    var h2    = header.querySelector('h2');
    var p     = header.querySelector('p');

    var targets = [label, h2, p].filter(Boolean);
    if (!targets.length) return;

    // Remove the generic .reveal class so _genericReveals doesn't also grab it
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

// ─────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────
// 32. STEP CARD ICON HOVER — GSAP spring bounce on mouseenter
// ─────────────────────────────────────────────────────────
function _stepCardIconHover() {
  if (!window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll('.step-card').forEach(function(card) {
    var icon = card.querySelector('.step-card__icon');
    if (!icon) return;

    card.addEventListener('mouseenter', function() {
      gsap.fromTo(icon,
        { y: 0, scale: 1 },
        { y: -6, scale: 1.1, duration: 0.25, ease: 'power2.out',
          onComplete: function() {
            gsap.to(icon, { y: 0, scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' });
          }
        }
      );
    });
  });
}

// ─────────────────────────────────────────────────────────
// 33. SHOWCASE PHONE TILT — disabled (phone is static)
// ─────────────────────────────────────────────────────────
function _showcasePhoneTilt() {}

// ─────────────────────────────────────────────────────────
// 34. FEAT CARD REVEAL PULSE — adds a CSS class on reveal onComplete
// ─────────────────────────────────────────────────────────
function _featCardRevealPulse() {
  document.querySelectorAll('.feat-card').forEach(function(card) {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 88%',
      once: true,
      onEnter: function() {
        setTimeout(function() {
          card.classList.add('pulse-reveal');
          card.addEventListener('animationend', function onEnd() {
            card.classList.remove('pulse-reveal');
            card.removeEventListener('animationend', onEnd);
          });
        }, 350);
      },
    });
  });
}

// ─────────────────────────────────────────────────────────
// 35. CTA BUTTON ENTRANCE — buttons in CTA section spring in
// ─────────────────────────────────────────────────────────
function _ctaButtonEntrance() {
  document.querySelectorAll('.cta-section .btn').forEach(function(btn, i) {
    gsap.fromTo(btn,
      { clipPath: 'inset(0 0 100% 0)', y: 10 },
      {
        clipPath: 'inset(0 0 0% 0)', y: 0,
        duration: 0.48,
        delay: 0.1 + i * 0.1,
        ease: 'power2.out',
        overwrite: 'auto',
        scrollTrigger: { trigger: btn, start: 'top 88%', once: true },
      }
    );
  });
}

// ─────────────────────────────────────────────────────────
// 36. NUMBER COUNT-UP FLASH — adds .counted CSS class after counting
// ─────────────────────────────────────────────────────────
function _numberCountUpFlash() {
  document.querySelectorAll('[data-count-up]').forEach(function(el) {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: function() {
        el.classList.add('counted');
        el.addEventListener('animationend', function onEnd() {
          el.classList.remove('counted');
          el.removeEventListener('animationend', onEnd);
        });
      },
    });
  });
}

