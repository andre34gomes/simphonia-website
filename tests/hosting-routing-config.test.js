const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('Cloudflare redirect rules do not redirect SPA page partials', () => {
  const redirects = read('_redirects');

  assert.doesNotMatch(redirects, /^\s*\/pages\/.*\.html\s+\/.*\s+30[1278]\s*$/m);
});

test('Netlify keeps /pages/* as fetchable partials instead of redirect targets', () => {
  const config = read('netlify.toml');

  assert.match(config, /from\s*=\s*"\/pages\/\*"[\s\S]*to\s*=\s*"\/pages\/:splat"[\s\S]*status\s*=\s*200/);
  assert.doesNotMatch(config, /from\s*=\s*"\/pages\/.*\.html"[\s\S]*status\s*=\s*30[1278]/);
});

test('Vercel keeps /pages/* as a rewrite and has no partial redirect rules', () => {
  const config = JSON.parse(read('vercel.json'));
  const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
  const redirects = Array.isArray(config.redirects) ? config.redirects : [];

  assert.ok(
    rewrites.some((rule) => rule.source === '/pages/:path*' && rule.destination === '/pages/:path*'),
    'expected a /pages/:path* passthrough rewrite'
  );

  assert.equal(
    redirects.some((rule) => typeof rule.source === 'string' && rule.source.startsWith('/pages/')),
    false,
    'did not expect redirects for /pages/* partials'
  );
});

test('router prefers clean /pages/<slug> partial URLs before legacy .html fallbacks', () => {
  const router = read('js/router.js');

  assert.match(router, /'about':\s*\['\/pages\/about', '\/pages\/about\.html'\]/);
  assert.match(router, /'destinations':\s*\['\/pages\/destinations', '\/pages\/destinations\.html'\]/);
  assert.match(router, /function loadPagePartial\(/);
});

test('initial preload and service worker precache use clean partial URLs', () => {
  const index = read('index.html');
  const sw = read('sw.js');

  assert.match(index, /'\/about':\s*'\/pages\/about'/);
  assert.match(index, /'\/destinations':\s*'\/pages\/destinations'/);
  assert.match(sw, /'\/pages\/about',/);
  assert.match(sw, /'\/pages\/destinations',/);
  assert.doesNotMatch(sw, /'\/pages\/about\.html',/);
  assert.doesNotMatch(sw, /'\/pages\/destinations\.html',/);
});


