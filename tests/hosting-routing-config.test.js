const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

test('Cloudflare redirect rules do not redirect SPA page partials', () => {
  const redirects = read('_redirects');

  assert.doesNotMatch(redirects, /^\s*\/pages\/.*\.html\s+\/.*\s+30[1278]\s*$/m);
});

test('Netlify keeps /pages/* as fetchable partials instead of redirect targets', () => {
  const config = read('netlify.toml');

  assert.match(config, /from\s*=\s*"\/pages\/\*"[\s\S]*to\s*=\s*"\/pages\/:splat"[\s\S]*status\s*=\s*200/);
  assert.doesNotMatch(config, /from\s*=\s*"\/pages\/.*\.html"[\s\S]*status\s*=\s*30[1278]/);
  assert.equal(config.includes('from = "/*"') && config.includes('to = "/index.html"'), false);
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

  assert.equal(
    rewrites.some((rule) => rule.source === '/(.*)' && rule.destination === '/index.html'),
    false,
    'did not expect a catch-all rewrite to /index.html'
  );
});

test('Cloudflare missing-route handler serves the branded 404 document', () => {
  const handler = read('functions/[[path]].js');

  assert.equal(handler.includes("new URL('/404.html', url)"), true);
  assert.equal(handler.includes("new URL('/index.html', url)"), false);
});

test('router prefers clean /pages/<slug> partial URLs before legacy .html fallbacks', () => {
  const router = read('js/router.js');

  // PAGE_PARTIALS is built dynamically from ROUTES — verify the generation
  // pattern that produces clean-URL-first, .html-fallback arrays.
  assert.match(router, /PAGE_PARTIALS\[page\] = \['\/pages\/' \+ page, '\/pages\/' \+ page \+ '\.html'\]/);
  assert.match(router, /function loadPagePartial\(/);

  // Verify known route slugs exist in the ROUTES definition
  assert.match(router, /'\/about':\s*\{/);
  assert.match(router, /'\/destinations':\s*\{/);
});

test('initial preload and service worker precache use clean partial URLs', () => {
  // Preload map lives in preload-partial.js (separate file loaded from <head>)
  const preload = read('js/preload-partial.js');
  const sw = read('sw.js');

  // preload-partial.js maps clean route paths to /pages/<slug> (no .html)
  assert.match(preload, /'\/about':\s*'\/pages\/about'/);
  assert.match(preload, /'\/destinations':\s*'\/pages\/destinations'/);

  // SW precache uses clean partial URLs, not legacy .html variants
  assert.match(sw, /'\/pages\/about',/);
  assert.match(sw, /'\/pages\/destinations',/);
  assert.doesNotMatch(sw, /'\/pages\/about\.html',/);
  assert.doesNotMatch(sw, /'\/pages\/destinations\.html',/);
});

test('home page no longer renders a scroll cue, while subpages keep the shared one', () => {
  const homePage = read('pages/home.html');
  const aboutPage = read('pages/about.html');
  const baseCss = read('css/base.css');
  const homeCss = read('css/home.css');

  assert.doesNotMatch(homePage, /class="hero__scroll/);
  assert.match(aboutPage, /class="hero__scroll"/);
  assert.match(baseCss, /\.about-hero \.hero__scroll,[\s\S]*\.legal-hero \.hero__scroll \{/);
  assert.doesNotMatch(homeCss, /\.hero-postcard \.hero__scroll/);
});

test('static route shells match the deterministic route-shell generator', () => {
  const routes = ['about', 'destinations', 'how-it-works', 'support', 'privacy', 'terms'];

  routes.forEach((route) => {
    const relativePath = route + '/index.html';
    assert.equal(exists(relativePath), true, 'expected route shell ' + relativePath);
  });

  const { execFileSync } = require('node:child_process');
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ['scripts/sync-shells.js', '--check'], {
      cwd: ROOT,
      stdio: 'pipe'
    });
  }, 'expected all route shells to match their generated output');
});





