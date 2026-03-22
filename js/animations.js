/**
 * Simphonia — GSAP Scroll Animations v4
 *
 * Apple-style scroll animations:
 *   1. Text reveal — word-by-word opacity on scroll
 *   2. Sticky showcase — phone pins while panels swap
 *   3. Hero parallax — text and phone move at different speeds
 *   4. 3D phone rotation — perspective-driven rotateY/rotateX via scrub
 *   5. All original reveal animations preserved
 */

const SECTION_SPECIFIC_SEL =
  '.feat-card, .step-card, .metric-card, .bento-item, ' +
  '.faq-item, .team-card, .value-card, .compat-brand-card, .dest-card, .feature-card';

var _animStartTime = Date.now();

function initAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    if (Date.now() - _animStartTime < 4000) {
      setTimeout(initAnimations, 200);
    }
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Ensure text reveal words are visible
    document.querySelectorAll('.text-reveal__heading').forEach(function(h) {
      h.querySelectorAll('.word').forEach(function(w) { w.style.opacity = '1'; });
    });
    return;
  }

  document.documentElement.classList.add('gsap-ready');

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ limitCallbacks: true });

  _hero();
  _genericReveals();
  _metricCards();
  _stepCards();
  _featureCards();
  _textReveal();
  _stickyShowcase();
  _heroParallax();
  _faqItems();
  _counters();

  // --- Apple-style sub-page animations ---
  _subpageHeroParallax();
  _aboutStorySlideIn();
  _valueCards3D();
  _teamCardsStagger();
  _destCardsHover3D();
  _ctaSectionReveal();
  _compatBrandCards();
  _sectionDividers();
  _numberCountUp();
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function _isSpecific(el) {
  try { return el.matches(SECTION_SPECIFIC_SEL); } catch (_) { return false; }
}

function _st(trigger, startPct = '88%') {
  return { trigger, start: `top ${startPct}`, once: true };
}

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
// 1. HERO
// ─────────────────────────────────────────────────────────
function _hero() {
  if (document.querySelector('.hero--v2')) {
    gsap.set([
      '.hero__h1 .line-1',
      '.hero__h1 .line-2',
      '.hero__desc',
      '.hero__actions',
      '.hero__proof',
    ], { autoAlpha: 0 });

    gsap.set('.hero-phone',          { autoAlpha: 0, x: 70 });
    gsap.set('.hero-phone__badge--1', { autoAlpha: 0, x: 30 });
    gsap.set('.hero-phone__badge--2', { autoAlpha: 0, x: 30 });
    gsap.set('.hero-phone__badge--3', { autoAlpha: 0, x: -30 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' } });

    tl
      .fromTo('.hero__h1 .line-1', { y: 50 }, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.15)
      .fromTo('.hero__h1 .line-2', { y: 50 }, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.33)
      .fromTo('.hero__desc',       { y: 22 }, { autoAlpha: 1, y: 0, duration: 0.65 }, 0.47)
      .fromTo('.hero__actions',    { y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6  }, 0.57)
      .to('.hero__proof',          { autoAlpha: 1, duration: 0.5 }, 0.67)
      .to('.hero-phone',           { autoAlpha: 1, x: 0, duration: 1.1, ease: 'power2.out' }, 0.15)
      .to('.hero-phone__badge--1', { autoAlpha: 1, x: 0, duration: 0.45, ease: 'back.out(1.4)' }, 0.75)
      .to('.hero-phone__badge--3', { autoAlpha: 1, x: 0, duration: 0.45, ease: 'back.out(1.4)' }, 0.85)
      .to('.hero-phone__badge--2', { autoAlpha: 1, x: 0, duration: 0.45, ease: 'back.out(1.4)' }, 0.95);

    // ── Mousemove 3D tilt on the hero phone ──
    var heroVisual = document.querySelector('.hero__visual');
    var heroFrame  = document.querySelector('.hero-phone__frame');
    if (heroVisual && heroFrame) {
      heroVisual.addEventListener('mousemove', function(e) {
        var rect = heroVisual.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5 to 0.5
        var y = (e.clientY - rect.top)  / rect.height - 0.5;
        gsap.to(heroFrame, {
          rotateY:  x * 18,
          rotateX: -y * 14,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      });
      heroVisual.addEventListener('mouseleave', function() {
        gsap.to(heroFrame, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.8,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      });
    }

    return;
  }

  // Skip fallback for sub-pages that have their own hero animation handler
  if (document.querySelector('.about-hero, .destinations-hero, .compat-hero, .support-hero, .legal-hero')) {
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
// 3. METRIC CARDS
// ─────────────────────────────────────────────────────────
function _metricCards() {
  _batchReveal('.metric-card',
    { scale: 0.92, y: 18 },
    { scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.3)', stagger: 0.1 }
  );
}

// ─────────────────────────────────────────────────────────
// 4. STEP CARDS
// ─────────────────────────────────────────────────────────
function _stepCards() {
  _batchReveal('.step-card',
    { y: 50 },
    { y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.15 },
    3
  );
}

// ─────────────────────────────────────────────────────────
// 5. FEATURE CARDS
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
// 6. TEXT REVEAL — Apple-style word-by-word on scroll
// ─────────────────────────────────────────────────────────
function _textReveal() {
  const section = document.querySelector('.text-reveal-section');
  if (!section) return;

  const heading = section.querySelector('.text-reveal__heading');
  if (!heading) return;

  // Split text into word spans
  const text = heading.textContent.trim();
  heading.innerHTML = text.split(/\s+/).map(function(word) {
    return '<span class="word">' + word + '</span>';
  }).join(' ');

  const words = heading.querySelectorAll('.word');

  // Animate each word's opacity from 0.12 to 1 as user scrolls
  gsap.fromTo(words,
    { opacity: 0.12 },
    {
      opacity: 1,
      stagger: 0.04,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        pin: false, // sticky CSS handles pinning
      },
    }
  );
}

// ─────────────────────────────────────────────────────────
// 7. STICKY SHOWCASE — phone pins, panels activate on scroll
// ─────────────────────────────────────────────────────────
function _stickyShowcase() {
  const section = document.querySelector('.showcase-sticky');
  if (!section || window.innerWidth < 1024) return;

  const panels = section.querySelectorAll('.showcase-sticky__panel');
  const phone = section.querySelector('.showcase-sticky__phone .phone-3d--center');
  if (!panels.length) return;

  // Activate panels based on scroll position
  panels.forEach(function(panel, i) {
    ScrollTrigger.create({
      trigger: panel,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: function() {
        panels.forEach(function(p) { p.classList.remove('is-active'); });
        panel.classList.add('is-active');
        // Rotate phone slightly for each panel
        if (phone) {
          var rotations = [
            'rotateY(-8deg) rotateX(4deg)',
            'rotateY(-3deg) rotateX(2deg)',
            'rotateY(3deg) rotateX(-2deg)',
            'rotateY(8deg) rotateX(-4deg)',
          ];
          phone.style.transform = rotations[i] || rotations[0];
        }
      },
      onEnterBack: function() {
        panels.forEach(function(p) { p.classList.remove('is-active'); });
        panel.classList.add('is-active');
        if (phone) {
          var rotations = [
            'rotateY(-8deg) rotateX(4deg)',
            'rotateY(-3deg) rotateX(2deg)',
            'rotateY(3deg) rotateX(-2deg)',
            'rotateY(8deg) rotateX(-4deg)',
          ];
          phone.style.transform = rotations[i] || rotations[0];
        }
      },
    });
  });

  // Activate first panel by default
  if (panels[0]) panels[0].classList.add('is-active');
}

// ─────────────────────────────────────────────────────────
// 8. HERO PARALLAX + 3D PHONE — perspective-driven rotation
//    Text moves at different speeds, phone rotates in 3D space
// ─────────────────────────────────────────────────────────
function _heroParallax() {
  const hero = document.querySelector('.hero--v2');
  if (!hero || window.innerWidth < 768) return;

  const h1 = hero.querySelector('.hero__h1');
  const desc = hero.querySelector('.hero__desc');
  const phone = hero.querySelector('.hero-phone__frame');

  // Parallax: text rises faster than scroll
  if (h1) {
    gsap.to(h1, {
      y: -80,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  }

  if (desc) {
    gsap.to(desc, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  }

  // 3D phone rotation:  starts slightly rotated, straightens on scroll,
  // then tilts the other way as user continues scrolling past the hero.
  // CSS perspective: 1200px on .hero__visual enables the 3D depth.
  if (phone) {
    gsap.fromTo(phone,
      {
        rotateY: -12,
        rotateX: 5,
        scale: 0.92,
      },
      {
        rotateY: 8,
        rotateX: -3,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      }
    );
  }
}

// ─────────────────────────────────────────────────────────
// 10. FAQ ITEMS
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
// 11. ANIMATED COUNTERS
// ─────────────────────────────────────────────────────────
function _counters() {
  var counterEls = document.querySelectorAll('[data-count]');
  if (!counterEls.length) return;

  var triggerEl =
    counterEls[0].closest('.metrics-strip, .trust-bar, section') ||
    counterEls[0].parentElement;

  ScrollTrigger.create({
    trigger: triggerEl,
    start: 'top 82%',
    once: true,
    onEnter: function() {
      counterEls.forEach(function(el) {
        var target   = parseFloat(el.dataset.count);
        var suffix   = el.dataset.suffix || '';
        var decimals = target % 1 !== 0 ? 1 : 0;
        var obj      = { val: 0 };

        gsap.to(obj, {
          val:      target,
          duration: 2.2,
          ease:     'power2.out',
          onUpdate: function() {
            el.textContent = obj.val.toFixed(decimals) + suffix;
          },
          onComplete: function() {
            el.textContent = target.toFixed(decimals) + suffix;
          },
        });
      });
    },
  });
}

// ─────────────────────────────────────────────────────────
// 12. SUB-PAGE HERO PARALLAX — parallax depth on about/compat/dest/support heroes
// ─────────────────────────────────────────────────────────
function _subpageHeroParallax() {
  var heroes = document.querySelectorAll('.about-hero, .destinations-hero, .compat-hero, .support-hero, .legal-hero');
  heroes.forEach(function(hero) {
    var h1 = hero.querySelector('h1');
    var p = hero.querySelector('p');
    var label = hero.querySelector('.label');

    // Fade in + rise on load
    if (label) {
      gsap.fromTo(label,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' }
      );
    }
    if (h1) {
      gsap.fromTo(h1,
        { autoAlpha: 0, y: 50 },
        { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.2, ease: 'power3.out' }
      );
      // Parallax on scroll
      gsap.to(h1, {
        y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
    }
    if (p) {
      gsap.fromTo(p,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.35, ease: 'power3.out' }
      );
      gsap.to(p, {
        y: -35,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
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
    var img = story.querySelector('.about-story__img');
    var textBlock = story.children[1] || story.querySelector('div:not(.about-story__img)');
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

  ScrollTrigger.batch(cards, {
    batchMax: 4,
    onEnter: function(batch) {
      gsap.fromTo(batch,
        { autoAlpha: 0, y: 60, scale: 0.88, rotateX: 8 },
        {
          autoAlpha: 1, y: 0, scale: 1, rotateX: 0,
          duration: 0.85, stagger: 0.12,
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

  ScrollTrigger.batch(cards, {
    batchMax: 4,
    onEnter: function(batch) {
      gsap.fromTo(batch,
        { autoAlpha: 0, y: 50, scale: 0.85, rotateY: -15 },
        {
          autoAlpha: 1, y: 0, scale: 1, rotateY: 0,
          duration: 0.8, stagger: 0.1,
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
    var inner = cta.querySelector('.reveal, .container');
    if (!inner) return;

    gsap.fromTo(inner,
      { autoAlpha: 0, scale: 0.9, y: 40 },
      {
        autoAlpha: 1, scale: 1, y: 0,
        duration: 1, ease: 'power3.out', overwrite: 'auto',
        scrollTrigger: { trigger: cta, start: 'top 82%', once: true },
      }
    );
  });
}

// ─────────────────────────────────────────────────────────
// 18. COMPAT BRAND CARDS — cascade in with rotation
// ─────────────────────────────────────────────────────────
function _compatBrandCards() {
  var cards = document.querySelectorAll('.compat-brand-card');
  if (!cards.length) return;

  ScrollTrigger.batch(cards, {
    batchMax: 6,
    onEnter: function(batch) {
      gsap.fromTo(batch,
        { autoAlpha: 0, y: 40, scale: 0.85, rotateZ: -3 },
        {
          autoAlpha: 1, y: 0, scale: 1, rotateZ: 0,
          duration: 0.7, stagger: 0.06,
          ease: 'back.out(1.5)', overwrite: 'auto',
        }
      );
    },
    start: 'top 88%',
    once: true,
  });
}

// ─────────────────────────────────────────────────────────
// 19. SECTION DIVIDERS — horizontal line grow animation
// ─────────────────────────────────────────────────────────
function _sectionDividers() {
  var dividers = document.querySelectorAll('.section-divider');
  dividers.forEach(function(d) {
    gsap.fromTo(d,
      { scaleX: 0 },
      {
        scaleX: 1, duration: 1.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: d, start: 'top 90%', once: true },
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

