/**
 * Simphonia — Homepage Animations
 *
 * Contains: hero entrance, step cards, feature cards, sticky showcase,
 * FAQ items, feature icon pulse, step icon hover, CTA button entrance.
 *
 * Only runs on the homepage (index.html). Called by the orchestrator
 * in animations-core.js via the global _initHomeAnimations() hook.
 */

function _initHomeAnimations() {
  _hero();
  _stepCards();
  _featureCards();
  _stickyShowcase();
  _faqItems();
  _featCardIconPulse();
  _stepCardIconHover();
  _ctaButtonEntrance();
  _heroOrbParallax();
}

// ── 1. HERO ──────────────────────────────────────────────
function _hero() {
  // Skip fallback for sub-pages that have their own hero animation handler
  if (document.querySelector('.about-hero, .destinations-hero, .support-hero, .legal-hero')) {
    return;
  }

  // Homepage hero uses CSS `.hero-fade-up` keyframes (no GSAP needed).
  // Generic fallback: animate a bare h1 if no known hero section is found.
  if (!document.querySelector('.hero-postcard')) {
    var h1 = document.querySelector('h1');
    if (h1) {
      gsap.fromTo(h1,
        { autoAlpha: 0, y: 36 },
        { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.1, ease: 'power3.out' }
      );
    }
  }
}

// ── 4. STEP CARDS ────────────────────────────────────────
function _stepCards() {
  _batchReveal('.step-card',
    { y: 16 },
    { y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 },
    3
  );
}

// ── 5. FEATURE CARDS ─────────────────────────────────────
function _featureCards() {
  _batchReveal('.feat-card',
    { y: 12 },
    {
      y: 0, duration: 0.48, ease: 'power2.out', stagger: 0.08,
      onComplete: function () {
        this.targets().forEach(function (card) {
          setTimeout(function () {
            card.classList.add('pulse-reveal');
            card.addEventListener('animationend', function onEnd() {
              card.classList.remove('pulse-reveal');
              card.removeEventListener('animationend', onEnd);
            });
          }, 350);
        });
      }
    },
    3
  );
  _batchReveal('.feature-card',
    { y: 12 },
    { y: 0, duration: 0.48, ease: 'power2.out', stagger: 0.09 },
    3
  );
}

// ── 7. STICKY SHOWCASE ───────────────────────────────────
// Module-level handle so a re-initialisation can cancel the previous RAF loop.
var _segLerpCancelFn = null;

function _stickyShowcase() {
  // Cancel any LERP loop left running by a previous call (SPA re-navigation).
  if (_segLerpCancelFn) { _segLerpCancelFn(); _segLerpCancelFn = null; }

  var section = document.querySelector('.showcase-sticky');
  if (!section) return;

  var scene = section.querySelector('.showcase-sticky__scene');
  var stage = document.getElementById('showcasePanelsStage');
  var segsEl = document.getElementById('showcaseSegments');
  if (!scene || !stage) return;

  var panels = stage.querySelectorAll('.showcase-sticky__panel');
  var panelCount = panels.length;
  if (!panelCount) return;
  var lastIdx = panelCount - 1;

  var segFills = [];
  if (segsEl) {
    // Remove any stale fills left over from a previous initialisation (SPA re-navigation).
    segsEl.querySelectorAll('.showcase-segment__fill').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    segsEl.querySelectorAll('.showcase-segment').forEach(function (seg) {
      var fill = document.createElement('div');
      fill.className = 'showcase-segment__fill';
      seg.appendChild(fill);
      segFills.push(fill);
    });
  }

  panels.forEach(function (p) {
    gsap.set(p, { position: 'absolute', opacity: 0, y: 0 });
  });

  var lastActive = -1;
  var screens = section.querySelectorAll('.sas-screen');

  // Recalculate on resize so slide distances stay correct after orientation changes.
  var isMobileShowcase = window.innerWidth <= 960;
  var _resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(function () {
      isMobileShowcase = window.innerWidth <= 960;
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }, 250);
  }, { passive: true });

  var panelChildren = [];
  panels.forEach(function (p) {
    panelChildren.push({
      ghost: p.querySelector('.showcase-panel__ghost-num'),
      meta: p.querySelector('.showcase-panel__meta'),
      title: p.querySelector('.showcase-panel__title'),
      desc: p.querySelector('.showcase-panel__desc'),
    });
  });

  // ── Smooth segment progress via LERP ──
  var _segTarget = 0;
  var _segCurrent = 0;
  var _segRafId = null;

  // Expose a cancel handle so the next _stickyShowcase call (or resetAnimations)
  // can stop this loop without holding a reference to the full closure.
  _segLerpCancelFn = function () {
    if (_segRafId) { cancelAnimationFrame(_segRafId); _segRafId = null; }
  };

  function _segTick() {
    _segCurrent += (_segTarget - _segCurrent) * 0.08;
    if (Math.abs(_segTarget - _segCurrent) < 0.0005) _segCurrent = _segTarget;
    _renderSegs(_segCurrent);
    if (_segCurrent !== _segTarget) {
      _segRafId = requestAnimationFrame(_segTick);
    } else {
      _segRafId = null;
    }
  }

  function _renderSegs(p) {
    p = Math.min(Math.max(p, 0), 1);
    var raw = p * panelCount;
    var active = Math.min(Math.floor(raw), panelCount - 1);
    var frac = Math.min(raw - active, 1);
    for (var i = 0; i < segFills.length; i++) {
      segFills[i].style.width = i < active ? '100%'
        : i === active ? (frac * 100).toFixed(1) + '%'
          : '0%';
    }
  }

  function updateSegs(progress) {
    _segTarget = progress;
    if (!_segRafId) _segRafId = requestAnimationFrame(_segTick);
  }

  // Force-sync segments to an exact value (no LERP), used at boundaries
  function forceSegs(progress) {
    if (_segRafId) { cancelAnimationFrame(_segRafId); _segRafId = null; }
    _segTarget = _segCurrent = progress;
    _renderSegs(progress);
  }

  // ── Active timeline ──
  var _activeTl = null;

  // Hard-reset every panel + screen + child to idle state.
  function resetAll() {
    if (_activeTl) { _activeTl.kill(); _activeTl = null; }
    panels.forEach(function (p, i) {
      gsap.killTweensOf(p);
      gsap.set(p, { opacity: 0, y: 0 });
      var ch = panelChildren[i];
      if (ch.ghost) { gsap.killTweensOf(ch.ghost); gsap.set(ch.ghost, { opacity: 0, x: 0 }); }
      if (ch.meta)  { gsap.killTweensOf(ch.meta);  gsap.set(ch.meta,  { opacity: 0, y: 0 }); }
      if (ch.title) { gsap.killTweensOf(ch.title); gsap.set(ch.title, { opacity: 0, y: 0 }); }
      if (ch.desc)  { gsap.killTweensOf(ch.desc);  gsap.set(ch.desc,  { opacity: 0, y: 0 }); }
    });
    screens.forEach(function (s) {
      gsap.killTweensOf(s);
      gsap.set(s, { opacity: 0, y: 0 });
      s.style.pointerEvents = 'none';
    });
    lastActive = -1;
  }

  // Instantly snap a single panel + its screen to the fully-visible final state.
  function snapTo(idx) {
    resetAll();
    lastActive = idx;
    gsap.set(panels[idx], { opacity: 1, y: 0 });
    var ch = panelChildren[idx];
    if (ch.ghost) gsap.set(ch.ghost, { opacity: 0.045, x: 0 });
    if (ch.meta)  gsap.set(ch.meta,  { opacity: 1, y: 0 });
    if (ch.title) gsap.set(ch.title, { opacity: 1, y: 0 });
    if (ch.desc)  gsap.set(ch.desc,  { opacity: 1, y: 0 });
    if (screens[idx]) {
      gsap.set(screens[idx], { opacity: 1, y: 0 });
      screens[idx].style.pointerEvents = 'auto';
    }
  }

  function transitionTo(newIdx, prevIdx) {
    if (newIdx === lastActive) return;

    if (_activeTl) {
      _activeTl.kill();
      _activeTl = null;
    }

    // Thorough cleanup: kill all tweens, force every element to a known state.
    // This prevents orphaned intermediate values from killed timelines.
    panels.forEach(function (p, i) {
      gsap.killTweensOf(p);
      if (i === newIdx) return; // will be set up below
      if (i === prevIdx) {
        // Snap outgoing panel to fully-visible so exit animation starts cleanly
        gsap.set(p, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(p, { opacity: 0, y: 0 });
      var ch = panelChildren[i];
      if (ch.ghost) { gsap.killTweensOf(ch.ghost); gsap.set(ch.ghost, { opacity: 0, x: 0 }); }
      if (ch.meta)  { gsap.killTweensOf(ch.meta);  gsap.set(ch.meta,  { opacity: 0, y: 0 }); }
      if (ch.title) { gsap.killTweensOf(ch.title); gsap.set(ch.title, { opacity: 0, y: 0 }); }
      if (ch.desc)  { gsap.killTweensOf(ch.desc);  gsap.set(ch.desc,  { opacity: 0, y: 0 }); }
    });
    screens.forEach(function (s, i) {
      gsap.killTweensOf(s);
      if (i === newIdx) return;
      if (i === prevIdx) {
        gsap.set(s, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(s, { opacity: 0, y: 0 });
      s.style.pointerEvents = 'none';
    });

    lastActive = newIdx;

    var forward = newIdx > prevIdx;
    var isFirst = prevIdx < 0;

    // Slide distances — opacity + translateY only, no scale.
    // Subtler values for a smooth Apple-style feel.
    var slideOut    = isMobileShowcase ? 14 : 28;
    var slideIn     = isMobileShowcase ? 16 : 32;
    var firstSlide  = isMobileShowcase ? 8  : 14;
    var innerMeta   = isMobileShowcase ? 4  : 6;
    var innerTitle  = isMobileShowcase ? 6  : 10;
    var innerDesc   = isMobileShowcase ? 5  : 8;

    var tl = gsap.timeline({
      defaults: { force3D: true, overwrite: 'auto' },
    });

    // ── Outgoing panel (opacity + y only — no scale) ──
    if (prevIdx >= 0 && panels[prevIdx]) {
      (function (pi) {
        tl.to(panels[pi], {
          opacity: 0,
          y: forward ? -slideOut : slideOut,
          duration: 0.42,
          ease: 'power2.inOut',
          onComplete: function () { gsap.set(panels[pi], { y: 0 }); },
        }, 0);
      })(prevIdx);
    }

    // ── Outgoing phone screen (opacity + subtle y — smooth crossfade) ──
    if (prevIdx >= 0 && screens[prevIdx]) {
      (function (pi) {
        tl.to(screens[pi], {
          opacity: 0,
          y: forward ? -8 : 8,
          duration: 0.45,
          ease: 'power2.inOut',
          onComplete: function () {
            gsap.set(screens[pi], { y: 0 });
            screens[pi].style.pointerEvents = 'none';
          },
        }, 0);
      })(prevIdx);
    }

    // ── Incoming panel ──
    var ch = panelChildren[newIdx];
    var fromY = forward ? slideIn : -slideIn;
    if (isFirst) fromY = firstSlide;
    var panelStart = isFirst ? 0 : 0.06;

    gsap.set(panels[newIdx], { y: fromY, opacity: 0 });
    if (ch.ghost) gsap.set(ch.ghost, { opacity: 0, x: forward ? 18 : -18 });
    if (ch.meta)  gsap.set(ch.meta,  { opacity: 0, y: forward ? innerMeta : -innerMeta });
    if (ch.title) gsap.set(ch.title, { opacity: 0, y: forward ? innerTitle : -innerTitle });
    if (ch.desc)  gsap.set(ch.desc,  { opacity: 0, y: forward ? innerDesc : -innerDesc });

    tl.to(panels[newIdx], {
      opacity: 1, y: 0,
      duration: 0.5,
      ease: 'power3.out',
    }, panelStart);

    var stagger = panelStart + 0.03;
    if (ch.ghost) tl.to(ch.ghost, { opacity: 0.045, x: 0, duration: 0.6, ease: 'power3.out' }, stagger);
    if (ch.meta)  tl.to(ch.meta,  { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, stagger + 0.02);
    if (ch.title) tl.to(ch.title, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, stagger + 0.05);
    if (ch.desc)  tl.to(ch.desc,  { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, stagger + 0.10);

    // ── Incoming phone screen (opacity + subtle y — smooth crossfade) ──
    if (screens[newIdx]) {
      (function (ni) {
        tl.fromTo(screens[ni],
          { opacity: 0, y: forward ? 8 : -8 },
          {
            opacity: 1, y: 0,
            duration: 0.55,
            ease: 'power3.out',
            onStart: function () { screens[ni].style.pointerEvents = 'auto'; },
          },
          isFirst ? 0 : 0.15
        );
      })(newIdx);
    }

    _activeTl = tl;
  }

  function setup() {
    snapTo(0);
    forceSegs(0); // always start fills at 0 — guards against stale state on SPA re-navigation

    ScrollTrigger.create({
      trigger: section,
      pin: scene,
      pinSpacing: true,
      start: 'top top',
      end: '+=' + (panelCount * 100) + '%',
      scrub: 1.5,
      // No anticipatePin — it causes the pixel jump on enter/leave.
      // The pin transition is seamless without it when using transform-based pinning.

      onUpdate: function (self) {
        var p = self.progress;
        var idx = Math.min(Math.floor(p * panelCount), panelCount - 1);

        if (idx !== lastActive) {
          transitionTo(idx, lastActive);
        }

        updateSegs(p);
      },

      onEnter: function () {
        if (lastActive !== 0) {
          snapTo(0);
          forceSegs(0);
        }
      },

      onEnterBack: function () {
        if (lastActive !== lastIdx) {
          snapTo(lastIdx);
          forceSegs(1);
        }
      },

      onLeave: function () {
        snapTo(lastIdx);
        forceSegs(1);
        window.showcaseScrollComplete = true;
      },

      onLeaveBack: function () {
        snapTo(0);
        forceSegs(0);

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

  // ── Touch swipe: advance/retreat panels on mobile ──────────────────────────
  // Lets users swipe left/right on the showcase (text or phone area) instead
  // of having to scroll through 400dvh to see all four panels.
  // Only active on mobile (≤960px); passive listeners — no scroll interference.
  (function _addShowcaseSwipe() {
    if (!('ontouchstart' in window)) return;

    // Insert the swipe-hint element into the showcase left column
    var left = section.querySelector('.showcase-sticky__left');
    var hintEl = null;
    if (left) {
      hintEl = document.createElement('div');
      hintEl.className = 'showcase-swipe-hint';
      hintEl.setAttribute('aria-hidden', 'true');
      hintEl.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<path d="M5 12h14"/><path d="m15 7 5 5-5 5"/></svg>' +
        '<span>Swipe to navigate</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="transform:scaleX(-1)">' +
        '<path d="M5 12h14"/><path d="m15 7 5 5-5 5"/></svg>';
      left.appendChild(hintEl);
    }

    var swipeTarget = scene; // listen on the full scene area
    var startX = 0, startY = 0, startTime = 0;
    var SWIPE_MIN_PX = 45;       // minimum horizontal distance for a swipe
    var SWIPE_MAX_MS = 450;      // maximum duration for a swipe gesture
    var hintShown = false;
    var hintTimer = null;
    var showcaseST = null;      // filled in by setup() via the resize/scroll watcher

    // Retrieve the ST instance once it exists (created inside setup())
    function getShowcaseST() {
      if (showcaseST) return showcaseST;
      var all = typeof ScrollTrigger !== 'undefined' ? ScrollTrigger.getAll() : [];
      for (var i = 0; i < all.length; i++) {
        if (all[i].trigger === section) { showcaseST = all[i]; return showcaseST; }
      }
      return null;
    }

    function showHint() {
      if (!hintEl || hintShown) return;
      // Only show hint when the first panel is active (user just scrolled in)
      if (window.innerWidth > 960) return;
      hintShown = true;
      hintEl.classList.add('showcase-swipe-hint--visible');
      hintTimer = setTimeout(function () {
        hintEl.classList.remove('showcase-swipe-hint--visible');
        hintEl.classList.add('showcase-swipe-hint--hidden');
      }, 2800);
    }

    function hideHint() {
      if (!hintEl) return;
      clearTimeout(hintTimer);
      hintEl.classList.remove('showcase-swipe-hint--visible');
      hintEl.classList.add('showcase-swipe-hint--hidden');
    }

    swipeTarget.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });

    swipeTarget.addEventListener('touchend', function (e) {
      // Only active on mobile layout
      if (window.innerWidth > 960) return;

      var st = getShowcaseST();
      if (!st || typeof st.start !== 'number') return;

      var dx = e.changedTouches[0].clientX - startX;
      var dy = Math.abs(e.changedTouches[0].clientY - startY);
      var dt = Date.now() - startTime;

      // Require: clear horizontal dominance, minimum swipe distance, fast enough
      if (Math.abs(dx) < SWIPE_MIN_PX) return;
      if (dy > Math.abs(dx) * 0.6) return; // too vertical
      if (dt > SWIPE_MAX_MS) return;

      hideHint();

      var currentPanel = Math.max(0, lastActive < 0 ? 0 : lastActive);
      var targetPanel = dx < 0
        ? Math.min(currentPanel + 1, panelCount - 1)  // swipe left → next
        : Math.max(currentPanel - 1, 0);               // swipe right → prev

      if (targetPanel === currentPanel) return;

      // Scroll to the midpoint of the target panel's scroll range
      var span = st.end - st.start;
      var targetY = st.start + ((targetPanel + 0.5) / panelCount) * span;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }, { passive: true });

    // Show the hint when panel 0 first becomes active after entering showcase
    var _origTransitionTo = transitionTo;
    // Wrap transitionTo to detect the first entry into the showcase from outside
    // (panel -1 → 0) and show the swipe hint on mobile
    transitionTo = function (newIdx, prevIdx) {
      if (window.innerWidth <= 960 && prevIdx < 0 && newIdx === 0 && !hintShown) {
        setTimeout(showHint, 600);
      }
      _origTransitionTo(newIdx, prevIdx);
    };
  }());
}

// ── 10. FAQ ITEMS ────────────────────────────────────────
function _faqItems() {
  var list = document.querySelector('.faq-list');
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

// ── 27. FEATURE CARD ICON PULSE ──────────────────────────
function _featCardIconPulse() {
  var icons = document.querySelectorAll('.feat-card__icon');
  if (!icons.length) return;

  icons.forEach(function (icon) {
    gsap.fromTo(icon,
      { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0)' },
      {
        boxShadow: '0 0 24px 4px rgba(212, 175, 55, 0.2)',
        duration: 1.2, ease: 'power2.out',
        scrollTrigger: { trigger: icon, start: 'top 85%', once: true },
        onComplete: function () {
          gsap.to(icon, { boxShadow: '0 0 12px 0 rgba(212, 175, 55, 0.08)', duration: 1, ease: 'power2.inOut' });
        },
      }
    );
  });
}

// ── 32. STEP CARD ICON HOVER ─────────────────────────────
function _stepCardIconHover() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (!document.querySelector('.step-card')) return;

  document.addEventListener('mouseenter', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    var card = e.target.closest('.step-card');
    if (!card) return;
    var icon = card.querySelector('.step-card__icon');
    if (!icon) return;
    gsap.fromTo(icon,
      { y: 0, scale: 1 },
      {
        y: -6, scale: 1.1, duration: 0.25, ease: 'power2.out',
        onComplete: function () {
          gsap.to(icon, { y: 0, scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' });
        }
      }
    );
  }, true);
}

// ── 35. CTA BUTTON ENTRANCE ──────────────────────────────
function _ctaButtonEntrance() {
  document.querySelectorAll('.cta-section .btn').forEach(function (btn, i) {
    gsap.fromTo(btn,
      { clipPath: 'inset(0 0 100% 0)', y: 10 },
      {
        clipPath: 'inset(0 0 0% 0)', y: 0,
        duration: 0.48, delay: 0.1 + i * 0.1,
        ease: 'power2.out', overwrite: 'auto',
        scrollTrigger: { trigger: btn, start: 'top 88%', once: true },
      }
    );
  });
}

// ── 36. HERO ORB PARALLAX (desktop only) ─────────────────
// Subtle mouse-driven parallax on hero gradient orbs.
// Only active on desktop hover-capable screens (>960px).
// Each orb moves at a different depth multiplier for realism.
function _heroOrbParallax() {
  // Gate: desktop only, hover-capable, respects reduced motion
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth <= 960) return;

  var orbs = document.querySelectorAll('.hero-postcard__orb');
  if (!orbs.length) return;

  var hero = document.querySelector('.hero-postcard');
  if (!hero) return;

  // Depth multipliers — different per orb for layered depth effect
  var depths = [0.025, 0.018, 0.015, 0.012];

  var rafId = null;
  var targetX = 0;
  var targetY = 0;
  var currentX = 0;
  var currentY = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    currentX = lerp(currentX, targetX, 0.06);
    currentY = lerp(currentY, targetY, 0.06);

    orbs.forEach(function (orb, i) {
      var d = depths[i] || 0.01;
      var tx = currentX * d * 100;
      var ty = currentY * d * 100;
      orb.style.transform = 'translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px)';
    });

    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function onMove(e) {
    var rect = hero.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    targetX = (e.clientX - cx) / (rect.width / 2);
    targetY = (e.clientY - cy) / (rect.height / 2);

    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  hero.addEventListener('mousemove', onMove, { passive: true });

  // Reset when mouse leaves hero
  hero.addEventListener('mouseleave', function () {
    targetX = 0;
    targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(tick);
  });

  // Destroy on resize below breakpoint
  function checkWidth() {
    if (window.innerWidth <= 960) {
      hero.removeEventListener('mousemove', onMove);
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      orbs.forEach(function (orb) { orb.style.transform = ''; });
      window.removeEventListener('resize', checkWidth);
    }
  }
  window.addEventListener('resize', checkWidth, { passive: true });
}

