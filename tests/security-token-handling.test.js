const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('reset and verification fragments do not execute scripts or disclose tokens to QR providers', () => {
  ['pages/reset-password.html', 'pages/verify-email.html'].forEach((page) => {
    const content = read(page);

    assert.doesNotMatch(content, /<script\b/i);
    assert.doesNotMatch(content, /api\.qrserver\.com/i);
    assert.doesNotMatch(content, /simphonia:\/\//i);
  });
});

test('token handoff is same-origin, clears the URL, and does not use a custom scheme', () => {
  const handler = read('js/deeplink-token-page.js');

  assert.match(handler, /history\.replaceState/);
  assert.match(handler, /window\.location\.protocol === 'https:'/);
  assert.match(handler, /TRUSTED_HOSTS/);
  assert.doesNotMatch(handler, /simphonia:\/\//i);
  assert.doesNotMatch(handler, /api\.qrserver\.com/i);
});

test('the service worker never caches token-bearing authentication navigations', () => {
  const worker = read('sw.js');

  assert.match(worker, /url\.searchParams\.has\('token'\)/);
  assert.match(worker, /isSensitiveNavigation/);
  assert.doesNotMatch(worker, /'\/pages\/verify-email',/);
  assert.doesNotMatch(worker, /'\/pages\/reset-password',/);
});
