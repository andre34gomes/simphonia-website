(function () {
  'use strict';

  var APPLE_STORE_URL = 'https://apps.apple.com/app/simphonia/id6740088498';
  var GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.simphonia.app';
  var ACTION_LABELS = {
    'verify-email': 'Email Verification',
    'reset-password': 'Password Reset',
    'join': 'Referral Invitation'
  };

  function getSearchParams() {
    return new URLSearchParams(window.location.search);
  }

  function isMobileDevice() {
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
  }

  function isIOSDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  }

  function buildQrUrl(size, data) {
    return ['https', '://api.qrserver.com/v1/create-qr-code/?size=', size, 'x', size, '&data=', encodeURIComponent(data), '&format=png&margin=8'].join('');
  }

  function getJoinAppUrl(code) {
    return ['simphonia', '://app/join?code=', encodeURIComponent(code)].join('');
  }

  function setVisible(id, visible, displayValue) {
    var el = document.getElementById(id);
    if (el) el.style.display = visible ? (displayValue || 'block') : 'none';
    return el;
  }

  function initJoinPage() {
    var params = getSearchParams();
    var code = params.get('code') || '';
    var codeEl = document.getElementById('join-referral-code');
    if (code && code.length <= 32 && /^[a-zA-Z0-9_-]+$/.test(code) && codeEl) {
      codeEl.textContent = code;
      codeEl.style.display = 'inline-block';
    }

    if (!code) return;

    if (isMobileDevice()) {
      window.location.href = getJoinAppUrl(code);
      window.setTimeout(function () {
        var storeBtn = setVisible('join-store-btn', true, 'inline-block');
        setVisible('join-fallback', true, 'block');
        if (storeBtn) {
          if (isIOSDevice()) {
            storeBtn.href = APPLE_STORE_URL;
            storeBtn.textContent = 'Download on App Store';
          } else {
            storeBtn.href = GOOGLE_PLAY_URL;
            storeBtn.textContent = 'Get it on Google Play';
          }
        }
      }, 1500);
      return;
    }

    var qrImg = document.getElementById('join-qr-code');
    if (qrImg) {
      qrImg.src = buildQrUrl(160, 'https://simphonia.pt/join?code=' + encodeURIComponent(code));
    }
    setVisible('join-desktop', true, 'block');
  }

  function getOpenInAppDeepLink(params) {
    var action = params.get('action') || '';
    var code = params.get('code') || '';

    if (action === 'join' && code) return 'https://simphonia.pt/join?code=' + encodeURIComponent(code);

    if (action === 'verify-email') {
      var verifyToken = params.get('token') || '';
      return verifyToken ? 'https://simphonia.pt/verify-email?token=' + encodeURIComponent(verifyToken) : 'https://simphonia.pt/verify-email';
    }

    if (action === 'reset-password') {
      var resetToken = params.get('token') || '';
      return resetToken ? 'https://simphonia.pt/reset-password?token=' + encodeURIComponent(resetToken) : 'https://simphonia.pt/reset-password';
    }

    return 'https://simphonia.pt';
  }

  function initOpenInAppPage() {
    var params = getSearchParams();
    var action = params.get('action') || '';
    var labelEl = document.getElementById('oia-action-label');
    if (ACTION_LABELS[action] && labelEl) {
      labelEl.textContent = ACTION_LABELS[action];
      labelEl.style.display = 'inline-block';
    }

    var canvas = document.getElementById('oia-qr-canvas');
    if (!canvas || !canvas.getContext) return;

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 180, 180);
      ctx.drawImage(img, 0, 0, 180, 180);
    };
    img.src = buildQrUrl(180, getOpenInAppDeepLink(params));
  }

  function initialize() {
    if (document.querySelector('[data-page="join"]')) initJoinPage();
    if (document.querySelector('[data-page="open-in-app"]')) initOpenInAppPage();
  }

  window.initDeepLinkPage = initialize;
  document.addEventListener('simphonia:routechange', initialize);
})();
