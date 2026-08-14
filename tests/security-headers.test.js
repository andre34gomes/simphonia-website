const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('Cloudflare Pages security headers protect all responses and sensitive routes', () => {
  const headers = read('_headers');

  assert.match(headers, /^\/\*/m);
  assert.match(headers, /X-Frame-Options:\s*DENY/);
  assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/);
  assert.match(headers, /Content-Security-Policy:.*frame-ancestors 'none'/);
  assert.match(headers, /^\/reset-password\/\*/m);
  assert.match(headers, /^\/verify-email\/\*/m);
  assert.match(headers, /Cache-Control:\s*no-store/);
});

test('every route shell forbids unsafe inline scripts', () => {
  const shells = [
    'index.html',
    'about/index.html',
    'destinations/index.html',
    'how-it-works/index.html',
    'support/index.html',
    'privacy/index.html',
    'terms/index.html',
    'reset-password/index.html',
    'verify-email/index.html',
    'open-in-app/index.html',
    'join/index.html'
  ];

  shells.forEach((shell) => {
    assert.doesNotMatch(read(shell), /script-src[^\r\n]*'unsafe-inline'/);
  });
});
