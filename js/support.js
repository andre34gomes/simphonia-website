/**
 * Simphonia — Support Page
 *
 * Responsibilities:
 *   1. Two-panel FAQ (render, switch, keyboard navigation)
 *   2. FAQ live search with debounce + clear button
 *   3. Contact form with per-field validation + API submission
 *   4. loadFaqs(): tries API first, falls back to static FAQ_ITEMS
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   API config
   ───────────────────────────────────────────────────────────── */
var API_BASE      = (window.SIMPHONIA_API && window.SIMPHONIA_API.base) || 'https://api.simphonia.pt';
var getGuestToken = window.getGuestToken;

/* ─────────────────────────────────────────────────────────────
   Static FAQ data (fallback when API is unavailable)
   ───────────────────────────────────────────────────────────── */
var FAQ_ITEMS = [
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
   State
   ───────────────────────────────────────────────────────────── */
var faqData     = [];
var activeIndex = 0;

/* ─────────────────────────────────────────────────────────────
   FAQ Panel — render
   ───────────────────────────────────────────────────────────── */
function renderNav(items) {
  var nav = document.getElementById('faq-panel-nav');
  if (!nav) return;

  nav.innerHTML = '';

  items.forEach(function (item, i) {
    var btn            = document.createElement('button');
    btn.type           = 'button';
    btn.className      = 'faq-panel__q' + (i === 0 ? ' is-active' : '');
    btn.dataset.index      = i;
    btn.dataset.searchText = (item.q + ' ' + (item.keywords || '')).toLowerCase();
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
  var btns    = Array.from(e.currentTarget.querySelectorAll('.faq-panel__q:not([hidden])'));
  var focused = document.activeElement;
  var idx     = btns.indexOf(focused);
  if (idx === -1) return;

  var next = -1;
  if      (e.key === 'ArrowDown') next = (idx + 1) % btns.length;
  else if (e.key === 'ArrowUp')   next = (idx - 1 + btns.length) % btns.length;
  else if (e.key === 'Home')      next = 0;
  else if (e.key === 'End')       next = btns.length - 1;

  if (next !== -1) { e.preventDefault(); btns[next].focus(); }
}

function renderDisplay(index) {
  var item = faqData[index];
  if (!item) return;

  var numEl  = document.getElementById('fpd-num');
  var qEl    = document.getElementById('fpd-q');
  var bodyEl = document.getElementById('fpd-body');

  if (numEl)  numEl.textContent = String(index + 1).padStart(2, '0');
  if (qEl)    qEl.textContent   = item.q;
  if (bodyEl) bodyEl.innerHTML  = '<p>' + item.a + '</p>';
}

function switchFaq(index) {
  if (index === activeIndex) return;

  var inner = document.getElementById('faq-display-inner');
  if (!inner) return;

  inner.classList.add('is-switching');

  setTimeout(function () {
    activeIndex = index;
    renderDisplay(index);

    document.querySelectorAll('.faq-panel__q').forEach(function (btn) {
      var isActive = parseInt(btn.dataset.index, 10) === index;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    inner.classList.remove('is-switching');
  }, 180);
}

/* ─────────────────────────────────────────────────────────────
   Load FAQs — API first, static fallback
   ───────────────────────────────────────────────────────────── */
function loadFaqs(lang) {
  var url     = API_BASE + '/api/v1/faq?lang=' + (lang || 'en');
  var headers = { 'Accept': 'application/json' };
  var abortCtrl = new AbortController();
  var timeoutId = setTimeout(function () { abortCtrl.abort(); }, 10000);

  var tokenPromise = (typeof getGuestToken === 'function')
    ? Promise.resolve().then(function () { return getGuestToken(); }).catch(function () { return null; })
    : Promise.resolve(null);

  tokenPromise
    .then(function (token) {
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return fetch(url, { headers: headers, signal: abortCtrl.signal });
    })
    .then(function (res) {
      if (!res || !res.ok) throw new Error('FAQ fetch failed: ' + (res ? res.status : 'network'));
      return res.json();
    })
    .then(function (data) {
      var items = Array.isArray(data) ? data
                : (data && Array.isArray(data.items) ? data.items : null);
      if (!items || items.length === 0) throw new Error('Empty FAQ response');
      initPanel(items);
    })
    .catch(function () {
      initPanel(FAQ_ITEMS);
    })
    .finally(function () {
      clearTimeout(timeoutId);
    });
}

function initPanel(items) {
  faqData     = items;
  activeIndex = 0;
  renderNav(items);
  renderDisplay(0);
  initFaqSearch();
}

/* ─────────────────────────────────────────────────────────────
   FAQ Search (debounced, synced across both search inputs)
   ───────────────────────────────────────────────────────────── */
function debounce(fn, ms) {
  var id;
  return function () {
    clearTimeout(id);
    var ctx  = this;
    var args = arguments;
    id = setTimeout(function () { fn.apply(ctx, args); }, ms);
  };
}

function initFaqSearch() {
  var inputs = [
    document.getElementById('hero-faq-search'),
    document.getElementById('faq-search'),
  ].filter(Boolean);

  if (!inputs.length) return;

  inputs.forEach(function (input) {
    // Inject clear button
    var clearBtn       = document.createElement('button');
    clearBtn.type      = 'button';
    clearBtn.className = 'search-bar__clear';
    clearBtn.setAttribute('aria-label', 'Clear search');
    clearBtn.hidden    = true;
    clearBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    input.parentElement.appendChild(clearBtn);

    clearBtn.addEventListener('click', function () {
      inputs.forEach(function (inp) { inp.value = ''; });
      inputs.forEach(function (inp) {
        var cb = inp.parentElement.querySelector('.search-bar__clear');
        if (cb) cb.hidden = true;
      });
      filterFaq('');
      input.focus();
    });

    input.addEventListener('input', debounce(function () {
      var query = input.value.trim().toLowerCase();
      // Sync value to the other input
      inputs.forEach(function (inp) {
        if (inp !== input) inp.value = input.value;
        var cb = inp.parentElement.querySelector('.search-bar__clear');
        if (cb) cb.hidden = inp.value === '';
      });
      filterFaq(query);
    }, 200));
  });
}

function filterFaq(query) {
  var btns      = document.querySelectorAll('.faq-panel__q');
  var panelEl   = document.getElementById('faq-panel');
  var noResults = document.getElementById('faq-no-results');
  var visible   = 0;

  btns.forEach(function (btn) {
    var text  = btn.dataset.searchText || btn.querySelector('.faq-panel__q-text').textContent.toLowerCase();
    var match = !query || text.includes(query);
    btn.hidden = !match;
    if (match) visible++;
  });

  var isEmpty = visible === 0;
  if (panelEl)   panelEl.style.display   = isEmpty ? 'none' : '';
  if (noResults) noResults.style.display = isEmpty ? 'block' : 'none';

  // If the active item is now hidden, switch to the first visible one
  if (!isEmpty) {
    var visibleBtns = Array.from(btns).filter(function (b) { return !b.hidden; });
    var stillActive = visibleBtns.some(function (b) {
      return parseInt(b.dataset.index, 10) === activeIndex;
    });
    if (!stillActive && visibleBtns.length) {
      var newIdx = parseInt(visibleBtns[0].dataset.index, 10);
      activeIndex = newIdx;
      renderDisplay(newIdx);
      visibleBtns.forEach(function (b, i) {
        var isFirst = i === 0;
        b.classList.toggle('is-active', isFirst);
        b.setAttribute('aria-pressed', isFirst ? 'true' : 'false');
      });
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   Contact Form
   ───────────────────────────────────────────────────────────── */
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldError(fieldId, message) {
  var field = document.getElementById(fieldId);
  if (!field) return;

  var errorId = fieldId + '-error';
  var errorEl = document.getElementById(errorId);

  if (!errorEl) {
    errorEl           = document.createElement('span');
    errorEl.id        = errorId;
    errorEl.className = 'field-error';
    errorEl.setAttribute('aria-live', 'polite');
    field.parentElement.appendChild(errorEl);
    var existing = field.getAttribute('aria-describedby');
    field.setAttribute('aria-describedby', existing ? existing + ' ' + errorId : errorId);
  }

  errorEl.textContent = message;
  errorEl.hidden      = !message;
  field.classList.toggle('form-input--error', Boolean(message));
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function showFormFeedback(form, type, message) {
  var el = form.querySelector('.form-feedback');
  if (!el) {
    el = document.createElement('div');
    el.className = 'form-feedback';
    el.setAttribute('role', 'alert');
    form.appendChild(el);
  }
  el.className   = 'form-feedback form-feedback--' + type;
  el.textContent = (type === 'success' ? '\u2713 ' : '\u26A0 ') + message;
  el.hidden      = false;
  if (type === 'success') setTimeout(function () { el.hidden = true; }, 8000);
}

function addFieldListeners(form) {
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
}

function initCharCounter(textareaId, maxLength) {
  if (maxLength === undefined) maxLength = 5000;
  var textarea = document.getElementById(textareaId);
  if (!textarea) return;

  textarea.setAttribute('maxlength', maxLength);

  var counter         = document.createElement('span');
  counter.id          = textareaId + '-counter';
  counter.className   = 'char-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');
  counter.textContent = '0 / ' + maxLength;
  textarea.parentElement.appendChild(counter);

  var existing = textarea.getAttribute('aria-describedby');
  textarea.setAttribute('aria-describedby', existing ? existing + ' ' + counter.id : counter.id);

  textarea.addEventListener('input', function () {
    var len             = textarea.value.length;
    counter.textContent = len + ' / ' + maxLength;
    counter.classList.toggle('char-counter--warn', len > maxLength * 0.9);
  });
}

function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var submitBtn          = form.querySelector('button[type="submit"]');
  var lastSubmitTime     = 0;
  var SUBMIT_COOLDOWN_MS = 30000;

  addFieldListeners(form);
  initCharCounter('contact-message', 5000);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
      var remaining = Math.ceil((SUBMIT_COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
      showFormFeedback(form, 'error', 'Please wait ' + remaining + ' seconds before sending another message.');
      return;
    }

    // Honeypot
    var honeypot = document.getElementById('contact-website');
    if (honeypot && honeypot.value) { form.reset(); return; }

    var nameEl    = document.getElementById('contact-name');
    var emailEl   = document.getElementById('contact-email');
    var subjectEl = document.getElementById('contact-subject');
    var msgEl     = document.getElementById('contact-message');
    var valid     = true;

    if (!nameEl || !nameEl.value.trim()) {
      setFieldError('contact-name', 'Please enter your name.');
      valid = false;
    }
    if (!emailEl || !emailEl.value.trim()) {
      setFieldError('contact-email', 'Please enter your email address.');
      valid = false;
    } else if (!EMAIL_RE.test(emailEl.value.trim())) {
      setFieldError('contact-email', 'Please enter a valid email address.');
      valid = false;
    }
    if (!msgEl || !msgEl.value.trim()) {
      setFieldError('contact-message', 'Please describe your issue or question.');
      valid = false;
    }
    if (!valid) return;

    var origLabel       = submitBtn.textContent;
    submitBtn.disabled  = true;
    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Sending\u2026';

    var tokenPromise = (typeof getGuestToken === 'function')
      ? Promise.resolve().then(function () { return getGuestToken(); }).catch(function () { return null; })
      : Promise.resolve(null);

    tokenPromise
      .then(function (token) {
        if (!token) {
          showFormFeedback(form, 'error', 'Unable to connect to the server. Please try again later or email us at support@simphonia.pt.');
          return Promise.reject('no-token');
        }

        var abortCtrl = new AbortController();
        var timeoutId = setTimeout(function () { abortCtrl.abort(); }, 15000);

        return fetch(API_BASE + '/api/v1/support/contact', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          signal: abortCtrl.signal,
          body: JSON.stringify({
            name:    nameEl.value.trim(),
            email:   emailEl.value.trim(),
            subject: subjectEl ? subjectEl.value.trim() : '',
            message: msgEl.value.trim(),
          }),
        }).finally(function () { clearTimeout(timeoutId); });
      })
      .then(function (res) {
        if (res.ok) {
          lastSubmitTime = Date.now();
          showFormFeedback(form, 'success', "Message sent! We\u2019ll get back to you within 24 hours.");
          form.reset();
          form.querySelectorAll('[id$="-counter"]').forEach(function (el) {
            var parts      = el.textContent.split('/');
            var max        = parts[1] ? parts[1].trim() : '5000';
            el.textContent = '0 / ' + max;
            el.classList.remove('char-counter--warn');
          });
        } else {
          return res.json().catch(function () { return {}; }).then(function (body) {
            showFormFeedback(form, 'error',
              (body && body.message) || 'Something went wrong. Please try again or email us at support@simphonia.pt.');
          });
        }
      })
      .catch(function (err) {
        if (err === 'no-token') return; // already shown a message above
        console.error('[contact-form]', err);
        showFormFeedback(form, 'error', 'Something went wrong. Please try again or email us at support@simphonia.pt.');
      })
      .then(function () {
        // finally
        submitBtn.disabled    = false;
        submitBtn.textContent = origLabel;
      });
  });
}

/* ─────────────────────────────────────────────────────────────
   Boot
   ───────────────────────────────────────────────────────────── */
var browserLang = (navigator.language || 'en').split('-')[0].toLowerCase();
loadFaqs(browserLang);
initContactForm();

