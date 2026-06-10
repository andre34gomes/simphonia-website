/**
 * Simphonia — Keyboard Navigation Shortcuts
 *
 * Provides keyboard shortcuts for power users and accessibility:
 * - Alt+H: Navigate to Home
 * - Alt+D: Navigate to Destinations
 * - Alt+S: Navigate to Support
 * - Alt+A: Navigate to About
 * - Escape: Close any open modal/menu
 * - /: Focus search input (if visible)
 *
 * Only activates when no text input is focused (prevents interference with typing).
 */
'use strict';

(function () {
  const SHORTCUTS = {
    'h': '/',
    'd': '/destinations/',
    's': '/support/',
    'a': '/about/',
    'w': '/how-it-works/',
  };

  /**
   * Returns true if the currently focused element is a text input or textarea.
   */
  function isTyping() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input') {
      const type = (el.type || '').toLowerCase();
      return ['text', 'search', 'email', 'password', 'tel', 'url', 'number'].indexOf(type) !== -1;
    }
    return tag === 'textarea' || el.isContentEditable;
  }

  /**
   * Navigates using the SPA router if available, otherwise falls back to direct navigation.
   */
  function navigateTo(path) {
    if (typeof window.navigateTo === 'function') {
      window.navigateTo(path);
    } else {
      window.location.href = path;
    }
  }

  document.addEventListener('keydown', function (e) {
    // Don't intercept when user is typing in an input
    if (isTyping()) return;

    // Alt+Key shortcuts for navigation
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const key = e.key.toLowerCase();
      const path = SHORTCUTS[key];
      if (path) {
        e.preventDefault();
        navigateTo(path);
        return;
      }
    }

    // Escape: close modals, menus, overlays
    if (e.key === 'Escape') {
      // Close mobile menu if open
      const mobileMenu = document.querySelector('.mobile-nav--open');
      if (mobileMenu) {
        mobileMenu.classList.remove('mobile-nav--open');
        const trigger = document.querySelector('[data-mobile-nav-trigger]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        return;
      }

      // Close any modal with data-modal-close
      const openModal = document.querySelector('[data-modal][aria-hidden="false"]');
      if (openModal) {
        openModal.setAttribute('aria-hidden', 'true');
        return;
      }
    }

    // "/" key focuses the search input (if visible on the destinations page)
    if (e.key === '/' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const searchInput = document.querySelector('[data-page]:not([style*="display: none"]) input[type="search"]') ||
                        document.querySelector('[data-page]:not([style*="display: none"]) input[data-search]');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });

  // Log available shortcuts to console in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.info(
      '%c⌨️ Keyboard shortcuts available:\n' +
      'Alt+H → Home\n' +
      'Alt+D → Destinations\n' +
      'Alt+W → How It Works\n' +
      'Alt+S → Support\n' +
      'Alt+A → About\n' +
      '/ → Focus search\n' +
      'Esc → Close modals',
      'color: #D4AF37;'
    );
  }
}());
