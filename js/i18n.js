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
  var _lang = DEFAULT;
  var _resolveReady;

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

  /**
   * Resolve a dotted key path against the loaded translation data.
   * Returns the key itself if no translation is found.
   * Supports a simple placeholder syntax: t('key', { count: 5 })
   */
  function t(key, vars) {
    var parts = key.split('.');
    var cur = _data;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return key;
      cur = cur[parts[i]];
    }
    if (cur == null) return key;
    var str = String(cur);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return str;
  }

  // ── DOM application ─────────────────────────────────────────────────────

  function applyAll() {
    // Update <html lang>
    document.documentElement.lang = _lang;

    // [data-i18n]             → textContent
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v !== el.getAttribute('data-i18n')) el.textContent = v;
    });

    // [data-i18n-html]        → innerHTML (use sparingly, only safe HTML)
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-html'));
      if (v !== el.getAttribute('data-i18n-html')) el.innerHTML = v;
    });

    // [data-i18n-placeholder] → placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-placeholder'));
      if (v !== el.getAttribute('data-i18n-placeholder')) el.placeholder = v;
    });

    // [data-i18n-aria-label]  → aria-label attribute
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-aria-label'));
      if (v !== el.getAttribute('data-i18n-aria-label')) el.setAttribute('aria-label', v);
    });

    // Update language switcher state (if already in DOM)
    var picker = document.getElementById('lang-picker-btn');
    if (picker) {
      picker.setAttribute('aria-label', t('lang.select') + ': ' + _lang.toUpperCase());
    }
    var menu = document.getElementById('lang-picker-menu');
    if (menu) {
      menu.querySelectorAll('.lang-picker__option').forEach(function (opt) {
        opt.classList.toggle('lang-picker__option--active', opt.dataset.lang === _lang);
        opt.setAttribute('aria-current', opt.dataset.lang === _lang ? 'true' : 'false');
      });
    }

    // Notify other modules (e.g. support.js reloads FAQs on lang change)
    try {
      document.dispatchEvent(new CustomEvent('simphonia:langchange', {
        detail: { lang: _lang },
        bubbles: false,
      }));
    } catch (_) {}
  }

  // ── Base-path detection ─────────────────────────────────────────────────

  function basePath() {
    // Reuse the layout.js helper if available (avoids duplicating logic)
    if (typeof window.getBasePath === 'function') return window.getBasePath();
    var p = window.location.pathname;
    if (p === '/' || p === '/index.html') return './';
    var inner = /\/(destinations|how-it-works|support|about|privacy|terms)(\/|\/index\.html)?$/.test(p);
    return inner ? '../' : './';
  }

  // ── Fetch + apply translations ──────────────────────────────────────────

  function load(lang, isRetry) {
    var url = basePath() + 'js/i18n/' + lang + '.json?v=20260401';
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        _data = data;
        _lang = lang;
        window.SIMPHONIA_LANG = lang;
        try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
        applyAll();
        if (_resolveReady) { _resolveReady(lang); _resolveReady = null; }
      })
      .catch(function (err) {
        if (!isRetry && lang !== DEFAULT) {
          console.warn('[i18n] Failed to load "' + lang + '", falling back to "' + DEFAULT + '":', err.message);
          return load(DEFAULT, true);
        }
        console.error('[i18n] Could not load default translations:', err);
        if (_resolveReady) { _resolveReady(DEFAULT); _resolveReady = null; }
      });
  }

  // ── Public API ──────────────────────────────────────────────────────────

  function setLang(code) {
    if (SUPPORTED.indexOf(code) === -1) return;
    load(code, false);
  }

  // ── Initialise ──────────────────────────────────────────────────────────

  _lang = detect();
  window.SIMPHONIA_LANG = _lang;

  // Export public surface immediately so layout.js and others can call t()
  // even before the async fetch completes (returns the key as fallback).
  Object.assign(window, {
    t: t,
    setLang: setLang,
    i18nReady: i18nReady,
    SIMPHONIA_LANG: _lang,
    SIMPHONIA_SUPPORTED_LANGS: SUPPORTED,
  });

  // Start loading translations (async — fires in background)
  load(_lang, false);

}());



