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
  const API_BASE   = (window.SIMPHONIA_API && window.SIMPHONIA_API.base) || 'https://api.simphonia.pt';
  const TOKEN_KEY  = 'simphonia_guest_token';
  const EXPIRY_KEY = 'simphonia_guest_expiry';
  const EXPIRY_MARGIN_MS = 60000; // 60 s safety margin before actual expiry

  /**
   * Inflight guard — prevents duplicate simultaneous requests.
   * @type {Promise<string|null>|null}
   */
  let _pendingFetch = null;

  /**
   * Returns a valid guest token (from cache or freshly acquired).
   * Rejects if the token could not be obtained.
   *
   * @returns {Promise<string>}
   */
  async function getGuestToken() {
    let stored, expiry;
    try {
      stored = sessionStorage.getItem(TOKEN_KEY);
      expiry = Number(sessionStorage.getItem(EXPIRY_KEY) || 0);
    } catch (_) {
      stored = null;
      expiry = 0;
    }
    if (stored && Date.now() < expiry - EXPIRY_MARGIN_MS) return stored;

    if (_pendingFetch) return _pendingFetch;

    _pendingFetch = (async function () {
      try {
        const res = await fetch(API_BASE + '/api/v1/auth/guest', { method: 'POST' });
        if (!res.ok) throw new Error('Guest auth responded with ' + res.status);

        const envelope = await res.json();
        const data = envelope.data || envelope;
        const token = data.token;
        const expiresIn = data.expiresIn;
        if (!token) throw new Error('Guest auth returned no token');

        const expiresInNum = Number(expiresIn);
        try {
          sessionStorage.setItem(TOKEN_KEY, token);
          sessionStorage.setItem(EXPIRY_KEY, String(
            isFinite(expiresInNum) ? Date.now() + expiresInNum * 1000 : 0
          ));
        } catch (_) { /* Private browsing — token still usable for this request chain */ }
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