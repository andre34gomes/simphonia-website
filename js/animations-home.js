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
}

// ── 1. HERO ──────────────────────────────────────────────
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

    var tl = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' } });

    tl
      .fromTo('.hero__h1 .line-1',
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.55 }, 0.1)
      .fromTo('.hero__h1 .line-2',
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.5 }, 0.38)
      .fromTo('.hero__desc', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.55)
      .fromTo('.hero__actions', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.65)
      .fromTo('.hero__trust-points', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.75)
      .to('.iphone-mockup', { autoAlpha: 1, x: 0, duration: 1.0, ease: 'power2.out' }, 0.1);

    return;
  }

  // Skip fallback for sub-pages that have their own hero animation handler
  if (document.querySelector('.about-hero, .destinations-hero, .support-hero, .legal-hero')) {
    return;
  }

  var h1 = document.querySelector('h1');
  if (h1) {
    gsap.fromTo(h1,
      { autoAlpha: 0, y: 36 },
      { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.1, ease: 'power3.out' }
    );
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
function _stickyShowcase() {
  var section = document.querySelector('.showcase-sticky');
  if (!section) return;

  var scene = section.querySelector('.showcase-sticky__scene');
  var stage = document.getElementById('showcasePanelsStage');
  var segsEl = document.getElementById('showcaseSegments');
  if (!scene || !stage) return;

  var panels = stage.querySelectorAll('.showcase-sticky__panel');
  var panelCount = panels.length;
  if (!panelCount) return;

  var segFills = [];
  if (segsEl) {
    segsEl.querySelectorAll('.showcase-segment').forEach(function (seg) {
      var fill = document.createElement('div');
      fill.className = 'showcase-segment__fill';
      seg.appendChild(fill);
      segFills.push(fill);
    });
  }

  panels.forEach(function (p) {
    gsap.set(p, { position: 'absolute', opacity: 0, y: 40 });
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
      // Refresh ScrollTrigger so the pin-spacer height and start/end positions
      // are recalculated after orientation changes or browser-chrome resize.
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

  function transitionTo(newIdx, prevIdx) {
    // Guard: only run if the index actually changed (lastActive is the source
    // of truth; it must be updated here since onUpdate relies on it).
    if (newIdx === lastActive) return;
    lastActive = newIdx;

    var forward = newIdx > prevIdx;
    var panelDelay = prevIdx >= 0 ? 0.1 : 0;

    var slideOut = isMobileShowcase ? 28 : 60;
    var slideIn = isMobileShowcase ? 32 : 68;
    var firstSlide = isMobileShowcase ? 16 : 28;
    var innerMeta = isMobileShowcase ? 8 : 14;
    var innerTitle = isMobileShowcase ? 14 : 24;
    var innerDesc = isMobileShowcase ? 10 : 20;

    panels.forEach(function (p, i) {
      gsap.killTweensOf(p);
      var ch = panelChildren[i];
      [ch.ghost, ch.meta, ch.title, ch.desc].forEach(function (el) { if (el) gsap.killTweensOf(el); });
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

    if (prevIdx >= 0 && panels[prevIdx]) {
      gsap.to(panels[prevIdx], {
        opacity: 0, y: forward ? -slideOut : slideOut, scale: 0.92,
        duration: 0.42, ease: 'power3.in',
        onComplete: function () { gsap.set(panels[prevIdx], { scale: 1, y: 0 }); },
      });
    }

    var ch = panelChildren[newIdx];
    var fromY = forward ? slideIn : -slideIn;
    if (prevIdx < 0) fromY = firstSlide;

    gsap.set(panels[newIdx], { y: fromY, scale: 0.95 });
    if (ch.ghost) gsap.set(ch.ghost, { opacity: 0, x: forward ? 36 : -36 });
    if (ch.meta) gsap.set(ch.meta, { opacity: 0, y: forward ? innerMeta : -innerMeta });
    if (ch.title) gsap.set(ch.title, { opacity: 0, y: forward ? innerTitle : -innerTitle });
    if (ch.desc) gsap.set(ch.desc, { opacity: 0, y: forward ? innerDesc : -innerDesc });

    gsap.to(panels[newIdx], {
      opacity: 1, y: 0, scale: 1, duration: 0.72, delay: panelDelay, ease: 'expo.out',
    });

    var eD = panelDelay + 0.08;
    if (ch.ghost) gsap.to(ch.ghost, { opacity: 0.045, x: 0, duration: 0.85, delay: eD, ease: 'expo.out' });
    if (ch.meta) gsap.to(ch.meta, { opacity: 1, y: 0, duration: 0.5, delay: eD + 0.04, ease: 'power3.out' });
    if (ch.title) gsap.to(ch.title, { opacity: 1, y: 0, duration: 0.72, delay: eD + 0.10, ease: 'expo.out' });
    if (ch.desc) gsap.to(ch.desc, { opacity: 1, y: 0, duration: 0.65, delay: eD + 0.18, ease: 'power3.out' });

    if (screens.length) {
      gsap.fromTo(screens[newIdx],
        { opacity: 0 },
        { opacity: 1, duration: 0.55, delay: prevIdx >= 0 ? 0.15 : 0, ease: 'power2.out' }
      );
      screens[newIdx].style.pointerEvents = 'auto';
    }
  }

  function updateSegs(progress) {
    var p = Math.min(Math.max(progress, 0), 1);
    var raw = p * panelCount;
    var active = Math.min(Math.floor(raw), panelCount - 1);
    var frac = Math.min(raw - active, 1);
    segFills.forEach(function (fill, i) {
      fill.style.width = i < active ? '100%'
        : i === active ? (frac * 100).toFixed(1) + '%'
          : '0%';
    });
  }

  function setup() {
    transitionTo(0, -1);

    ScrollTrigger.create({
      trigger: section,
      pin: scene,
      start: 'top top',
      end: '+=' + (panelCount * 100) + '%',
      scrub: 0.6,
      anticipatePin: 1,
      onUpdate: function (self) {
        var p = self.progress;
        var idx = Math.min(Math.floor(p * panelCount), panelCount - 1);

        if (idx !== lastActive) {
          transitionTo(idx, lastActive);
        }

        updateSegs(p);
      },
      onLeave: function () {
        window.showcaseScrollComplete = true;
      },
      onLeaveBack: function () {
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

