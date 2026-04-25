/**
 * Simphonia — Destinations Page Logic
 *
 * Handles: region tabs, country grid, search/filter, API fetches.
 * Depends on: layout.js (window.SIMPHONIA_API, window.flagEmoji, window.escHTML)
 *             auth.js   (window.getGuestToken)
 *
 * In SPA mode, the boot is lazy — called via window.initDestinationsPage()
 * by the router on first navigation to /destinations/.
 */

'use strict';

(function () {

// ── Config ─────────────────────────────────────────────────────────────────
const CURRENCY = 'EUR';

function getApiBase() {
  return (window.SIMPHONIA_API && window.SIMPHONIA_API.base) || 'https://api.simphonia.pt';
}

// Language: use i18n module if loaded, otherwise fall back to browser language
function getLang() {
  return window.SIMPHONIA_LANG || (navigator.language || 'en').split('-')[0];
}

// Translation helper
function _t(key) {
  return typeof window.t === 'function' ? window.t(key) : undefined;
}

function regionLabel(code) {
  var label = _t('destinations.regions.' + code);
  return typeof label === 'string' ? label : code;
}

const flagEmoji = window.flagEmoji;
const esc = window.escHTML;

function resolveImage(url) {
  if (!url) return null;
  const API_BASE = getApiBase();
  if (url.startsWith('http') || url.startsWith('//')) return url;
  return API_BASE + (url.startsWith('/') ? url : '/' + url);
}

async function apiFetch(path, _retried) {
  if (_retried === undefined) _retried = false;
  const API_BASE = getApiBase();
  const getGuestToken = window.getGuestToken;
  const token = await getGuestToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, 10000);

  try {
    const res = await fetch(API_BASE + path, {
      headers: { Authorization: 'Bearer ' + token },
      signal: controller.signal,
    });

    if (res.status === 401 && !_retried) {
      try {
        sessionStorage.removeItem('simphonia_guest_token');
        sessionStorage.removeItem('simphonia_guest_expiry');
      } catch (_) { /* Private browsing — storage may be unavailable */ }
      return apiFetch(path, true);
    }

    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const envelope = await res.json();
    return envelope.data ?? envelope;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── State ─────────────────────────────────────────────────────────────────
let allCountries = [];
let displayedCountries = [];
let activeRegionCode = null;
let _fetchSeq = 0;

// ── DOM refs (resolved lazily inside init) ────────────────────────────────
let regionTabsContainer, grid, noResults, noResultsQ, countEl, searchInput, clearBtn, noResultsClear;

function resolveRefs() {
  regionTabsContainer = document.getElementById('region-tabs');
  grid                = document.getElementById('dest-grid');
  noResults           = document.getElementById('no-results');
  noResultsQ          = document.getElementById('no-results-query');
  countEl             = document.getElementById('dest-count');
  searchInput         = document.getElementById('dest-search');
  clearBtn            = document.getElementById('dest-search-clear');
  noResultsClear      = document.getElementById('no-results-clear');
}

// ── Loading / error states ───────────────────────────────────────────────
function setLoading(on) {
  if (!grid) return;
  if (on) {
    grid.innerHTML =
      '<div class="dest-state dest-state--loading">' +
      '<div class="dest-state__icon dest-state__icon--spin">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<line x1="2" y1="12" x2="22" y2="12"/>' +
      '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
      '</svg>' +
      '</div>' +
      '<p class="dest-state__desc">' + _t('destinations.loading') + '</p>' +
      '</div>';
    if (countEl) countEl.textContent = '';
    if (noResults) noResults.style.display = 'none';
  }
}

function showFetchError() {
  if (!grid) return;
  grid.innerHTML =
    '<div class="dest-state dest-state--error">' +
    '<div class="dest-state__icon">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/>' +
    '<line x1="2" y1="12" x2="22" y2="12"/>' +
    '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
    '</svg>' +
    '</div>' +
    '<h3 class="dest-state__title">' + _t('destinations.error.title') + '</h3>' +
    '<p class="dest-state__desc">' + _t('destinations.error.desc').replace('\n', '<br>') + '</p>' +
    '<button class="btn btn--outline btn--sm dest-state__retry" id="dest-retry">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="23 4 23 10 17 10"/>' +
    '<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' +
    '</svg>' +
    _t('destinations.error.tryAgain') +
    '</button>' +
    '</div>';
  var retryBtn = document.getElementById('dest-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      if (activeRegionCode) {
        loadCountriesForRegion(activeRegionCode);
      } else {
        loadAllCountries();
      }
    });
  }
}

// ── Render grid ───────────────────────────────────────────────────────────
function renderGrid(items) {
  if (!grid) return;
  grid.textContent = '';
  var total = displayedCountries.length;
  var query = searchInput ? searchInput.value.trim() : '';

  if (noResults) noResults.style.display = items.length === 0 ? 'flex' : 'none';
  if (noResultsQ) noResultsQ.textContent = query
    ? '\u201C' + query + '\u201D'
    : (regionLabel(activeRegionCode) || _t('destinations.grid.allTab'));

  if (countEl) countEl.textContent = items.length === 0
    ? ''
    : items.length === total
      ? total + ' ' + _t('destinations.count.countries')
      : items.length + ' ' + _t('destinations.count.of') + ' ' + total + ' ' + _t('destinations.count.countries');

  var frag = document.createDocumentFragment();
  items.forEach(function (d, i) {
    var code = d.countryCode || '';
    var name = d.countryName || code;
    var flag = flagEmoji(code);
    var img = resolveImage(d.imageUrl);

    var card = document.createElement('div');
    card.className = 'dest-card';
    card.setAttribute('role', 'article');
    var safeName = esc(name);
    card.setAttribute('aria-label', name);
    card.style.animationDelay = Math.min(i, 12) * 40 + 'ms';
    card.innerHTML =
      '<div class="dest-card__img-wrap">' +
      (img
        ? '<img src="' + esc(img) + '" alt="' + safeName + '" class="dest-card__img" width="400" height="180" loading="lazy" decoding="async">'
        : '<div class="dest-card__img" style="background:linear-gradient(135deg,var(--bg-elevated),var(--border-subtle));" aria-hidden="true"></div>') +
      (d.discount ? '<span class="dest-card__discount">-' + parseInt(d.discount, 10) + '%</span>' : '') +
      '</div>' +
      '<div class="dest-card__body">' +
      '<div class="dest-card__name">' + (flag || '') + safeName + '</div>' +
      (d.planCount ? '<div class="dest-card__plans">' + d.planCount + ' ' + _t('common.plansAvailable') + '</div>' : '') +
      (d.startingPrice ? '<div class="dest-card__price">' + _t('common.from') + ' \u20AC' + Number(d.startingPrice).toFixed(2) + '</div>' : '') +
      '</div>';
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

// ── Filter + search ───────────────────────────────────────────────────────
function applySearch() {
  if (!searchInput) return;
  var query = searchInput.value.toLowerCase().trim();
  if (clearBtn) clearBtn.hidden = !query;
  var filtered = query
    ? displayedCountries.filter(function (d) {
      var name = (d.countryName || '').toLowerCase();
      var code = (d.countryCode || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    })
    : displayedCountries;
  renderGrid(filtered);
}

// ── API calls ─────────────────────────────────────────────────────────────
async function loadAllCountries() {
  const seq = ++_fetchSeq;
  setLoading(true);
  try {
    const data = await apiFetch('/api/v1/countries/all?currency=' + CURRENCY + '&lang=' + getLang());
    if (seq !== _fetchSeq) return;
    allCountries = data;
    displayedCountries = allCountries;
    applySearch();
  } catch (err) {
    if (seq !== _fetchSeq) return;
    console.error('[destinations] Failed to load countries:', err);
    showFetchError();
  }
}

async function loadCountriesForRegion(regionCode) {
  const seq = ++_fetchSeq;
  setLoading(true);
  try {
    const data = await apiFetch(
      '/api/v1/regions/' + regionCode + '/countries?currency=' + CURRENCY + '&lang=' + getLang()
    );
    if (seq !== _fetchSeq) return;
    displayedCountries = data;
    applySearch();
  } catch (err) {
    if (seq !== _fetchSeq) return;
    console.error('[destinations] Failed to load region countries:', err);
    showFetchError();
  }
}

async function buildRegionTabs() {
  if (!regionTabsContainer) return;
  try {
    regionTabsContainer.querySelectorAll('.filter-tab:not([data-region="all"])').forEach(function (tab) {
      tab.remove();
    });

    var regions = await apiFetch('/api/v1/regions?currency=' + CURRENCY);
    regions.forEach(function (r) {
      var label = regionLabel(r.regionCode);
      var btn = document.createElement('button');
      btn.className = 'filter-tab';
      btn.dataset.region = r.regionCode;
      btn.textContent = label;
      regionTabsContainer.appendChild(btn);
    });
    if (regions.length) {
      regionTabsContainer.classList.add('filter-tabs--shown');
    }
  } catch (err) {
    console.error('[destinations] Failed to load regions:', err);
  }
}

// ── Event listeners ───────────────────────────────────────────────────────
function bindEvents() {
  if (regionTabsContainer && !regionTabsContainer._destBound) {
    regionTabsContainer._destBound = true;
    regionTabsContainer.addEventListener('click', function (e) {
      if (!e.target || typeof e.target.closest !== 'function') return;
      var tab = e.target.closest('.filter-tab');
      if (!tab) return;

      regionTabsContainer.querySelectorAll('.filter-tab')
        .forEach(function (t) { t.classList.remove('filter-tab--active'); });
      tab.classList.add('filter-tab--active');

      var code = tab.dataset.region;
      activeRegionCode = code === 'all' ? null : code;
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.hidden = true;

      if (!activeRegionCode) {
        displayedCountries = allCountries;
        applySearch();
      } else {
        loadCountriesForRegion(activeRegionCode);
      }
    });
  }

  if (searchInput && !searchInput._destBound) {
    searchInput._destBound = true;
    var searchDebounce = null;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(applySearch, 200);
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchInput.value) {
        e.preventDefault();
        searchInput.value = '';
        if (clearBtn) clearBtn.hidden = true;
        applySearch();
      }
    });
  }

  if (clearBtn && !clearBtn._destBound) {
    clearBtn._destBound = true;
    clearBtn.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      clearBtn.hidden = true;
      if (searchInput) searchInput.focus();
      applySearch();
    });
  }

  if (noResultsClear && !noResultsClear._destBound) {
    noResultsClear._destBound = true;
    noResultsClear.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.hidden = true;
      if (regionTabsContainer) {
        regionTabsContainer.querySelectorAll('.filter-tab')
          .forEach(function (t) { t.classList.remove('filter-tab--active'); });
        const allTab = regionTabsContainer.querySelector('.filter-tab[data-region="all"]')
          || regionTabsContainer.querySelector('.filter-tab');
        if (allTab) allTab.classList.add('filter-tab--active');
      }
      activeRegionCode = null;
      displayedCountries = allCountries;
      applySearch();
    });
  }
}

// ── Language change handler ───────────────────────────────────────────────
var _lastFetchedLang = getLang();

document.addEventListener('simphonia:langchange', function () {
  var newLang = getLang();
  if (newLang === _lastFetchedLang) return;
  _lastFetchedLang = newLang;

  allCountries = [];
  displayedCountries = [];
  activeRegionCode = null;

  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.hidden = true;

  if (regionTabsContainer) {
    regionTabsContainer.querySelectorAll('.filter-tab').forEach(function (t) {
      t.classList.remove('filter-tab--active');
    });
    var allTab = regionTabsContainer.querySelector('.filter-tab[data-region="all"]');
    if (allTab) allTab.classList.add('filter-tab--active');
  }

  if (grid) grid.textContent = '';
  if (noResults) noResults.style.display = 'none';
  if (countEl) countEl.textContent = '';

  buildRegionTabs();
  loadAllCountries();
});

// ── Public init — called lazily by router ─────────────────────────────────
var _initialized = false;

window.initDestinationsPage = function () {
  if (_initialized) return;
  _initialized = true;

  resolveRefs();
  bindEvents();
  buildRegionTabs();
  loadAllCountries();
};

}()); // end IIFE
