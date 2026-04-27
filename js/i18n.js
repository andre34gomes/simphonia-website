/**
 * Simphonia Website — i18n (Internationalisation) Module
 *
 * Exposes (on window):
 *   t(key)                  — resolve a dotted translation key to its string
 *   setLang(code)           — change language, reload translations, re-render
 *   SIMPHONIA_LANG          — active language code (e.g. 'pt')
 *   i18nReady               — Promise that resolves once the first load completes
 *   SIMPHONIA_SUPPORTED_LANGS — array of supported language codes
 *
 * Loading order: this file must run BEFORE layout.js so that translations
 * are available when the nav / footer are injected. Add it as the first
 * defer script in every HTML page.
 */

(function () {
  'use strict';

  var LANG_KEY = 'simphonia-lang';
  var SUPPORTED = [
    'en', 'pt', 'es', 'fr', 'de', 'it', 'nl',
    'ja', 'zh', 'ko', 'ar', 'ru', 'tr', 'pl',
    'uk', 'hi', 'id', 'vi', 'cs', 'hu', 'fa',
  ];
  var DEFAULT = 'en';

  var _data = {};
  var _fallbackData = {};
  var _lang = DEFAULT;
  var _resolveReady;
  var _initialLoadDone = false;

  var i18nReady = new Promise(function (resolve) {
    _resolveReady = resolve;
  });

  // ── Language detection ──────────────────────────────────────────────────

  function detect() {
    // 1. Persisted user preference
    try {
      var stored = localStorage.getItem(LANG_KEY);
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    } catch (_) {}

    // 2. Browser language list
    var langs = (navigator.languages && navigator.languages.length)
      ? Array.prototype.slice.call(navigator.languages)
      : [navigator.language || DEFAULT];

    for (var i = 0; i < langs.length; i++) {
      var code = langs[i].split('-')[0].toLowerCase();
      if (SUPPORTED.indexOf(code) !== -1) return code;
    }

    return DEFAULT;
  }

  // ── Translation lookup ──────────────────────────────────────────────────

  function lookup(key) {
    return lookupFrom(_data, key);
  }

  function lookupFrom(source, key) {
    var parts = key.split('.');
    var cur = source;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  /**
   * Resolve a dotted key path against the loaded translation data.
   * Supports a simple placeholder syntax: t('key', { count: 5 })
   * Returns undefined when no translation exists.
   */
  function t(key, vars) {
    var cur = lookup(key);
    if (cur === '' || cur == null) cur = lookupFrom(_fallbackData, key);
    if (cur == null) return undefined;
    if (typeof cur !== 'string') return cur;
    var str = String(cur);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return str;
  }

  // ── DOM application ─────────────────────────────────────────────────────

  var RTL_LANGS = ['ar', 'fa'];

  function textValue(key) {
    var value = t(key);
    return typeof value === 'string' ? value : '';
  }

  function applyTranslatedAttribute(selector, attributeName) {
    document.querySelectorAll(selector).forEach(function (el) {
      var key = el.getAttribute(selector.slice(1, -1));
      var value = textValue(key);
      if (attributeName === 'textContent') {
        el.textContent = value;
        return;
      }
      if (attributeName === 'innerHTML') {
        el.innerHTML = value;
        return;
      }
      if (attributeName === 'value') {
        el.value = value;
        return;
      }
      el.setAttribute(attributeName, value);
    });
  }

  function applyAll() {
    // Update <html lang> and direction
    document.documentElement.lang = _lang;
    document.documentElement.dir = RTL_LANGS.indexOf(_lang) !== -1 ? 'rtl' : 'ltr';

    // [data-i18n]             → textContent
    applyTranslatedAttribute('[data-i18n]', 'textContent');

    // [data-i18n-html]        → innerHTML (use sparingly, only safe HTML)
    applyTranslatedAttribute('[data-i18n-html]', 'innerHTML');

    // [data-i18n-placeholder] → placeholder attribute
    applyTranslatedAttribute('[data-i18n-placeholder]', 'placeholder');

    // [data-i18n-aria-label]  → aria-label attribute
    applyTranslatedAttribute('[data-i18n-aria-label]', 'aria-label');

    // [data-i18n-alt]         → alt attribute (images)
    applyTranslatedAttribute('[data-i18n-alt]', 'alt');

    // [data-i18n-title]       → title attribute
    applyTranslatedAttribute('[data-i18n-title]', 'title');

    // [data-i18n-content]     → content attribute (e.g. meta tags)
    applyTranslatedAttribute('[data-i18n-content]', 'content');

    // [data-i18n-value]       → value attribute (e.g. <option>)
    applyTranslatedAttribute('[data-i18n-value]', 'value');

    // Update language switcher state (if already in DOM)
    var picker = document.getElementById('lang-picker-btn');
    if (picker) {
        picker.setAttribute('aria-label', textValue('lang.select') + ': ' + _lang.toUpperCase());
    }
    var menu = document.getElementById('lang-picker-menu');
    if (menu) {
      menu.querySelectorAll('.lang-picker__option').forEach(function (opt) {
        opt.classList.toggle('lang-picker__option--active', opt.dataset.lang === _lang);
        opt.setAttribute('aria-current', opt.dataset.lang === _lang ? 'true' : 'false');
      });
    }

    // Notify other modules (e.g. support.js reloads FAQs on lang change).
    // Skip the event on the very first load — page scripts have already made
    // their initial API calls by the time this fires, so dispatching the event
    // would cause every endpoint to be fetched a second time.
    if (_initialLoadDone) {
      try {
        document.dispatchEvent(new CustomEvent('simphonia:langchange', {
          detail: { lang: _lang },
          bubbles: false,
        }));
      } catch (_) {}
    }
    _initialLoadDone = true;
  }

  // ── Base-path detection ─────────────────────────────────────────────────

  function basePath() {
    // SPA mode: always use absolute root path
    if (window.__SPA_MODE || typeof window.getBasePath === 'function') return '/';
    // Fallback for standalone pages (e.g. 404.html)
    var p = window.location.pathname;
    if (p === '/' || p === '/index.html') return './';
    return /\/(destinations|how-it-works|support|about|privacy|terms)(\/|\/index\.html)?$/.test(p)
      ? '../' : './';
  }

  // ── Fetch + apply translations ──────────────────────────────────────────

  function load(lang) {
    var url = basePath() + 'js/i18n/' + lang + '.json?v=20260403';
    var fetchJson = function (targetUrl) {
      return fetch(targetUrl)
        .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
        });
    };

    var fallbackPromise = lang === DEFAULT
      ? Promise.resolve(null)
      : fetchJson(basePath() + 'js/i18n/' + DEFAULT + '.json?v=20260403')
        .catch(function (err) {
          console.warn('[i18n] Failed to load English fallback translations:', err);
          return null;
        });

    return Promise.all([fetchJson(url), fallbackPromise])
      .then(function (results) {
        var data = results[0];
        var fallbackData = results[1];
        _data = data;
        _fallbackData = fallbackData || data;
        _lang = lang;
        window.SIMPHONIA_LANG = lang;
        try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
        applyAll();
        if (_resolveReady) { _resolveReady(lang); _resolveReady = null; }
      })
      .catch(function (err) {
        console.error('[i18n] Failed to load translations for "' + lang + '":', err);
        if (_resolveReady) { _resolveReady(lang); _resolveReady = null; }
      });
  }

  // ── Public API ──────────────────────────────────────────────────────────

  function setLang(code) {
    if (SUPPORTED.indexOf(code) === -1) return;
    load(code);
  }

  // ── Initialise ──────────────────────────────────────────────────────────

  _lang = detect();
  window.SIMPHONIA_LANG = _lang;

  // Export public surface immediately so layout.js and others can call t()
  // once translations are ready without any key/default fallback behavior.
  Object.assign(window, {
    applyTranslations: applyAll,
    i18nLookup: lookup,
    t: t,
    setLang: setLang,
    i18nReady: i18nReady,
    SIMPHONIA_LANG: _lang,
    SIMPHONIA_SUPPORTED_LANGS: SUPPORTED,
  });

  // Start loading translations (async — fires in background)
  load(_lang);

}());



