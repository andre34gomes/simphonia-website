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
const API_BASE = (window.SIMPHONIA_API && window.SIMPHONIA_API.base)
    || 'https://api.simphonia.pt';
const getGuestToken = window.getGuestToken;

/* ─────────────────────────────────────────────────────────────
   State & Statics
   ───────────────────────────────────────────────────────────── */
let faqData = [];
let activeIndex = 0;
const FAQ_MOBILE_BP = 860;

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
  const flat = [];
  data.forEach(function (cat) {
    const catLabel = cat.category || cat.code || '';
    const items = Array.isArray(cat.items) ? cat.items : [];
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

// Delegates to the shared escHTML helper from layout.js when available (single source of truth).
// Falls back to inline implementation for test environments where window is not available.
// Defined as a local alias so all call-sites remain unchanged.
function escapeHtml(value) {
  if (typeof window !== 'undefined' && window && typeof window.escHTML === 'function') {
    return window.escHTML(String(value || ''));
  }
  return String(value || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function decodeFaqEntities(text) {
  return String(text || '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#x2F;/gi, '/');
}

function faqHtmlToText(html) {
  return decodeFaqEntities(String(html || ''))
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p\s*>/gi, '\n\n')
      .replace(/<\/div\s*>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '• ')
      .replace(/<\/li\s*>/gi, '\n')
      .replace(/<\/ul\s*>/gi, '\n')
      .replace(/<\/ol\s*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
}

function renderFaqAnswerContent(container, answerHtml) {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  const safeText = faqHtmlToText(answerHtml);
  if (!safeText) {
    return;
  }

  safeText.split(/\n+/).map(function (line) {
    return line.trim();
  }).filter(Boolean).forEach(function (line) {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    container.appendChild(paragraph);
  });
}

/* ─────────────────────────────────────────────────────────────
   FAQ Panel — render
   ───────────────────────────────────────────────────────────── */
function renderNav(items) {
  const nav = document.getElementById('faq-panel-nav');
  if (!nav) {
    return;
  }

  nav.innerHTML = '';

  let lastCategory = null;

  items.forEach(function (item, i) {
    // Insert a category label when the category changes
    if (item.category && item.category !== lastCategory) {
      lastCategory = item.category;
      const label = document.createElement('div');
      label.className = 'faq-panel__category';
      label.textContent = item.category;
      nav.appendChild(label);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'faq-panel__q' + (i === 0 ? ' is-active' : '');
    btn.dataset.index = i;
    // Include answer text (HTML-stripped) in search index for better discoverability
    const plainAnswer = faqHtmlToText(item.a);
    btn.dataset.searchText = (item.q + ' ' + plainAnswer + ' ' + (item.category
        || '')).toLowerCase();
    btn.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-controls', 'faq-inline-' + i);
    btn.innerHTML =
        '<span class="faq-panel__q-num">' + String(i + 1).padStart(2, '0')
        + '</span>' +
        '<span class="faq-panel__q-text">' + escapeHtml(item.q) + '</span>' +
        '<svg class="faq-panel__q-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
    btn.addEventListener('click', function () {
      switchFaq(i);
    });
    nav.appendChild(btn);

    // Inline answer container for mobile accordion
    const answer = document.createElement('div');
    answer.className = 'faq-panel__inline-answer';
    answer.id = 'faq-inline-' + i;
    answer.setAttribute('aria-hidden', 'true');

    const answerInner = document.createElement('div');
    answerInner.className = 'faq-panel__inline-answer-inner';

    if (item.category) {
      const categoryLabel = document.createElement('span');
      categoryLabel.className = 'faq-panel__display-cat';
      categoryLabel.textContent = item.category;
      answerInner.appendChild(categoryLabel);
    }

    const answerBody = document.createElement('div');
    answerBody.className = 'faq-panel__answer-body';
    renderFaqAnswerContent(answerBody, item.a);
    answerInner.appendChild(answerBody);

    const cta = document.createElement('a');
    cta.href = '#contact';
    cta.className = 'faq-panel__display-cta';
    cta.innerHTML =
        escapeHtml(window.t('support.faq.stillNeedHelp')) +
        ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
    answerInner.appendChild(cta);
    answer.appendChild(answerInner);
    nav.appendChild(answer);
  });

  if (!nav._keydownBound) {
    nav.addEventListener('keydown', handleNavKeydown);
    nav._keydownBound = true;
  }
}

function handleNavKeydown(e) {
  const btns = Array.from(
      e.currentTarget.querySelectorAll('.faq-panel__q:not([hidden])'));
  const focused = document.activeElement;
  const idx = btns.indexOf(focused);
  if (idx === -1) {
    return;
  }

  let next = -1;
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
  const item = faqData[index];
  if (!item) {
    return;
  }

  const numEl = document.getElementById('fpd-num');
  const qEl = document.getElementById('fpd-q');
  const bodyEl = document.getElementById('fpd-body');
  const catEl = document.getElementById('fpd-category');

  if (numEl) {
    numEl.textContent = String(index + 1).padStart(2, '0');
  }
  if (qEl) {
    qEl.textContent = item.q;
  }
  if (bodyEl) {
    renderFaqAnswerContent(bodyEl, item.a);
  }
  if (catEl) {
    catEl.textContent = item.category || '';
    catEl.hidden = !item.category;
  }
}

function switchFaq(index) {
  const mobile = isMobileLayout();

  // On mobile, allow toggling the same item to collapse it
  if (mobile && index === activeIndex) {
    const activeAnswer = document.getElementById('faq-inline-' + index);
    const activeBtn = document.querySelector(
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
    const inner = document.getElementById('faq-display-inner');
    if (!inner) {
      return;
    }

    inner.classList.add('is-switching');

    setTimeout(function () {
      activeIndex = index;
      renderDisplay(index);

      document.querySelectorAll('.faq-panel__q').forEach(function (btn) {
        const isActive = parseInt(btn.dataset.index, 10) === index;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      });

      inner.classList.remove('is-switching');
    }, 180);
  } else {
    // Mobile: open inline answer
    activeIndex = index;

    document.querySelectorAll('.faq-panel__q').forEach(function (btn) {
      const isActive = parseInt(btn.dataset.index, 10) === index;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    const answer = document.getElementById('faq-inline-' + index);
    if (answer) {
      answer.classList.add('is-open');
      answer.setAttribute('aria-hidden', 'false');

      // Smooth scroll the opened question into view
      const btn = document.querySelector(
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
  const nav = document.getElementById('faq-panel-nav');
  const display = document.getElementById('faq-display-inner');
  const panel = document.getElementById('faq-panel');
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
        '<p class="faq-panel__state-desc">' + window.t('support.faq.loading') + '</p>' +
        '</div>';
  }
}

function showFaqError(lang) {
  const nav = document.getElementById('faq-panel-nav');
  const display = document.getElementById('faq-display-inner');
  const panel = document.getElementById('faq-panel');
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
        '<h3 class="faq-panel__state-title">' + window.t('support.faq.errorTitle') + '</h3>'
        +
        '<p class="faq-panel__state-desc">' + window.t('support.faq.errorDesc').replace('\n', '<br>')
        + '</p>' +
        '<button class="btn btn--outline btn--sm" id="faq-retry">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        +
        '<polyline points="23 4 23 10 17 10"/>' +
        '<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' +
        '</svg>' +
        window.t('support.faq.tryAgain') +
        '</button>' +
        '</div>';
    const retryBtn = document.getElementById('faq-retry');
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
  const resolvedLang = lang || window.SIMPHONIA_LANG || 'en';
  const url = API_BASE + '/api/v1/faqs?lang=' + resolvedLang;
  const headers = {'Accept': 'application/json'};
  const abortCtrl = new AbortController();
  const timeoutId = setTimeout(function () {
    abortCtrl.abort();
  }, 10000);

  showFaqLoading();

  const tokenPromise = (typeof getGuestToken === 'function')
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
        const items = normaliseFaqResponse(
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

  const panel = document.getElementById('faq-panel');
  if (panel) {
    panel.classList.remove('faq-panel--state');
  }

  // Restore display inner HTML (showFaqLoading replaces it with a spinner)
  const display = document.getElementById('faq-display-inner');
  if (display) {
    display.innerHTML =
        '<div class="faq-panel__display-deco" id="fpd-num" aria-hidden="true">01</div>'
        +
        '<span class="faq-panel__display-cat" id="fpd-category" hidden></span>'
        +
        '<h3 class="faq-panel__display-q" id="fpd-q"></h3>' +
        '<div class="faq-panel__display-body" id="fpd-body"></div>' +
        '<a href="#contact" class="faq-panel__display-cta">' +
        window.t('support.faq.stillNeedHelp') +
        ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
        +
        '</a>';
  }

  renderNav(items);
  renderDisplay(0);
  initFaqSearch();

  // On mobile, open the first inline answer
  if (isMobileLayout()) {
    const firstAnswer = document.getElementById('faq-inline-0');
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
  let id;
  return function () {
    clearTimeout(id);
    const ctx = this;
    const args = arguments;
    id = setTimeout(function () {
      fn.apply(ctx, args);
    }, ms);
  };
}

function initFaqSearch() {
  const inputs = [
    document.getElementById('hero-faq-search'),
    document.getElementById('faq-search'),
  ].filter(Boolean);
  const _t = typeof window.t === 'function' ? window.t.bind(window) : function () {
    return '';
  };

  if (!inputs.length) {
    return;
  }

  inputs.forEach(function (input) {
    // Skip if clear button already injected (e.g. on FAQ retry)
    if (input.parentElement.querySelector('.search-bar__clear')) {
      return;
    }

    // Inject clear button
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'search-bar__clear';
    clearBtn.setAttribute('aria-label', _t('accessibility.clearSearch'));
    clearBtn.setAttribute('data-i18n-aria-label', 'accessibility.clearSearch');
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
        const cb = inp.parentElement.querySelector('.search-bar__clear');
        if (cb) {
          cb.hidden = true;
        }
      });
      filterFaq('');
      input.focus();
    });

    input.addEventListener('input', debounce(function () {
      const query = input.value.trim().toLowerCase();
      // Sync value to the other input
      inputs.forEach(function (inp) {
        if (inp !== input) {
          inp.value = input.value;
        }
        const cb = inp.parentElement.querySelector('.search-bar__clear');
        if (cb) {
          cb.hidden = inp.value === '';
        }
      });
      filterFaq(query);
    }, 200));
  });
}

function filterFaq(query) {
  const btns = document.querySelectorAll('.faq-panel__q');
  const panelEl = document.getElementById('faq-panel');
  const noResults = document.getElementById('faq-no-results');
  let visible = 0;

  btns.forEach(function (btn) {
    const text = btn.dataset.searchText || btn.querySelector(
        '.faq-panel__q-text').textContent.toLowerCase();
    const match = !query || text.includes(query);
    btn.hidden = !match;
    if (match) {
      visible++;
    }

    // Also hide/show the inline answer for hidden buttons
    const idx = btn.dataset.index;
    const inlineAnswer = document.getElementById('faq-inline-' + idx);
    if (inlineAnswer && !match) {
      inlineAnswer.classList.remove('is-open');
      inlineAnswer.setAttribute('aria-hidden', 'true');
    }
  });

  // Hide category labels whose questions are all hidden
  const catLabels = document.querySelectorAll('.faq-panel__category');
  catLabels.forEach(function (label) {
    let next = label.nextElementSibling;
    let hasVisibleQ = false;
    while (next && !next.classList.contains('faq-panel__category')) {
      if (next.classList.contains('faq-panel__q') && !next.hidden) {
        hasVisibleQ = true;
        break;
      }
      next = next.nextElementSibling;
    }
    label.hidden = !hasVisibleQ;
  });

  const isEmpty = visible === 0;
  if (panelEl) {
    panelEl.style.display = isEmpty ? 'none' : '';
  }
  if (noResults) {
    noResults.style.display = isEmpty ? 'block' : 'none';
  }

  // If the active item is now hidden, switch to the first visible one
  if (!isEmpty) {
    const visibleBtns = Array.from(btns).filter(function (b) {
      return !b.hidden;
    });
    const stillActive = visibleBtns.some(function (b) {
      return parseInt(b.dataset.index, 10) === activeIndex;
    });
    if (!stillActive && visibleBtns.length) {
      const newIdx = parseInt(visibleBtns[0].dataset.index, 10);
      activeIndex = newIdx;
      renderDisplay(newIdx);
      visibleBtns.forEach(function (b, i) {
        const isFirst = i === 0;
        b.classList.toggle('is-active', isFirst);
        b.setAttribute('aria-expanded', isFirst ? 'true' : 'false');
      });
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   Contact Form
   ───────────────────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) {
    return;
  }

  const errorId = fieldId + '-error';
  let errorEl = document.getElementById(errorId);

  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.id = errorId;
    errorEl.className = 'field-error';
    errorEl.setAttribute('aria-live', 'polite');
    field.parentElement.appendChild(errorEl);
    const existing = field.getAttribute('aria-describedby');
    field.setAttribute('aria-describedby',
        existing ? existing + ' ' + errorId : errorId);
  }

  errorEl.textContent = message;
  errorEl.hidden = !message;
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
          const _t = typeof window.t === 'function' ? window.t.bind(window)
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
  const textarea = document.getElementById(textareaId);
  if (!textarea) {
    return;
  }

  textarea.setAttribute('maxlength', maxLength);

  const counter = document.createElement('span');
  counter.id = textareaId + '-counter';
  counter.className = 'char-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');
  counter.textContent = '0 / ' + maxLength;
  textarea.parentElement.appendChild(counter);

  const existing = textarea.getAttribute('aria-describedby');
  textarea.setAttribute('aria-describedby',
      existing ? existing + ' ' + counter.id : counter.id);

  textarea.addEventListener('input', function () {
    const len = textarea.value.length;
    counter.textContent = len + ' / ' + maxLength;
    counter.classList.toggle('char-counter--warn', len > maxLength * 0.9);
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) {
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  let lastSubmitTime = 0;
  const SUBMIT_COOLDOWN_MS = 30000;

  addFieldListeners(form);
  initCharCounter('contact-message', 5000);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const now = Date.now();
    const _t = typeof window.t === 'function' ? window.t.bind(window)
        : function (k) {
          return k;
        };
    if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
      const remaining = Math.ceil(
          (SUBMIT_COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
      showFormFeedback(form, 'error',
          _t('support.contact.errorCooldown').replace('{seconds}', remaining));
      return;
    }

    // Honeypot
    const honeypot = document.getElementById('contact-website');
    if (honeypot && honeypot.value) {
      form.reset();
      return;
    }

    const nameEl = document.getElementById('contact-name');
    const emailEl = document.getElementById('contact-email');
    const subjectEl = document.getElementById('contact-subject');
    const msgEl = document.getElementById('contact-message');
    let valid = true;

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

    const origLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> '
        + _t('support.contact.sending');

    const tokenPromise = (typeof getGuestToken === 'function')
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

          const abortCtrl = new AbortController();
          const timeoutId = setTimeout(function () {
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
              const parts = el.textContent.split('/');
              const max = parts[1] ? parts[1].trim() : '5000';
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
let _supportInitialized = false;

window.initSupportPage = function () {
  if (_supportInitialized) return;
  _supportInitialized = true;

  const lang = window.SIMPHONIA_LANG || (navigator.language || 'en').split('-')[0].toLowerCase();
  _currentSupportLang = lang;
  loadFaqs(lang);
  initContactForm();
};

let _currentSupportLang = window.SIMPHONIA_LANG || (navigator.language || 'en').split('-')[0].toLowerCase();

// Reload FAQs when language changes
document.addEventListener('simphonia:langchange', function (e) {
  const newLang = (e.detail && e.detail.lang) || window.SIMPHONIA_LANG || 'en';
  if (newLang !== _currentSupportLang) {
    _currentSupportLang = newLang;
    // Clear old FAQ data so stale content is removed immediately
    faqData = [];
    activeIndex = 0;
    // Clear search inputs
    const searchInputs = [
      document.getElementById('hero-faq-search'),
      document.getElementById('faq-search'),
    ].filter(Boolean);
    searchInputs.forEach(function (inp) {
      inp.value = '';
    });
    // Hide no-results if visible
    const noResults = document.getElementById('faq-no-results');
    if (noResults) {
      noResults.style.display = 'none';
    }
    const panelEl = document.getElementById('faq-panel');
    if (panelEl) {
      panelEl.style.display = '';
    }
    // Reload FAQs in new language (shows loading spinner)
    loadFaqs(newLang);
  }
});
