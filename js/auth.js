/**
 * Simphonia — Shared guest-token acquisition.
 *
 * Single source of truth for the getGuestToken() flow.
 * Loaded as a regular <script defer> AFTER layout.js so that
 * window.SIMPHONIA_API.base is already available.
 *
 * Exposes: window.getGuestToken
 *
 * Uses sessionStorage (not localStorage) to reduce the XSS attack surface —
 * guest tokens are transient, low-sensitivity, and short-lived.
 * Each tab acquires its own guest token if needed.
 */

'use strict';

(function () {
  var API_BASE   = (window.SIMPHONIA_API && window.SIMPHONIA_API.base) || 'https://api.simphonia.pt';
  var TOKEN_KEY  = 'simphonia_guest_token';
  var EXPIRY_KEY = 'simphonia_guest_expiry';
  var EXPIRY_MARGIN_MS = 60000; // 60 s safety margin before actual expiry

  /**
   * Inflight guard — prevents duplicate simultaneous requests.
   * @type {Promise<string|null>|null}
   */
  var _pendingFetch = null;

  /**
   * Returns a valid guest token (from cache or freshly acquired).
   * Rejects if the token could not be obtained.
   *
   * @returns {Promise<string>}
   */
  async function getGuestToken() {
    var stored = sessionStorage.getItem(TOKEN_KEY);
    var expiry = Number(sessionStorage.getItem(EXPIRY_KEY) || 0);
    if (stored && Date.now() < expiry - EXPIRY_MARGIN_MS) return stored;

    if (_pendingFetch) return _pendingFetch;

    _pendingFetch = (async function () {
      try {
        var res = await fetch(API_BASE + '/api/v1/auth/guest', { method: 'POST' });
        if (!res.ok) throw new Error('Guest auth responded with ' + res.status);

        var envelope = await res.json();
        var data = envelope.data || envelope;
        var token = data.token;
        var expiresIn = data.expiresIn;
        if (!token) throw new Error('Guest auth returned no token');

        var expiresInNum = Number(expiresIn);
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(EXPIRY_KEY, String(
          isFinite(expiresInNum) ? Date.now() + expiresInNum * 1000 : 0
        ));
        return token;
      } catch (e) {
        throw e instanceof Error ? e : new Error('Guest token acquisition failed');
      } finally {
        _pendingFetch = null;
      }
    })();

    return _pendingFetch;
  }

  // Expose as the single global entry point
  window.getGuestToken = getGuestToken;
}());