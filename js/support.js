/**
 * Simphonia — Support Page
 *
 * Responsibilities:
 *   1. Two-panel FAQ (render, switch, keyboard navigation, category groups)
 *   2. FAQ live search with debounce + clear button
 *   3. Contact form with per-field validation + API submission
 *   4. loadFaqs(): fetches /api/v1/faqs — categories with question/answer items
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   API config
   ───────────────────────────────────────────────────────────── */
var API_BASE = (window.SIMPHONIA_API && window.SIMPHONIA_API.base)
    || 'https://api.simphonia.pt';
var getGuestToken = window.getGuestToken;

/* ─────────────────────────────────────────────────────────────
   State & Statics
   ───────────────────────────────────────────────────────────── */
var faqData = [];
var activeIndex = 0;
var FAQ_MOBILE_BP = 860;

function isMobileLayout() {
  return window.innerWidth <= FAQ_MOBILE_BP;
}

/* ─────────────────────────────────────────────────────────────
   Normalise API response → flat item list
   ───────────────────────────────────────────────────────────── */
function normaliseFaqResponse(data) {
  // API returns: [ { code, category, items: [ { question, answer } ] } ]
  if (!Array.isArray(data)) {
    return [];
  }
  var flat = [];
  data.forEach(function (cat) {
    var catLabel = cat.category || cat.code || '';
    var items = Array.isArray(cat.items) ? cat.items : [];
    items.forEach(function (item) {
      if (!item.question || !item.answer) {
        return;
      }
      flat.push({
        q: item.question,
        a: item.answer,
        category: catLabel,
      });
    });
  });
  return flat;
}

/* ─────────────────────────────────────────────────────────────
   FAQ Panel — render
   ───────────────────────────────────────────────────────────── */
function renderNav(items) {
  var nav = document.getElementById('faq-panel-nav');
  if (!nav) {
    return;
  }

  nav.innerHTML = '';

  var lastCategory = null;

  items.forEach(function (item, i) {
    // Insert a category label when the category changes
    if (item.category && item.category !== lastCategory) {
      lastCategory = item.category;
      var label = document.createElement('div');
      label.className = 'faq-panel__category';
      label.textContent = item.category;
      nav.appendChild(label);
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'faq-panel__q' + (i === 0 ? ' is-active' : '');
    btn.dataset.index = i;
    // Include answer text (HTML-stripped) in search index for better discoverability
    var plainAnswer = item.a.replace(/<[^>]*>/g, '');
    btn.dataset.searchText = (item.q + ' ' + plainAnswer + ' ' + (item.category
        || '')).toLowerCase();
    btn.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-controls', 'faq-inline-' + i);
    btn.innerHTML =
        '<span class="faq-panel__q-num">' + String(i + 1).padStart(2, '0')
        + '</span>' +
        '<span class="faq-panel__q-text">' + item.q + '</span>' +
        '<svg class="faq-panel__q-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
    btn.addEventListener('click', function () {
      switchFaq(i);
    });
    nav.appendChild(btn);

    // Inline answer container for mobile accordion
    var answer = document.createElement('div');
    answer.className = 'faq-panel__inline-answer';
    answer.id = 'faq-inline-' + i;
    answer.setAttribute('aria-hidden', 'true');
    answer.innerHTML =
        '<div class="faq-panel__inline-answer-inner">' +
        (item.category ? '<span class="faq-panel__display-cat">' + item.category
            + '</span>' : '') +
        '<p>' + item.a + '</p>' +
        '<a href="#contact" class="faq-panel__display-cta">' +
        (typeof window.t === 'function' ? window.t('support.faq.stillNeedHelp') : 'Still need help? Contact us') +
        ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
        +
        '</a>' +
        '</div>';
    nav.appendChild(answer);
  });

  if (!nav._keydownBound) {
    nav.addEventListener('keydown', handleNavKeydown);
    nav._keydownBound = true;
  }
}

function handleNavKeydown(e) {
  var btns = Array.from(
      e.currentTarget.querySelectorAll('.faq-panel__q:not([hidden])'));
  var focused = document.activeElement;
  var idx = btns.indexOf(focused);
  if (idx === -1) {
    return;
  }

  var next = -1;
  if (e.key === 'ArrowDown') {
    next = (idx + 1) % btns.length;
  } else if (e.key === 'ArrowUp') {
    next = (idx - 1 + btns.length) % btns.length;
  } else if (e.key === 'Home') {
    next = 0;
  } else if (e.key === 'End') {
    next = btns.length - 1;
  }

  if (next !== -1) {
    e.preventDefault();
    btns[next].focus();
  }
}

function renderDisplay(index) {
  var item = faqData[index];
  if (!item) {
    return;
  }

  var numEl = document.getElementById('fpd-num');
  var qEl = document.getElementById('fpd-q');
  var bodyEl = document.getElementById('fpd-body');
  var catEl = document.getElementById('fpd-category');

  if (numEl) {
    numEl.textContent = String(index + 1).padStart(2, '0');
  }
  if (qEl) {
    qEl.textContent = item.q;
  }
  if (bodyEl) {
    bodyEl.innerHTML = '<p>' + item.a + '</p>';
  }
  if (catEl) {
    catEl.textContent = item.category || '';
    catEl.hidden = !item.category;
  }
}

function switchFaq(index) {
  var mobile = isMobileLayout();

  // On mobile, allow toggling the same item to collapse it
  if (mobile && index === activeIndex) {
    var activeAnswer = document.getElementById('faq-inline-' + index);
    var activeBtn = document.querySelector(
        '.faq-panel__q[data-index="' + index + '"]');
    if (activeAnswer && activeAnswer.classList.contains('is-open')) {
      activeAnswer.classList.remove('is-open');
      activeAnswer.setAttribute('aria-hidden', 'true');
      if (activeBtn) {
        activeBtn.classList.remove('is-active');
        activeBtn.setAttribute('aria-expanded', 'false');
      }
      activeIndex = -1;
      return;
    }
  }

  if (!mobile && index === activeIndex) {
    return;
  }

  // Collapse all inline answers
  document.querySelectorAll('.faq-panel__inline-answer.is-open').forEach(
      function (el) {
        el.classList.remove('is-open');
        el.setAttribute('aria-hidden', 'true');
      });

  // Desktop: animate the display panel
  if (!mobile) {
    var inner = document.getElementById('faq-display-inner');
    if (!inner) {
      return;
    }

    inner.classList.add('is-switching');

    setTimeout(function () {
      activeIndex = index;
      renderDisplay(index);

      document.querySelectorAll('.faq-panel__q').forEach(function (btn) {
        var isActive = parseInt(btn.dataset.index, 10) === index;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      });

      inner.classList.remove('is-switching');
    }, 180);
  } else {
    // Mobile: open inline answer
    activeIndex = index;

    document.querySelectorAll('.faq-panel__q').forEach(function (btn) {
      var isActive = parseInt(btn.dataset.index, 10) === index;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    var answer = document.getElementById('faq-inline-' + index);
    if (answer) {
      answer.classList.add('is-open');
      answer.setAttribute('aria-hidden', 'false');

      // Smooth scroll the opened question into view
      var btn = document.querySelector(
          '.faq-panel__q[data-index="' + index + '"]');
      if (btn) {
        setTimeout(function () {
          btn.scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 50);
      }
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   FAQ Panel — loading / error states
   ───────────────────────────────────────────────────────────── */
function showFaqLoading() {
  var nav = document.getElementById('faq-panel-nav');
  var display = document.getElementById('faq-display-inner');
  var panel = document.getElementById('faq-panel');
  if (panel) {
    panel.classList.add('faq-panel--state');
  }

  if (nav) {
    nav.innerHTML = '';
  }
  if (display) {
    display.innerHTML =
        '<div class="faq-panel__state">' +
        '<svg class="faq-panel__state-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'
        +
        '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>'
        +
        '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
        +
        '</svg>' +
        '<p class="faq-panel__state-desc">' + (typeof window.t === 'function'
            ? window.t('support.faq.loading') : 'Loading\u2026') + '</p>' +
        '</div>';
  }
}

function showFaqError(lang) {
  var nav = document.getElementById('faq-panel-nav');
  var display = document.getElementById('faq-display-inner');
  var panel = document.getElementById('faq-panel');
  if (panel) {
    panel.classList.add('faq-panel--state');
  }

  if (nav) {
    nav.innerHTML = '';
  }
  if (display) {
    display.innerHTML =
        '<div class="faq-panel__state faq-panel__state--error">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        +
        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
        +
        '</svg>' +
        '<h3 class="faq-panel__state-title">' + (typeof window.t === 'function'
            ? window.t('support.faq.errorTitle') : 'Unable to Load FAQs') + '</h3>'
        +
        '<p class="faq-panel__state-desc">' + (typeof window.t === 'function'
            ? window.t('support.faq.errorDesc').replace('\n', '<br>')
            : 'We couldn\u2019t reach our servers right now.<br>Check your connection and try again.')
        + '</p>' +
        '<button class="btn btn--outline btn--sm" id="faq-retry">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        +
        '<polyline points="23 4 23 10 17 10"/>' +
        '<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' +
        '</svg>' +
        (typeof window.t === 'function' ? window.t('support.faq.tryAgain')
            : 'Try Again') +
        '</button>' +
        '</div>';
    var retryBtn = document.getElementById('faq-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        loadFaqs(lang);
      });
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   Load FAQs — API only, no static fallback
   GET /api/v1/faqs?lang={lang}
   Response: [ { code, category, items: [ { question, answer } ] } ]
   ───────────────────────────────────────────────────────────── */
function loadFaqs(lang) {
  var resolvedLang = lang || window.SIMPHONIA_LANG || 'en';
  var url = API_BASE + '/api/v1/faqs?lang=' + resolvedLang;
  var headers = {'Accept': 'application/json'};
  var abortCtrl = new AbortController();
  var timeoutId = setTimeout(function () {
    abortCtrl.abort();
  }, 10000);

  showFaqLoading();

  var tokenPromise = (typeof getGuestToken === 'function')
      ? getGuestToken().catch(function () {
        return null;
      })
      : Promise.resolve(null);

  tokenPromise
      .then(function (token) {
        if (token) {
          headers['Authorization'] = 'Bearer ' + token;
        }
        return fetch(url, {headers: headers, signal: abortCtrl.signal});
      })
      .then(function (res) {
        if (!res || !res.ok) {
          throw new Error(
              'FAQ fetch failed: ' + (res ? res.status : 'network'));
        }
        return res.json();
      })
      .then(function (data) {
        var items = normaliseFaqResponse(
            Array.isArray(data) ? data : (data && data.data ? data.data : []));
        if (!items.length) {
          throw new Error('Empty FAQ response');
        }
        initPanel(items);
      })
      .catch(function (err) {
        console.warn('[faq] API failed:', err.message);
        showFaqError(lang);
      })
      .finally(function () {
        clearTimeout(timeoutId);
      });
}

function initPanel(items) {
  faqData = items;
  activeIndex = 0;

  var panel = document.getElementById('faq-panel');
  if (panel) {
    panel.classList.remove('faq-panel--state');
  }

  // Restore display inner HTML (showFaqLoading replaces it with a spinner)
  var display = document.getElementById('faq-display-inner');
  if (display) {
    display.innerHTML =
        '<div class="faq-panel__display-deco" id="fpd-num" aria-hidden="true">01</div>'
        +
        '<span class="faq-panel__display-cat" id="fpd-category" hidden></span>'
        +
        '<h3 class="faq-panel__display-q" id="fpd-q"></h3>' +
        '<div class="faq-panel__display-body" id="fpd-body"></div>' +
        '<a href="#contact" class="faq-panel__display-cta">' +
        (typeof window.t === 'function' ? window.t('support.faq.stillNeedHelp') : 'Still need help? Contact us') +
        ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
        +
        '</a>';
  }

  renderNav(items);
  renderDisplay(0);
  initFaqSearch();

  // On mobile, open the first inline answer
  if (isMobileLayout()) {
    var firstAnswer = document.getElementById('faq-inline-0');
    if (firstAnswer) {
      firstAnswer.classList.add('is-open');
      firstAnswer.setAttribute('aria-hidden', 'false');
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   FAQ Search (debounced, synced across both search inputs)
   ───────────────────────────────────────────────────────────── */
function debounce(fn, ms) {
  var id;
  return function () {
    clearTimeout(id);
    var ctx = this;
    var args = arguments;
    id = setTimeout(function () {
      fn.apply(ctx, args);
    }, ms);
  };
}

function initFaqSearch() {
  var inputs = [
    document.getElementById('hero-faq-search'),
    document.getElementById('faq-search'),
  ].filter(Boolean);

  if (!inputs.length) {
    return;
  }

  inputs.forEach(function (input) {
    // Skip if clear button already injected (e.g. on FAQ retry)
    if (input.parentElement.querySelector('.search-bar__clear')) {
      return;
    }

    // Inject clear button
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'search-bar__clear';
    clearBtn.setAttribute('aria-label', 'Clear search');
    clearBtn.hidden = true;
    clearBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">'
        +
        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    input.parentElement.appendChild(clearBtn);

    clearBtn.addEventListener('click', function () {
      inputs.forEach(function (inp) {
        inp.value = '';
      });
      inputs.forEach(function (inp) {
        var cb = inp.parentElement.querySelector('.search-bar__clear');
        if (cb) {
          cb.hidden = true;
        }
      });
      filterFaq('');
      input.focus();
    });

    input.addEventListener('input', debounce(function () {
      var query = input.value.trim().toLowerCase();
      // Sync value to the other input
      inputs.forEach(function (inp) {
        if (inp !== input) {
          inp.value = input.value;
        }
        var cb = inp.parentElement.querySelector('.search-bar__clear');
        if (cb) {
          cb.hidden = inp.value === '';
        }
      });
      filterFaq(query);
    }, 200));
  });
}

function filterFaq(query) {
  var btns = document.querySelectorAll('.faq-panel__q');
  var panelEl = document.getElementById('faq-panel');
  var noResults = document.getElementById('faq-no-results');
  var visible = 0;

  btns.forEach(function (btn) {
    var text = btn.dataset.searchText || btn.querySelector(
        '.faq-panel__q-text').textContent.toLowerCase();
    var match = !query || text.includes(query);
    btn.hidden = !match;
    if (match) {
      visible++;
    }

    // Also hide/show the inline answer for hidden buttons
    var idx = btn.dataset.index;
    var inlineAnswer = document.getElementById('faq-inline-' + idx);
    if (inlineAnswer && !match) {
      inlineAnswer.classList.remove('is-open');
      inlineAnswer.setAttribute('aria-hidden', 'true');
    }
  });

  // Hide category labels whose questions are all hidden
  var catLabels = document.querySelectorAll('.faq-panel__category');
  catLabels.forEach(function (label) {
    var next = label.nextElementSibling;
    var hasVisibleQ = false;
    while (next && !next.classList.contains('faq-panel__category')) {
      if (next.classList.contains('faq-panel__q') && !next.hidden) {
        hasVisibleQ = true;
        break;
      }
      next = next.nextElementSibling;
    }
    label.hidden = !hasVisibleQ;
  });

  var isEmpty = visible === 0;
  if (panelEl) {
    panelEl.style.display = isEmpty ? 'none' : '';
  }
  if (noResults) {
    noResults.style.display = isEmpty ? 'block' : 'none';
  }

  // If the active item is now hidden, switch to the first visible one
  if (!isEmpty) {
    var visibleBtns = Array.from(btns).filter(function (b) {
      return !b.hidden;
    });
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
        b.setAttribute('aria-expanded', isFirst ? 'true' : 'false');
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
  if (!field) {
    return;
  }

  var errorId = fieldId + '-error';
  var errorEl = document.getElementById(errorId);

  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.id = errorId;
    errorEl.className = 'field-error';
    errorEl.setAttribute('aria-live', 'polite');
    field.parentElement.appendChild(errorEl);
    var existing = field.getAttribute('aria-describedby');
    field.setAttribute('aria-describedby',
        existing ? existing + ' ' + errorId : errorId);
  }

  errorEl.textContent = message;
  errorEl.hidden = !message;
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
  el.className = 'form-feedback form-feedback--' + type;
  el.textContent = (type === 'success' ? '\u2713 ' : '\u26A0 ') + message;
  el.hidden = false;
  if (type === 'success') {
    setTimeout(function () {
      el.hidden = true;
    }, 8000);
  }
}

function addFieldListeners(form) {
  form.querySelectorAll('.form-input[required]:not(select)').forEach(
      function (field) {
        field.addEventListener('input', function () {
          if (field.value.trim()) {
            setFieldError(field.id, '');
          }
        });
        field.addEventListener('blur', function () {
          var _t = typeof window.t === 'function' ? window.t.bind(window)
              : function (k) {
                return k;
              };
          if (!field.value.trim()) {
            setFieldError(field.id, _t('support.contact.errorRequired'));
          } else if (field.type === 'email' && !EMAIL_RE.test(
              field.value.trim())) {
            setFieldError(field.id, _t('support.contact.errorEmail'));
          }
        });
      });
}

function initCharCounter(textareaId, maxLength) {
  if (maxLength === undefined) {
    maxLength = 5000;
  }
  var textarea = document.getElementById(textareaId);
  if (!textarea) {
    return;
  }

  textarea.setAttribute('maxlength', maxLength);

  var counter = document.createElement('span');
  counter.id = textareaId + '-counter';
  counter.className = 'char-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');
  counter.textContent = '0 / ' + maxLength;
  textarea.parentElement.appendChild(counter);

  var existing = textarea.getAttribute('aria-describedby');
  textarea.setAttribute('aria-describedby',
      existing ? existing + ' ' + counter.id : counter.id);

  textarea.addEventListener('input', function () {
    var len = textarea.value.length;
    counter.textContent = len + ' / ' + maxLength;
    counter.classList.toggle('char-counter--warn', len > maxLength * 0.9);
  });
}

function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) {
    return;
  }

  var submitBtn = form.querySelector('button[type="submit"]');
  var lastSubmitTime = 0;
  var SUBMIT_COOLDOWN_MS = 30000;

  addFieldListeners(form);
  initCharCounter('contact-message', 5000);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var now = Date.now();
    var _t = typeof window.t === 'function' ? window.t.bind(window)
        : function (k) {
          return k;
        };
    if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
      var remaining = Math.ceil(
          (SUBMIT_COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
      showFormFeedback(form, 'error',
          _t('support.contact.errorCooldown').replace('{seconds}', remaining));
      return;
    }

    // Honeypot
    var honeypot = document.getElementById('contact-website');
    if (honeypot && honeypot.value) {
      form.reset();
      return;
    }

    var nameEl = document.getElementById('contact-name');
    var emailEl = document.getElementById('contact-email');
    var subjectEl = document.getElementById('contact-subject');
    var msgEl = document.getElementById('contact-message');
    var valid = true;

    if (!nameEl || !nameEl.value.trim()) {
      setFieldError('contact-name', _t('support.contact.errorNameRequired'));
      valid = false;
    }
    if (!emailEl || !emailEl.value.trim()) {
      setFieldError('contact-email', _t('support.contact.errorEmailRequired'));
      valid = false;
    } else if (!EMAIL_RE.test(emailEl.value.trim())) {
      setFieldError('contact-email', _t('support.contact.errorEmail'));
      valid = false;
    }
    if (!msgEl || !msgEl.value.trim()) {
      setFieldError('contact-message',
          _t('support.contact.errorMessageRequired'));
      valid = false;
    }
    if (subjectEl && !subjectEl.value) {
      setFieldError('contact-subject',
          _t('support.contact.errorSubjectRequired'));
      valid = false;
    }
    if (!valid) {
      return;
    }

    var origLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> '
        + _t('support.contact.sending');

    var tokenPromise = (typeof getGuestToken === 'function')
        ? getGuestToken().catch(function () {
          return null;
        })
        : Promise.resolve(null);

    tokenPromise
        .then(function (token) {
          if (!token) {
            showFormFeedback(form, 'error', _t('support.contact.errorNoToken'));
            return Promise.reject('no-token');
          }

          var abortCtrl = new AbortController();
          var timeoutId = setTimeout(function () {
            abortCtrl.abort();
          }, 15000);

          return fetch(API_BASE + '/api/v1/support/contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token,
            },
            signal: abortCtrl.signal,
            body: JSON.stringify({
              name: nameEl.value.trim(),
              email: emailEl.value.trim(),
              subject: subjectEl ? subjectEl.value.trim() : '',
              message: msgEl.value.trim(),
            }),
          }).finally(function () {
            clearTimeout(timeoutId);
          });
        })
        .then(function (res) {
          if (res.ok) {
            lastSubmitTime = Date.now();
            showFormFeedback(form, 'success',
                _t('support.contact.successMessage'));
            form.reset();
            form.querySelectorAll('[id$="-counter"]').forEach(function (el) {
              var parts = el.textContent.split('/');
              var max = parts[1] ? parts[1].trim() : '5000';
              el.textContent = '0 / ' + max;
              el.classList.remove('char-counter--warn');
            });
          } else {
            return res.json().catch(function () {
              return {};
            }).then(function (body) {
              showFormFeedback(form, 'error',
                  (body && body.message) || _t('support.contact.errorGeneric'));
            });
          }
        })
        .catch(function (err) {
          if (err === 'no-token') {
            return;
          } // already shown a message above
          console.error('[contact-form]', err);
          showFormFeedback(form, 'error', _t('support.contact.errorGeneric'));
        })
        .then(function () {
          // finally
          submitBtn.disabled = false;
          submitBtn.textContent = origLabel;
        });
  });
}

/* ─────────────────────────────────────────────────────────────
   Boot — called lazily by router on first navigation to /support/
   ───────────────────────────────────────────────────────────── */
var _supportInitialized = false;

window.initSupportPage = function () {
  if (_supportInitialized) return;
  _supportInitialized = true;

  var lang = window.SIMPHONIA_LANG || (navigator.language || 'en').split('-')[0].toLowerCase();
  _currentSupportLang = lang;
  loadFaqs(lang);
  initContactForm();
};

var _currentSupportLang = window.SIMPHONIA_LANG || (navigator.language || 'en').split('-')[0].toLowerCase();

// Reload FAQs when language changes
document.addEventListener('simphonia:langchange', function (e) {
  var newLang = (e.detail && e.detail.lang) || window.SIMPHONIA_LANG || 'en';
  if (newLang !== _currentSupportLang) {
    _currentSupportLang = newLang;
    // Clear old FAQ data so stale content is removed immediately
    faqData = [];
    activeIndex = 0;
    // Clear search inputs
    var searchInputs = [
      document.getElementById('hero-faq-search'),
      document.getElementById('faq-search'),
    ].filter(Boolean);
    searchInputs.forEach(function (inp) {
      inp.value = '';
    });
    // Hide no-results if visible
    var noResults = document.getElementById('faq-no-results');
    if (noResults) {
      noResults.style.display = 'none';
    }
    var panelEl = document.getElementById('faq-panel');
    if (panelEl) {
      panelEl.style.display = '';
    }
    // Reload FAQs in new language (shows loading spinner)
    loadFaqs(newLang);
  }
});
