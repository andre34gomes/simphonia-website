/**
 * Simphonia — Support Page
 *
 * Responsibilities:
 *   1. Two-panel FAQ (render, switch, keyboard navigation)
 *   2. FAQ live search with debounce + clear button
 *   3. Contact form with per-field validation + API submission
 *
 * Loaded as <script type="module"> — deferred automatically, DOM is ready.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   API config — auto-detects dev vs production
   ───────────────────────────────────────────────────────────── */
const IS_DEV =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.');

const API_BASE   = IS_DEV ? 'http://localhost:3000' : 'https://api.simphonia.pt';
const TOKEN_KEY  = 'simphonia_guest_token';
const EXPIRY_KEY = 'simphonia_guest_expiry';

async function getGuestToken() {
  const stored = localStorage.getItem(TOKEN_KEY);
  const expiry  = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  if (stored && Date.now() < expiry - 60_000) return stored;

  try {
    const res = await fetch(API_BASE + '/api/v1/auth/guest', { method: 'POST' });
    if (!res.ok) return null;

    const envelope = await res.json();
    // Handle both { data: { token, expiresIn } } and { token, expiresIn } shapes
    const { token, expiresIn } = envelope.data ?? envelope;
    if (!token) return null;

    localStorage.setItem(TOKEN_KEY,  token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
    return token;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   FAQ data
   ───────────────────────────────────────────────────────────── */
const FAQ_DATA = [
  {
    q: 'What is an eSIM?',
    keywords: 'esim what is digital sim embedded',
    a: 'An eSIM (embedded SIM) is a digital SIM built into your smartphone. It lets you activate a cellular data plan without inserting a physical SIM card. You can store multiple eSIM profiles on one device and switch between them instantly.',
  },
  {
    q: 'Is my phone compatible with eSIM?',
    keywords: 'compatible phone device support iphone samsung pixel',
    a: 'Most modern smartphones released after 2018 support eSIM.<br><br><strong>Apple:</strong> iPhone XS, XR and all later models<br><strong>Samsung:</strong> Galaxy S20, Note 20 and later<br><strong>Google:</strong> Pixel 3 and later<br><strong>Others:</strong> Huawei P40+, Motorola Razr, Oppo Find X3+',
  },
  {
    q: 'How do I install my eSIM?',
    keywords: 'install setup qr code scan how activate settings',
    a: 'After purchasing a plan, your QR code appears in the Simphonia app. Go to your phone\u2019s <strong>Settings \u2192 Cellular/Mobile Data \u2192 Add eSIM</strong> and scan the QR code. Follow the on-screen prompts \u2014 the whole process takes about 1 minute. We recommend installing while on WiFi, before you travel.',
  },
  {
    q: 'Do I need to remove my physical SIM?',
    keywords: 'physical sim keep number dual remove',
    a: 'No! eSIM works alongside your physical SIM (Dual SIM). Keep your regular number active for calls and texts, and use Simphonia for mobile data. You can set the eSIM as your default data line in your phone\u2019s settings.',
  },
  {
    q: 'When does my eSIM plan start?',
    keywords: 'activate when start begin use plan days',
    a: 'Your plan starts when you connect to a network at your destination and begin using data. Install the eSIM before you travel \u2014 it activates automatically on arrival. No wasted days!',
  },
  {
    q: 'Can I top up or extend my plan?',
    keywords: 'top up extend renew data more add',
    a: 'Yes! Open the Simphonia app, go to your active eSIM and tap <strong>\u201cTop Up\u201d</strong>. Additional data is added instantly. You can also purchase a brand-new plan for the same or a different destination at any time.',
  },
  {
    q: 'What speeds can I expect?',
    keywords: 'speed 4g 5g lte data slow fast network',
    a: 'Simphonia connects you to premium local networks in each country. Most plans offer <strong>4G/LTE</strong> speeds, and <strong>5G</strong> is available in select destinations. Actual speeds depend on local network conditions, your device model, and your physical location.',
  },
  {
    q: 'What is your refund policy?',
    keywords: 'refund cancel money back return policy',
    a: 'If you haven\u2019t activated your eSIM (not yet connected to a network), you can request a full refund within <strong>30 days</strong> of purchase. Once data has been used, refunds are evaluated case-by-case. Contact our support team and we\u2019ll make it right.',
  },
  {
    q: 'Can I use hotspot / tethering?',
    keywords: 'hotspot tethering share data wifi personal',
    a: 'Most Simphonia plans support personal hotspot/tethering, allowing you to share your data connection with laptops or tablets. Check the plan details page before purchase \u2014 hotspot support is clearly marked for every plan.',
  },
  {
    q: 'Can I make calls and send texts?',
    keywords: 'call text sms voice phone whatsapp',
    a: 'Our eSIM plans are <strong>data-only</strong>. You can make calls and send messages using apps like WhatsApp, FaceTime, Telegram, or Signal over your data connection. Your physical SIM keeps your regular number active for traditional calls and SMS.',
  },
];

/* ─────────────────────────────────────────────────────────────
   FAQ Panel
   ───────────────────────────────────────────────────────────── */
let activeIndex = 0;

function renderNav() {
  const nav = document.getElementById('faq-panel-nav');
  if (!nav) return;

  nav.innerHTML = '';
  FAQ_DATA.forEach(function (item, i) {
    const btn = document.createElement('button');
    btn.className        = 'faq-panel__q' + (i === 0 ? ' is-active' : '');
    btn.dataset.index    = i;
    btn.dataset.keywords = item.keywords;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.innerHTML =
      '<span class="faq-panel__q-num">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="faq-panel__q-text">' + item.q + '</span>';
    btn.addEventListener('click', function () { switchFaq(i); });
    nav.appendChild(btn);
  });

  nav.addEventListener('keydown', handleNavKeydown);
}

function handleNavKeydown(e) {
  const btns    = Array.from(e.currentTarget.querySelectorAll('.faq-panel__q:not([hidden])'));
  const focused = document.activeElement;
  const idx     = btns.indexOf(focused);
  if (idx === -1) return;

  let next = -1;
  if      (e.key === 'ArrowDown') next = (idx + 1) % btns.length;
  else if (e.key === 'ArrowUp')   next = (idx - 1 + btns.length) % btns.length;
  else if (e.key === 'Home')      next = 0;
  else if (e.key === 'End')       next = btns.length - 1;

  if (next !== -1) {
    e.preventDefault();
    btns[next].focus();
  }
}

function renderDisplay(index) {
  const item = FAQ_DATA[index];
  document.getElementById('fpd-num').textContent = String(index + 1).padStart(2, '0');
  document.getElementById('fpd-q').textContent   = item.q;
  document.getElementById('fpd-body').innerHTML  = '<p>' + item.a + '</p>';
}

function switchFaq(index) {
  if (index === activeIndex) return;

  const inner = document.getElementById('faq-display-inner');
  inner.classList.add('is-switching');

  setTimeout(function () {
    activeIndex = index;
    renderDisplay(index);

    document.querySelectorAll('.faq-panel__q').forEach(function (btn) {
      const isActive = parseInt(btn.dataset.index, 10) === index;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    inner.classList.remove('is-switching');
  }, 180);
}

/* ─────────────────────────────────────────────────────────────
   FAQ Search (debounced)
   ───────────────────────────────────────────────────────────── */
function debounce(fn, ms) {
  let id;
  return function () {
    clearTimeout(id);
    const ctx  = this;
    const args = arguments;
    id = setTimeout(function () { fn.apply(ctx, args); }, ms);
  };
}

function initFaqSearch() {
  const input     = document.getElementById('faq-search');
  const noResults = document.getElementById('faq-no-results');
  const panelEl   = document.getElementById('faq-panel');
  if (!input || !noResults || !panelEl) return;

  // Inject clear (×) button
  const clearBtn = document.createElement('button');
  clearBtn.type      = 'button';
  clearBtn.className = 'search-bar__clear';
  clearBtn.setAttribute('aria-label', 'Clear search');
  clearBtn.hidden    = true;
  clearBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  input.parentElement.appendChild(clearBtn);

  const filter = debounce(function () {
    const query = input.value.toLowerCase().trim();
    const btns  = document.querySelectorAll('.faq-panel__q');
    let visible = 0;

    btns.forEach(function (btn) {
      const text  = btn.querySelector('.faq-panel__q-text').textContent.toLowerCase();
      const kw    = (btn.dataset.keywords || '').toLowerCase();
      const match = !query || text.includes(query) || kw.includes(query);
      btn.hidden  = !match;
      if (match) visible++;
    });

    const isEmpty           = visible === 0;
    panelEl.style.display   = isEmpty ? 'none' : '';
    noResults.style.display = isEmpty ? 'block' : 'none';

    if (query && !isEmpty) {
      const first = Array.from(btns).find(function (b) { return !b.hidden; });
      if (first) switchFaq(parseInt(first.dataset.index, 10));
    }
  }, 200);

  input.addEventListener('input', function () {
    clearBtn.hidden = input.value === '';
    filter();
  });

  clearBtn.addEventListener('click', function () {
    input.value     = '';
    clearBtn.hidden = true;
    input.dispatchEvent(new Event('input'));
    input.focus();
  });
}

/* ─────────────────────────────────────────────────────────────
   Contact Form
   ───────────────────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const errorId = fieldId + '-error';
  let errorEl   = document.getElementById(errorId);

  if (!errorEl) {
    errorEl           = document.createElement('span');
    errorEl.id        = errorId;
    errorEl.className = 'field-error';
    errorEl.setAttribute('aria-live', 'polite');
    field.parentElement.appendChild(errorEl);
    const existing = field.getAttribute('aria-describedby');
    field.setAttribute('aria-describedby', existing ? existing + ' ' + errorId : errorId);
  }

  errorEl.textContent = message;
  errorEl.hidden      = !message;
  field.classList.toggle('form-input--error', Boolean(message));
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function showFormFeedback(form, type, message) {
  let el = form.querySelector('.form-feedback');
  if (!el) {
    el = document.createElement('div');
    el.className = 'form-feedback';
    el.setAttribute('role', 'alert');
    form.appendChild(el);
  }

  el.className   = 'form-feedback form-feedback--' + type;
  el.textContent = (type === 'success' ? '\u2713 ' : '\u26A0 ') + message;
  el.hidden      = false;

  if (type === 'success') {
    setTimeout(function () { el.hidden = true; }, 8000);
  }
}

function addFieldListeners(form) {
  // Text / email / textarea — input + blur
  form.querySelectorAll('.form-input[required]:not(select)').forEach(function (field) {
    field.addEventListener('input', function () {
      if (field.value.trim()) setFieldError(field.id, '');
    });
    field.addEventListener('blur', function () {
      if (!field.value.trim()) {
        setFieldError(field.id, 'This field is required.');
      } else if (field.type === 'email' && !EMAIL_RE.test(field.value.trim())) {
        setFieldError(field.id, 'Please enter a valid email address.');
      }
    });
  });

  // Select elements — change event
  form.querySelectorAll('select.form-input[required]').forEach(function (field) {
    field.addEventListener('change', function () {
      if (field.value) setFieldError(field.id, '');
    });
  });
}

function initCharCounter(textareaId, maxLength) {
  if (maxLength === undefined) maxLength = 1000;
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  textarea.setAttribute('maxlength', maxLength);

  const counter     = document.createElement('span');
  counter.id        = textareaId + '-counter';
  counter.className = 'char-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');
  counter.textContent = '0 / ' + maxLength;
  textarea.parentElement.appendChild(counter);

  const existing = textarea.getAttribute('aria-describedby');
  textarea.setAttribute(
    'aria-describedby',
    existing ? existing + ' ' + counter.id : counter.id,
  );

  textarea.addEventListener('input', function () {
    const len           = textarea.value.length;
    counter.textContent = len + ' / ' + maxLength;
    counter.classList.toggle('char-counter--warn', len > maxLength * 0.9);
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  addFieldListeners(form);
  initCharCounter('contact-message', 5000);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameEl    = document.getElementById('contact-name');
    const emailEl   = document.getElementById('contact-email');
    const subjectEl = document.getElementById('contact-subject');
    const msgEl     = document.getElementById('contact-message');

    let valid = true;

    if (!nameEl.value.trim()) {
      setFieldError('contact-name', 'Please enter your name.');
      valid = false;
    }
    if (!emailEl.value.trim()) {
      setFieldError('contact-email', 'Please enter your email address.');
      valid = false;
    } else if (!EMAIL_RE.test(emailEl.value.trim())) {
      setFieldError('contact-email', 'Please enter a valid email address.');
      valid = false;
    }
    if (!subjectEl.value) {
      setFieldError('contact-subject', 'Please select a subject.');
      valid = false;
    }
    if (!msgEl.value.trim()) {
      setFieldError('contact-message', 'Please describe your issue or question.');
      valid = false;
    }
    if (!valid) return;

    const origLabel     = submitBtn.textContent;
    submitBtn.disabled  = true;
    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Sending\u2026';

    try {
      // Token is optional — endpoint is @PermitAll; we try for rate-limit purposes
      const token = await getGuestToken();

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const res = await fetch(API_BASE + '/api/v1/support/contact', {
        method:  'POST',
        headers: headers,
        body: JSON.stringify({
          name:    nameEl.value.trim(),
          email:   emailEl.value.trim(),
          subject: subjectEl.value,
          message: msgEl.value.trim(),
        }),
      });

      if (res.ok) {
        showFormFeedback(form, 'success', "Message sent! We'll get back to you within 24 hours.");
        form.reset();

        // Reset select placeholder styling
        if (subjectEl) subjectEl.value = '';

        // Reset character counters
        form.querySelectorAll('[id$="-counter"]').forEach(function (el) {
          const parts    = el.textContent.split('/');
          const max      = parts[1] ? parts[1].trim() : '5000';
          el.textContent = '0 / ' + max;
          el.classList.remove('char-counter--warn');
        });
      } else {
        const body = await res.json().catch(function () { return {}; });
        const msg  = (body && body.message) || 'Something went wrong. Please try again or email us at support@simphonia.pt.';
        console.error('[contact-form] Server error', res.status, body);
        showFormFeedback(form, 'error', msg);
      }
    } catch (err) {
      console.error('[contact-form]', err);
      showFormFeedback(
        form,
        'error',
        'Something went wrong. Please try again or email us at support@simphonia.pt.',
      );
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = origLabel;
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   Boot
   ───────────────────────────────────────────────────────────── */
renderNav();
renderDisplay(0);
initFaqSearch();
initContactForm();

