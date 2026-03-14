/**
 * GSAP / ScrollTrigger Animations
 *
 * Feature-detects which sections exist in the DOM,
 * then registers the appropriate scroll-driven animations.
 */

export function initAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[Animations] GSAP/ScrollTrigger not loaded');
    return;
  }

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Remove reveal classes so content is visible
    document.querySelectorAll('.reveal, .reveal--left, .reveal--right, .reveal--scale')
      .forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // --- Generic Reveal ---
  initReveals();

  // --- Hero v1 & v2 ---
  if (document.querySelector('.hero, .hero--v2')) initHero();

  // --- Trust Bar Counters ---
  if (document.querySelector('.trust-bar')) initCounters();

  // --- How It Works Steps ---
  if (document.getElementById('steps-section')) initSteps();

  // --- Features Stagger (old + new) ---
  if (document.querySelector('.features-grid, .feature-grid--new')) initFeatures();

  // --- Step Cards ---
  if (document.querySelector('.steps--cards')) initStepCards();

  // --- Showcase Phones ---
  if (document.querySelector('.showcase')) initShowcase();

  // --- Bento Grid ---
  if (document.querySelector('.bento-grid')) initBento();

  // --- Testimonials ---
  if (document.querySelector('.testimonials-track')) initTestimonials();

  // --- Pricing Cards ---
  if (document.querySelector('.pricing-cards')) initPricing();

  // --- FAQ Items ---
  if (document.querySelector('.faq-list')) initFaq();
}

// ── Generic Reveals ──────────────────────────────────────

function initReveals() {
  // Fade-up
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  });

  // Fade-left
  gsap.utils.toArray('.reveal--left').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Fade-right
  gsap.utils.toArray('.reveal--right').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Scale
  gsap.utils.toArray('.reveal--scale').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

function initHero() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // v2 hero (homepage redesign)
  if (document.querySelector('.hero__eyebrow')) {
    tl.from('.hero__eyebrow', { y: -20, opacity: 0, duration: 0.6, delay: 0.1 })
      .from('.hero__h1 .line-1', { y: 50, opacity: 0, duration: 0.8 }, '-=0.2')
      .from('.hero__h1 .line-2', { y: 50, opacity: 0, duration: 0.8 }, '-=0.5')
      .from('.hero__desc', { y: 30, opacity: 0, duration: 0.7 }, '-=0.4')
      .from('.hero__actions', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.hero__stores-row', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
      .from('.hero__proof', { opacity: 0, duration: 0.5 }, '-=0.2')
      .from('.hero-phone', { x: 60, opacity: 0, duration: 1, ease: 'power2.out' }, 0.3)
      .from('.hero-phone__badge--1', { x: 40, opacity: 0, duration: 0.5 }, 0.8)
      .from('.hero-phone__badge--2', { x: 40, opacity: 0, duration: 0.5 }, 1.0)
      .from('.hero-phone__badge--3', { x: -40, opacity: 0, duration: 0.5 }, 0.9);
    return;
  }

  // v1 hero fallback
  tl.from('.hero-title', { y: 50, opacity: 0, duration: 1, delay: 0.2 })
    .from('.hero-sub', { y: 30, opacity: 0, duration: 1 }, '-=0.5')
    .from('.badge', { y: -20, opacity: 0, duration: 0.8 }, '-=0.8')
    .from('.hero-ctas', { y: 30, opacity: 0, duration: 1 }, '-=0.4');
}

// ── Trust Bar Counter Animation ──────────────────────────

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  ScrollTrigger.create({
    trigger: '.trust-bar',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      counters.forEach(el => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const isDecimal = target % 1 !== 0;

        gsap.to(el, {
          innerText: target,
          duration: 2,
          snap: isDecimal ? { innerText: 0.1 } : { innerText: 1 },
          ease: 'power1.out',
          onUpdate() {
            el.textContent = (isDecimal ? parseFloat(el.innerText).toFixed(1) : el.innerText) + suffix;
          },
        });
      });
    },
  });
}

// ── Steps (Pin + Scrub) ──────────────────────────────────

function initSteps() {
  if (window.innerWidth < 768) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#steps-section',
      start: 'center center',
      end: '+=200%',
      pin: true,
      scrub: 1,
    },
  });

  tl.to('#steps-line-fill', { width: '50%', duration: 1 })
    .to('.step:nth-child(1)', { opacity: 0.35 }, '<')
    .to('.step:nth-child(2)', { opacity: 1, className: '+=step--active' }, '<')
    .to('#steps-line-fill', { width: '100%', duration: 1 })
    .to('.step:nth-child(2)', { opacity: 0.35 }, '<')
    .to('.step:nth-child(3)', { opacity: 1, className: '+=step--active' }, '<');
}

// ── Features Stagger ─────────────────────────────────────

function initFeatures() {
  gsap.from('.feature-card, .feat-card', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.features-grid, .feature-grid--new',
      start: 'top 75%',
      once: true,
    },
  });
}

// ── Step Cards ───────────────────────────────────────────

function initStepCards() {
  gsap.from('.step-card', {
    y: 50,
    opacity: 0,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.steps--cards',
      start: 'top 75%',
      once: true,
    },
  });
}

// ── Showcase Phones ──────────────────────────────────────

function initShowcase() {
  if (window.innerWidth < 768) return;

  gsap.from('.phone-3d--center', {
    y: 120,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.showcase', start: 'top 60%', once: true },
  });

  gsap.to('.phone-3d--left', {
    y: -80,
    scrollTrigger: {
      trigger: '.showcase',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });

  gsap.to('.phone-3d--right', {
    y: 80,
    scrollTrigger: {
      trigger: '.showcase',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });
}

// ── Bento Grid ───────────────────────────────────────────

function initBento() {
  gsap.from('.bento-item', {
    scale: 0.92,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.bento-grid',
      start: 'top 75%',
      once: true,
    },
  });
}

// ── Testimonials ─────────────────────────────────────────

function initTestimonials() {
  gsap.from('.testimonial-card', {
    x: 60,
    opacity: 0,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.testimonials-track',
      start: 'top 80%',
      once: true,
    },
  });
}

// ── Pricing Cards ────────────────────────────────────────

function initPricing() {
  gsap.from('.price-card', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.pricing-cards',
      start: 'top 75%',
      once: true,
    },
  });
}

// ── FAQ Accordion ────────────────────────────────────────

function initFaq() {
  gsap.from('.faq-item', {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.faq-list',
      start: 'top 80%',
      once: true,
    },
  });
}





