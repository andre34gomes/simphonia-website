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

