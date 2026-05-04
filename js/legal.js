/**
 * Simphonia — Legal Page Renderer
 *
 * Fetches Terms of Service and Privacy Policy from the centralized
 * backend API (single source of truth) and renders them into the page.
 * Legal documents are always in English for juridical reasons.
 *
 * The HTML pages contain only an empty skeleton with a loading spinner.
 * All legal content comes exclusively from the backend JSON endpoint:
 *   GET /api/v1/legal/{terms|privacy}
 */
'use strict';

(function () {
  var API_BASE = (window.SIMPHONIA_API && window.SIMPHONIA_API.base) || 'https://api.simphonia.pt';

  /**
   * Fetch a legal document from the API and render it into the page.
   * @param {'terms'|'privacy'} type
   */
  function loadLegalDocument(type) {
    var page      = document.querySelector('[data-page="' + type + '"]');
    if (!page) return;

    var container = page.querySelector('.legal-prose');
    var tocNav    = page.querySelector('.legal-toc__list');
    var heroDate  = page.querySelector('[data-legal-date]');
    var heroLabel = page.querySelector('[data-legal-hero-label]');
    var heroH1    = page.querySelector('[data-legal-hero-h1]');
    var heroH2    = page.querySelector('[data-legal-hero-h2]');

    if (!container) return;

    // Show loading state (the HTML already has a .legal-loading placeholder)
    showLoading(container);

    fetch(API_BASE + '/api/v1/legal/' + type)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (doc) {
        renderDocument(doc, container, tocNav, heroDate, heroLabel, heroH1, heroH2);
      })
      .catch(function (err) {
        console.warn('[legal] Failed to load ' + type + ' from API:', err.message);
        showError(container, type);
      });
  }

  /**
   * Ensure the loading spinner is visible.
   */
  function showLoading(container) {
    if (!container.querySelector('.legal-loading')) {
      container.innerHTML =
        '<div class="legal-loading" aria-live="polite">' +
          '<div class="legal-loading__spinner" aria-hidden="true"></div>' +
          '<p>Loading document…</p>' +
        '</div>';
    }
  }

  /**
   * Show an error state with a retry button.
   */
  function showError(container, type) {
    container.innerHTML =
      '<div class="legal-error" aria-live="polite">' +
        '<p>Unable to load this document. Please try again.</p>' +
        '<button class="btn btn--primary btn--sm" data-legal-retry="' + escapeAttr(type) + '">Retry</button>' +
      '</div>';

    var retryBtn = container.querySelector('[data-legal-retry]');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        loadLegalDocument(type);
      });
    }
  }

  /**
   * Render the JSON document into the page.
   */
  function renderDocument(doc, container, tocNav, heroDate, heroLabel, heroH1, heroH2) {
    // Update hero section from API data
    if (heroLabel && doc.heroLabel) heroLabel.textContent = doc.heroLabel;
    if (heroH1 && doc.heroHeading1) heroH1.textContent = doc.heroHeading1;
    if (heroH2 && doc.heroHeading2) heroH2.textContent = doc.heroHeading2;
    if (heroDate && doc.lastUpdated) heroDate.textContent = 'Last updated: ' + doc.lastUpdated;

    // Build TOC
    if (tocNav) {
      tocNav.innerHTML = '';
      doc.sections.forEach(function (section) {
        var a = document.createElement('a');
        a.href = '#' + section.id;
        a.className = 'legal-toc__link';
        a.textContent = section.title;
        tocNav.appendChild(a);
      });
    }

    // Build content
    var html = '';

    // Intro
    html += '<p>' + escapeHtml(doc.intro) + '</p>';

    // Sections
    doc.sections.forEach(function (section) {
      html += '<h2 id="' + escapeAttr(section.id) + '">' + escapeHtml(section.title) + '</h2>';
      section.content.forEach(function (block) {
        html += renderBlock(block);
      });
    });

    // CTA
    if (doc.cta) {
      html += '<div class="legal-cta"><div class="legal-cta__text">';
      html += '<h4>' + escapeHtml(doc.cta.heading) + '</h4>';
      html += '<p>' + escapeHtml(doc.cta.description) + '</p>';
      html += '</div>';
      html += '<a href="' + escapeAttr(doc.cta.buttonLink) + '" class="btn btn--primary">' + escapeHtml(doc.cta.buttonText) + '</a>';
      html += '</div>';
    }

    container.innerHTML = html;
  }

  /**
   * Render a single content block.
   */
  function renderBlock(block) {
    switch (block.type) {
      case 'heading':
        var tag = 'h' + (block.level || 3);
        return '<' + tag + '>' + escapeHtml(block.text || '') + '</' + tag + '>';

      case 'list':
        var items = (block.items || []).map(function (item) {
          return '<li>' + escapeHtml(item) + '</li>';
        }).join('');
        return '<ul>' + items + '</ul>';

      case 'paragraph':
      default:
        // Use html field if present (may contain links), otherwise use text
        if (block.html) {
          return '<p>' + block.html + '</p>';
        }
        return '<p>' + escapeHtml(block.text || '') + '</p>';
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Public API ──────────────────────────────────────────────── */
  window.SimphoniaLegal = {
    load: loadLegalDocument
  };

  /* ── Auto-init: load when router navigates to a legal page ─── */
  document.addEventListener('simphonia:navigate', function (e) {
    var page = e.detail && e.detail.page;
    if (page === 'terms' || page === 'privacy') {
      // Small delay to ensure DOM partial is inserted
      setTimeout(function () { loadLegalDocument(page); }, 50);
    }
  });
})();
