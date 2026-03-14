/**
 * Simphonia — GSAP Scroll Animations v3
 *
 * Design principles:
 *   1. Each DOM element is animated by exactly ONE function — no double-targeting
 *   2. gsap.fromTo() everywhere — explicit from/to, no reliance on CSS state
 *   3. autoAlpha (opacity + visibility) instead of bare opacity — avoids FOUC
 *   4. overwrite: 'auto' as safety net for any accidental overlaps
 *   5. Retry loop if GSAP CDN hasn't loaded yet
 *   6. ScrollTrigger.batch() for grid items — efficient + correct stagger
 *   7. Reduced-motion: skip everything, reveal immediately
 */

// Elements handled by section-specific animations.
// The generic reveal handler MUST skip these to prevent double-animation / flicker.
const SECTION_SPECIFIC_SEL =
  '.feat-card, .step-card, .metric-card, .price-card, .bento-item, ' +
  '.faq-item, .team-card, .value-card, .compat-brand-card, .dest-card, .feature-card';

export function initAnimations() {
  // ── Retry if CDN scripts have not executed yet ─────────
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    setTimeout(initAnimations, 150);
    return;
  }

  // ── Respect prefers-reduced-motion ────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll(
      '.reveal, .reveal--left, .reveal--right, .reveal--scale'
    ).forEach(el => {
      el.style.opacity  = '1';
      el.style.transform = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ limitCallbacks: true });

  _hero();
  _genericReveals();
  _metricCards();
  _stepCards();
  _featureCards();
  _showcase();
  _bentoGrid();
  _pricingCards();
  _testimonials();
  _faqItems();
  _counters();
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Returns true if el matches any section-specific selector */
function _isSpecific(el) {
  try { return el.matches(SECTION_SPECIFIC_SEL); } catch (_) { return false; }
}

/** Shared ScrollTrigger config object */
function _st(trigger, startPct = '88%') {
  return { trigger, start: `top ${startPct}`, once: true };
}

/**
 * Animate a batch of grid/card elements as they enter the viewport.
 * Uses ScrollTrigger.batch() for efficiency and correct stagger behavior.
 */
function _batchReveal(selector, fromVars, tweenVars, batchMax = 4) {
  if (!document.querySelector(selector)) return;
  ScrollTrigger.batch(selector, {
    batchMax,
    onEnter: (batch) =>
      gsap.fromTo(
        batch,
        { autoAlpha: 0, ...fromVars },
        { autoAlpha: 1, ...tweenVars, overwrite: 'auto' }
      ),
    start: 'top 88%',
    once: true,
  });
}

// ─────────────────────────────────────────────────────────
// 1. HERO — immediate entrance, no ScrollTrigger needed
// ─────────────────────────────────────────────────────────
function _hero() {

  // ── v2 split-layout hero (homepage) ───────────────────
  if (document.querySelector('.hero__eyebrow')) {
    // Pre-set initial hidden state via GSAP so there is zero FOUC
    gsap.set([
      '.hero__eyebrow',
      '.hero__h1 .line-1',
      '.hero__h1 .line-2',
      '.hero__desc',
      '.hero__actions',
      '.hero__stores-row',
      '.hero__proof',
    ], { autoAlpha: 0 });

    gsap.set('.hero-phone',          { autoAlpha: 0, x: 70 });
    gsap.set('.hero-phone__badge--1', { autoAlpha: 0, x: 30 });
    gsap.set('.hero-phone__badge--2', { autoAlpha: 0, x: 30 });
    gsap.set('.hero-phone__badge--3', { autoAlpha: 0, x: -30 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' } });

    tl
      .to('.hero__eyebrow',      { autoAlpha: 1, duration: 0.5 }, 0.15)
      .fromTo('.hero__h1 .line-1', { y: 50 }, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.2)
      .fromTo('.hero__h1 .line-2', { y: 50 }, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.38)
      .fromTo('.hero__desc',       { y: 22 }, { autoAlpha: 1, y: 0, duration: 0.65 }, 0.52)
      .fromTo('.hero__actions',    { y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6  }, 0.62)
      .fromTo('.hero__stores-row', { y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5  }, 0.72)
      .to('.hero__proof',          { autoAlpha: 1, duration: 0.5 }, 0.78)
      // Phone slides in from the right — starts at 0.2 s in parallel
      .to('.hero-phone',           { autoAlpha: 1, x: 0, duration: 1.1, ease: 'power2.out' }, 0.2)
      .to('.hero-phone__badge--1', { autoAlpha: 1, x: 0, duration: 0.45, ease: 'back.out(1.4)' }, 0.8)
      .to('.hero-phone__badge--3', { autoAlpha: 1, x: 0, duration: 0.45, ease: 'back.out(1.4)' }, 0.9)
      .to('.hero-phone__badge--2', { autoAlpha: 1, x: 0, duration: 0.45, ease: 'back.out(1.4)' }, 1.0);

    return;
  }

  // ── Fallback for sub-pages with a plain heading ────────
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
//    .reveal / .reveal--left / .reveal--right / .reveal--scale
//    Skips any element that is handled by a section-specific function.
// ─────────────────────────────────────────────────────────
function _genericReveals() {

  document.querySelectorAll('.reveal').forEach(el => {
    if (_isSpecific(el)) return;
    gsap.fromTo(el,
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 0.75, ease: 'power3.out',
        overwrite: 'auto', scrollTrigger: _st(el) }
    );
  });

  document.querySelectorAll('.reveal--left').forEach(el => {
    if (_isSpecific(el)) return;
    gsap.fromTo(el,
      { autoAlpha: 0, x: -32 },
      { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out',
        overwrite: 'auto', scrollTrigger: _st(el, '85%') }
    );
  });

  document.querySelectorAll('.reveal--right').forEach(el => {
    if (_isSpecific(el)) return;
    gsap.fromTo(el,
      { autoAlpha: 0, x: 32 },
      { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out',
        overwrite: 'auto', scrollTrigger: _st(el, '85%') }
    );
  });

  document.querySelectorAll('.reveal--scale').forEach(el => {
    if (_isSpecific(el)) return;
    gsap.fromTo(el,
      { autoAlpha: 0, scale: 0.93 },
      { autoAlpha: 1, scale: 1, duration: 0.75, ease: 'power3.out',
        overwrite: 'auto', scrollTrigger: _st(el) }
    );
  });
}

// ─────────────────────────────────────────────────────────
// 3. METRIC CARDS  (.metric-card)
// ─────────────────────────────────────────────────────────
function _metricCards() {
  _batchReveal('.metric-card',
    { scale: 0.92, y: 18 },
    { scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.3)', stagger: 0.1 }
  );
}

// ─────────────────────────────────────────────────────────
// 4. STEP CARDS  (.step-card)
// ─────────────────────────────────────────────────────────
function _stepCards() {
  _batchReveal('.step-card',
    { y: 50 },
    { y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.15 },
    3
  );
}

// ─────────────────────────────────────────────────────────
// 5. FEATURE CARDS  (.feat-card  +  legacy .feature-card)
// ─────────────────────────────────────────────────────────
function _featureCards() {
  _batchReveal('.feat-card',
    { y: 40 },
    { y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 },
    3
  );
  _batchReveal('.feature-card',
    { y: 40 },
    { y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 },
    3
  );
}

// ─────────────────────────────────────────────────────────
// 6. APP SHOWCASE PHONES  (.showcase--new  +  legacy .showcase)
// ─────────────────────────────────────────────────────────
function _showcase() {
  const section = document.querySelector('.showcase--new, .showcase');
  if (!section || window.innerWidth < 768) return;

  const center = section.querySelector('.phone-3d--center');
  const left   = section.querySelector('.phone-3d--left');
  const right  = section.querySelector('.phone-3d--right');

  if (center) {
    gsap.fromTo(center,
      { autoAlpha: 0, y: 80 },
      { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 65%', once: true } }
    );
  }

  if (left) {
    gsap.fromTo(left,
      { autoAlpha: 0, x: -50 },
      { autoAlpha: 0.65, x: 0, duration: 0.8, delay: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 65%', once: true } }
    );
    gsap.to(left, {
      y: -60,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
    });
  }

  if (right) {
    gsap.fromTo(right,
      { autoAlpha: 0, x: 50 },
      { autoAlpha: 0.65, x: 0, duration: 0.8, delay: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 65%', once: true } }
    );
    gsap.to(right, {
      y: 60,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
    });
  }
}

// ─────────────────────────────────────────────────────────
// 7. BENTO GRID  (.bento-item)
// ─────────────────────────────────────────────────────────
function _bentoGrid() {
  _batchReveal('.bento-item',
    { scale: 0.94 },
    { scale: 1, duration: 0.65, ease: 'power2.out', stagger: 0.1 },
    4
  );
}

// ─────────────────────────────────────────────────────────
// 8. PRICING CARDS  (.price-card)
// ─────────────────────────────────────────────────────────
function _pricingCards() {
  _batchReveal('.price-card',
    { y: 40 },
    { y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.15 },
    3
  );
}

// ─────────────────────────────────────────────────────────
// 9. TESTIMONIALS
//    • .testimonials-row  → CSS infinite-scroll (homepage). No GSAP needed.
//    • .testimonials-track → Manual-scroll track on sub-pages. GSAP stagger.
// ─────────────────────────────────────────────────────────
function _testimonials() {
  if (document.querySelector('.testimonials-row')) return; // CSS handles it

  const track = document.querySelector('.testimonials-track');
  if (!track) return;

  gsap.fromTo(
    track.querySelectorAll('.testimonial-card'),
    { autoAlpha: 0, x: 50 },
    {
      autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.12,
      ease: 'power3.out', overwrite: 'auto',
      scrollTrigger: { trigger: track, start: 'top 82%', once: true },
    }
  );
}

// ─────────────────────────────────────────────────────────
// 10. FAQ ITEMS  (.faq-item)
// ─────────────────────────────────────────────────────────
function _faqItems() {
  const list = document.querySelector('.faq-list');
  if (!list) return;

  gsap.fromTo(
    list.querySelectorAll('.faq-item'),
    { autoAlpha: 0, y: 18 },
    {
      autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08,
      ease: 'power3.out', overwrite: 'auto',
      scrollTrigger: { trigger: list, start: 'top 82%', once: true },
    }
  );
}

// ─────────────────────────────────────────────────────────
// 11. ANIMATED COUNTERS  (data-count attribute)
//     Works for both .metrics-strip (v2 homepage) and .trust-bar (older pages)
// ─────────────────────────────────────────────────────────
function _counters() {
  const counterEls = document.querySelectorAll('[data-count]');
  if (!counterEls.length) return;

  // Use the closest meaningful container as the ScrollTrigger
  const triggerEl =
    counterEls[0].closest('.metrics-strip, .trust-bar, section') ||
    counterEls[0].parentElement;

  ScrollTrigger.create({
    trigger: triggerEl,
    start: 'top 82%',
    once: true,
    onEnter() {
      counterEls.forEach(el => {
        const target   = parseFloat(el.dataset.count);
        const suffix   = el.dataset.suffix || '';
        const decimals = target % 1 !== 0 ? 1 : 0;
        const obj      = { val: 0 };

        gsap.to(obj, {
          val:      target,
          duration: 2.2,
          ease:     'power2.out',
          onUpdate() {
            el.textContent = obj.val.toFixed(decimals) + suffix;
          },
          onComplete() {
            // Ensure we end on the exact target value
            el.textContent = target.toFixed(decimals) + suffix;
          },
        });
      });
    },
  });
}

