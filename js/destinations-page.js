/**
 * Simphonia — Destinations Page Logic
 *
 * Handles: region tabs, country grid, search/filter, API fetches.
 * Depends on: layout.js (window.SIMPHONIA_API, window.flagEmoji, window.escHTML)
 *             auth.js   (window.getGuestToken)
 */

'use strict';

// ── Config (single source of truth: layout.js → window.SIMPHONIA_API) ──
const API_BASE = (window.SIMPHONIA_API && window.SIMPHONIA_API.base) || 'https://api.simphonia.pt';
const CURRENCY = 'EUR';

// Language: use i18n module if loaded, otherwise fall back to browser language
function getLang() {
  return window.SIMPHONIA_LANG || (navigator.language || 'en').split('-')[0];
}

// Translation helper
function _t(key) {
  return typeof window.t === 'function' ? window.t(key) : key;
}

const REGION_LABELS = {
  AFRICA: 'Africa',
  ASIA: 'Asia',
  CARIBBEAN: 'Caribbean',
  EUROPE: 'Europe',
  EU_UK: 'EU & UK',
  LATIN_AMERICA: 'Latin America',
  MENA: 'Middle East & Africa',
  NORTH_AMERICA: 'North America',
  OCEANIA: 'Oceania',
};

// ── Guest-token: reuse shared auth.js via window.getGuestToken ────────
const getGuestToken = window.getGuestToken;

// ── Helpers (reuse shared utilities from layout.js) ─────────────────────
const flagEmoji = window.flagEmoji;
const esc = window.escHTML;

function resolveImage(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('//')) return url;
  return API_BASE + (url.startsWith('/') ? url : '/' + url);
}


async function apiFetch(path, _retried) {
  if (_retried === undefined) _retried = false;
  const token = await getGuestToken();

  // Abort after 10 s to avoid hanging indefinitely on network issues
  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, 10000);

  try {
    const res = await fetch(API_BASE + path, {
      headers: { Authorization: 'Bearer ' + token },
      signal: controller.signal,
    });

    // On 401, clear cached token, obtain a fresh one, and retry once
    if (res.status === 401 && !_retried) {
      sessionStorage.removeItem('simphonia_guest_token');
      sessionStorage.removeItem('simphonia_guest_expiry');
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

// ── DOM refs ─────────────────────────────────────────────────────────────
const regionTabsContainer = document.getElementById('region-tabs');
const grid = document.getElementById('dest-grid');
const noResults = document.getElementById('no-results');
const noResultsQ = document.getElementById('no-results-query');
const countEl = document.getElementById('dest-count');
const searchInput = document.getElementById('dest-search');
const clearBtn = document.getElementById('dest-search-clear');
const noResultsClear = document.getElementById('no-results-clear');

// ── State ─────────────────────────────────────────────────────────────────
let allCountries = [];   // full list, loaded once on init
let displayedCountries = [];  // current filtered list (by region)
let activeRegionCode = null; // null = "All"
// Request counter: incremented before each fetch so stale responses can be
// detected and discarded, preventing race conditions on rapid tab clicks.
let _fetchSeq = 0;

// ── Loading / error states ───────────────────────────────────────────────
function setLoading(on) {
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
    countEl.textContent = '';
    noResults.style.display = 'none';
  }
}

function showFetchError() {
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
  grid.textContent = '';   // faster than innerHTML = '' for clearing
  var total = displayedCountries.length;
  var query = searchInput.value.trim();

  noResults.style.display = items.length === 0 ? 'flex' : 'none';
  noResultsQ.textContent = query
    ? '\u201C' + query + '\u201D'
    : (REGION_LABELS[activeRegionCode] || activeRegionCode || _t('destinations.grid.allTab'));

  countEl.textContent = items.length === 0
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
  var query = searchInput.value.toLowerCase().trim();
  clearBtn.hidden = !query;
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
    if (seq !== _fetchSeq) return; // discard stale response
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
    if (seq !== _fetchSeq) return; // discard stale response
    displayedCountries = data;
    applySearch();
  } catch (err) {
    if (seq !== _fetchSeq) return;
    console.error('[destinations] Failed to load region countries:', err);
    showFetchError();
  }
}

async function buildRegionTabs() {
  try {
    // Clear any previously added region tabs (keep the static "All" tab)
    regionTabsContainer.querySelectorAll('.filter-tab:not([data-region="all"])').forEach(function (tab) {
      tab.remove();
    });

    var regions = await apiFetch('/api/v1/regions?currency=' + CURRENCY);
    regions.forEach(function (r) {
      var label = REGION_LABELS[r.regionCode] || r.regionCode;
      var btn = document.createElement('button');
      btn.className = 'filter-tab';
      btn.dataset.region = r.regionCode;
      btn.textContent = label;
      regionTabsContainer.appendChild(btn);
    });
    // Show the tabs container now that it has content
    if (regions.length) {
      regionTabsContainer.style.display = 'flex';
    }
  } catch (err) {
    console.error('[destinations] Failed to load regions:', err);
  }
}

// ── Event listeners ───────────────────────────────────────────────────────
regionTabsContainer.addEventListener('click', function (e) {
  if (!e.target || typeof e.target.closest !== 'function') return;
  var tab = e.target.closest('.filter-tab');
  if (!tab) return;

  regionTabsContainer.querySelectorAll('.filter-tab')
    .forEach(function (t) { t.classList.remove('filter-tab--active'); });
  tab.classList.add('filter-tab--active');

  var code = tab.dataset.region;
  activeRegionCode = code === 'all' ? null : code;
  searchInput.value = '';
  clearBtn.hidden = true;

  if (!activeRegionCode) {
    displayedCountries = allCountries;
    applySearch();
  } else {
    loadCountriesForRegion(activeRegionCode);
  }
});

var searchDebounce = null;
searchInput.addEventListener('input', function () {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(applySearch, 200);
});

// Escape key clears search; Enter key prevents form submission flash
searchInput.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && searchInput.value) {
    e.preventDefault();
    searchInput.value = '';
    clearBtn.hidden = true;
    applySearch();
  }
});

clearBtn.addEventListener('click', function () {
  searchInput.value = '';
  clearBtn.hidden = true;
  searchInput.focus();
  applySearch();
});

noResultsClear.addEventListener('click', function () {
  searchInput.value = '';
  clearBtn.hidden = true;
  regionTabsContainer.querySelectorAll('.filter-tab')
    .forEach(function (t) { t.classList.remove('filter-tab--active'); });
  // Activate the "All" tab by its data-region value instead of assuming it is
  // the first child (order may change if tabs are dynamically reordered).
  const allTab = regionTabsContainer.querySelector('.filter-tab[data-region="all"]')
    || regionTabsContainer.querySelector('.filter-tab');
  if (allTab) allTab.classList.add('filter-tab--active');
  activeRegionCode = null;
  displayedCountries = allCountries;
  applySearch();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────
buildRegionTabs();
loadAllCountries();


// Re-fetch with new language when language changes
document.addEventListener('simphonia:langchange', function () {
  // Reset state
  allCountries = [];
  displayedCountries = [];
  activeRegionCode = null;

  // Clear search
  searchInput.value = '';
  clearBtn.hidden = true;

  // Reset tab selection to "All"
  regionTabsContainer.querySelectorAll('.filter-tab').forEach(function (t) {
    t.classList.remove('filter-tab--active');
  });
  var allTab = regionTabsContainer.querySelector('.filter-tab[data-region="all"]');
  if (allTab) allTab.classList.add('filter-tab--active');

  // Clear grid immediately so old-language content is removed
  grid.textContent = '';
  noResults.style.display = 'none';
  countEl.textContent = '';

  // Rebuild region tabs and reload countries with new language
  buildRegionTabs();
  loadAllCountries();
});
