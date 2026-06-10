/**
 * Simphonia — Sub-page Animations
 *
 * Contains: subpage hero parallax, about story slide-in, value cards 3D,
 * team cards stagger, destination cards hover 3D, CTA section reveal,
 * how-it-works timeline, number count-up.
 *
 * Only runs on sub-pages (about, destinations, how-it-works, support, etc.).
 * Called by the orchestrator in animations-core.js via _initSubpageAnimations().
 */

function _initSubpageAnimations() {
  _subpageHeroParallax();
  _aboutStorySlideIn();
  _valueCards3D();
  _teamCardsStagger();
  _destCardsHover3D();
  _ctaSectionReveal();
  _howItWorksTimeline();
  _numberCountUp();
}

// ── 12. SUB-PAGE HERO PARALLAX ───────────────────────────
function _subpageHeroParallax() {
  const heroes = document.querySelectorAll('.about-hero, .destinations-hero, .support-hero, .legal-hero');
  heroes.forEach(function (hero) {
    const h1 = hero.querySelector('h1');
    const p = hero.querySelector('p');
    const label = hero.querySelector('.label');

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
    if (p) {
      gsap.fromTo(p,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.32, ease: 'power3.out' }
      );
    }

    const searchBar = hero.querySelector('.search-bar');
    if (searchBar) {
      gsap.fromTo(searchBar,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.5, ease: 'power3.out' }
      );
    }
    const filterTabs = hero.querySelector('.filter-tabs');
    if (filterTabs) {
      gsap.fromTo(filterTabs,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.6, ease: 'power3.out' }
      );
    }

    const scrollIndicator = hero.querySelector('.hero__scroll');
    if (scrollIndicator) {
      gsap.fromTo(scrollIndicator,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.65, ease: 'power3.out' }
      );
    }
  });
}

// ── 13. ABOUT STORY SLIDE-IN ─────────────────────────────
function _aboutStorySlideIn() {
  const stories = document.querySelectorAll('.about-story');
  if (!stories.length) return;

  stories.forEach(function (story, i) {
    story.classList.remove('reveal');

    const img = story.querySelector('.about-story__img');
    const textBlock = Array.from(story.children).find(function (c) { return c !== img; });
    const isEven = i % 2 === 0;

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

    if (img) {
      gsap.to(img, {
        y: -30, ease: 'none',
        scrollTrigger: { trigger: story, start: 'top bottom', end: 'bottom top', scrub: 2 },
      });
    }
  });
}

// ── 14. VALUE CARDS 3D ───────────────────────────────────
function _valueCards3D() {
  const cards = document.querySelectorAll('.value-card');
  if (!cards.length) return;

  cards.forEach(function (card) { card.classList.remove('reveal'); });
  gsap.set(cards, { autoAlpha: 0 });

  ScrollTrigger.batch(cards, {
    batchMax: 4,
    onEnter: function (batch) {
      gsap.fromTo(batch,
        { autoAlpha: 0, y: 28, rotateX: 5 },
        { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.7, stagger: 0.1, ease: 'back.out(1.4)', overwrite: 'auto' }
      );
    },
    start: 'top 85%',
    once: true,
  });

  // Note: setting perspective on the card element itself has NO effect on
  // the card's own rotateX/rotateY — perspective only affects children.
  // Use GSAP's transformPerspective which injects perspective() into the
  // transform string, giving correct depth to the card's own 3D rotation.
  cards.forEach(function (card) {
    card.style.transformStyle = 'preserve-3d';
  });

  // Cache the hovered card's rect to avoid layout thrashing on every mousemove
  let _hoveredValueCard = null;
  let _hoveredValueRect = null;

  document.addEventListener('mouseover', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const card = e.target.closest('.value-card');
    if (!card) return;
    _hoveredValueCard = card;
    _hoveredValueRect = card.getBoundingClientRect();
    gsap.to(card, { scale: 1.04, duration: 0.3, ease: 'power2.out' });
  }, { passive: true });

  document.addEventListener('mouseout', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const card = e.target.closest('.value-card');
    if (!card) return;
    if (_hoveredValueCard === card) { _hoveredValueCard = null; _hoveredValueRect = null; }
    gsap.to(card, { scale: 1, rotateX: 0, rotateY: 0, transformPerspective: 800, duration: 0.4, ease: 'power2.out' });
  }, { passive: true });

  document.addEventListener('mousemove', function (e) {
    if (!_hoveredValueCard || !_hoveredValueRect) return;
    if (!e.target || typeof e.target.closest !== 'function') return;
    const card = e.target.closest('.value-card');
    if (card !== _hoveredValueCard) return;
    const x = (e.clientX - _hoveredValueRect.left) / _hoveredValueRect.width - 0.5;
    const y = (e.clientY - _hoveredValueRect.top) / _hoveredValueRect.height - 0.5;
    gsap.to(_hoveredValueCard, { rotateY: x * 12, rotateX: -y * 12, transformPerspective: 800, duration: 0.3, ease: 'power2.out' });
  }, { passive: true });
}

// ── 15. TEAM CARDS STAGGER ───────────────────────────────
function _teamCardsStagger() {
  const cards = document.querySelectorAll('.team-card');
  if (!cards.length) return;

  cards.forEach(function (card) { card.classList.remove('reveal'); });
  gsap.set(cards, { autoAlpha: 0 });

  ScrollTrigger.batch(cards, {
    batchMax: 4,
    onEnter: function (batch) {
      gsap.fromTo(batch,
        { autoAlpha: 0, y: 22, rotateY: -10 },
        { autoAlpha: 1, y: 0, rotateY: 0, duration: 0.65, stagger: 0.09, ease: 'back.out(1.6)', overwrite: 'auto' }
      );
    },
    start: 'top 85%',
    once: true,
  });
}

// ── 16. DESTINATION CARDS HOVER 3D ───────────────────────
function _destCardsHover3D() {
  const cards = document.querySelectorAll('.dest-card, .dest-grid-card');
  if (!cards.length) return;

  cards.forEach(function (card) { card.style.transformStyle = 'preserve-3d'; });

  const SEL = '.dest-card, .dest-grid-card';

  // Cache the hovered card's bounding rect so mousemove doesn't force
  // repeated layout reflows via getBoundingClientRect().
  let _hoveredCard = null;
  let _hoveredRect = null;

  document.addEventListener('mouseover', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const card = e.target.closest(SEL);
    if (!card) return;
    _hoveredCard = card;
    _hoveredRect = card.getBoundingClientRect(); // one reflow on enter, not per-move
    gsap.to(card, { scale: 1.03, y: -6, duration: 0.35, ease: 'power2.out' });
  }, { passive: true });

  document.addEventListener('mouseout', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const card = e.target.closest(SEL);
    if (!card) return;
    if (_hoveredCard === card) { _hoveredCard = null; _hoveredRect = null; }
    gsap.to(card, { scale: 1, y: 0, rotateX: 0, rotateY: 0, transformPerspective: 800, duration: 0.4, ease: 'power2.out' });
  }, { passive: true });

  document.addEventListener('mousemove', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    if (!_hoveredCard || !_hoveredRect) return;
    const card = e.target.closest(SEL);
    if (card !== _hoveredCard) return;
    const x = (e.clientX - _hoveredRect.left) / _hoveredRect.width - 0.5;
    const y = (e.clientY - _hoveredRect.top) / _hoveredRect.height - 0.5;
    gsap.to(_hoveredCard, { rotateY: x * 10, rotateX: -y * 8, transformPerspective: 800, duration: 0.3, ease: 'power2.out' });
  }, { passive: true });
}

// ── 17. CTA SECTION REVEAL ───────────────────────────────
function _ctaSectionReveal() {
  const ctas = document.querySelectorAll('.cta-section');
  ctas.forEach(function (cta) {
    const inner = cta.querySelector('.container');
    if (!inner) return;

    const revealChildren = inner.querySelectorAll('.reveal, .reveal--scale');
    let triggered = false;

    function trigger() {
      if (triggered) return;
      triggered = true;
      gsap.to(inner, {
        clipPath: 'inset(0 0 0% 0)', y: 0,
        duration: 0.6, ease: 'power2.out', overwrite: 'auto',
        onStart: function () {
          revealChildren.forEach(function (child) {
            gsap.set(child, { clipPath: 'none', y: 0 });
          });
        },
      });
    }

    // Set initial state
    gsap.set(inner, { clipPath: 'inset(0 0 100% 0)', y: 12 });

    ScrollTrigger.create({
      trigger: cta,
      start: 'top 85%',
      once: true,
      onEnter: trigger,
      onRefresh: function (self) {
        if (self.isActive && !triggered) trigger();
      }
    });

    // Check if potentially already in view on load
    if (cta.getBoundingClientRect().top < window.innerHeight * 0.95) {
      setTimeout(trigger, 100);
    }
  });
}

// ── 19b. HOW-IT-WORKS TIMELINE ───────────────────────────
function _howItWorksTimeline() {
  const track = document.querySelector('.timeline__track');
  if (!track) return;

  gsap.fromTo(track,
    { scaleY: 0 },
    {
      scaleY: 1, ease: 'none', transformOrigin: 'top center',
      scrollTrigger: { trigger: '#steps-timeline', start: 'top 75%', end: 'bottom 40%', scrub: 1.2 },
    }
  );

  document.querySelectorAll('.timeline__node').forEach(function (node) {
    gsap.fromTo(node,
      { scale: 0, autoAlpha: 0 },
      {
        scale: 1, autoAlpha: 1, duration: 0.55, ease: 'back.out(2)',
        scrollTrigger: { trigger: node, start: 'top 82%', once: true }
      }
    );
  });

  document.querySelectorAll('.timeline__step--left .timeline__card').forEach(function (card) {
    gsap.fromTo(card,
      { autoAlpha: 0, x: -70 },
      {
        autoAlpha: 1, x: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 80%', once: true }
      }
    );
  });

  document.querySelectorAll('.timeline__step--right .timeline__card').forEach(function (card) {
    gsap.fromTo(card,
      { autoAlpha: 0, x: 70 },
      {
        autoAlpha: 1, x: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 80%', once: true }
      }
    );
  });
}

// ── 20. NUMBER COUNT-UP ──────────────────────────────────
function _numberCountUp() {
  const numEls = document.querySelectorAll('[data-count-up]');
  if (!numEls.length) return;

  numEls.forEach(function (el) {
    const target = parseFloat(el.dataset.countUp);
    const suffix = el.dataset.suffix || '';
    const decimals = target % 1 !== 0 ? 1 : 0;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: function () {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target, duration: 2, ease: 'power2.out',
          onUpdate: function () { el.textContent = obj.val.toFixed(decimals) + suffix; },
          onComplete: function () {
            el.textContent = target.toFixed(decimals) + suffix;
            el.classList.add('counted');
            el.addEventListener('animationend', function onEnd() {
              el.classList.remove('counted');
              el.removeEventListener('animationend', onEnd);
            });
          },
        });
      },
    });
  });
}

