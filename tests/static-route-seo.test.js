const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://simphonia.pt';

const routes = [
  ['about', 'About — Simphonia eSIM', 'Learn how Simphonia makes global eSIM connectivity simple, affordable, and built for modern travelers.', 'organization'],
  ['destinations', 'Destinations — Simphonia eSIM', 'Browse 200+ eSIM destinations and find the right data plan for your next trip with Simphonia.', 'webpage'],
  ['how-it-works', 'How It Works — Simphonia eSIM', 'See how Simphonia gets you connected in minutes with instant eSIM purchase, activation, and travel-ready data.', 'webpage'],
  ['support', 'Support & FAQ — Simphonia eSIM', 'Find answers, browse FAQs, and contact the Simphonia support team whenever you need help.', 'webpage'],
  ['privacy', 'Privacy Policy — Simphonia eSIM', 'Read how Simphonia collects, uses, and protects your data across the website and mobile app.', 'webpage'],
  ['terms', 'Terms of Service — Simphonia eSIM', 'Review the Simphonia terms of service for purchases, eSIM usage, refunds, and account responsibilities.', 'webpage']
];

function readRoute(route) {
  return fs.readFileSync(path.join(ROOT, route, 'index.html'), 'utf8');
}

test('home shell retains its established self-referencing SEO metadata', () => {
  const shell = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.match(shell, /<title[^>]*>Simphonia — Stay Connected, Wherever You Go\.<\/title>/);
  assert.match(shell, /name="description" content="Instant eSIM activation for 200\+ countries\./);
  assert.match(shell, /rel="canonical" href="https:\/\/simphonia\.pt\/"/);
  assert.match(shell, /property="og:url" content="https:\/\/simphonia\.pt\/"/);
  assert.match(shell, /name="twitter:title" content="Simphonia — Stay Connected, Wherever You Go"/);
  assert.match(shell, /"@type": "Organization"/);
  assert.doesNotMatch(shell, /hreflang=/);
});

test('generated English metadata matches the SPA runtime translations', () => {
  const translations = JSON.parse(fs.readFileSync(path.join(ROOT, 'js', 'i18n', 'en.json'), 'utf8'));
  const config = fs.readFileSync(path.join(ROOT, 'scripts', 'pages.conf'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('|'));

  config.forEach(([, title, description, , , titleKey, descriptionKey]) => {
    const lookup = (key) => key.split('.').reduce((value, segment) => value[segment], translations);
    assert.equal(title, lookup(titleKey));
    assert.equal(description, lookup(descriptionKey));
  });
});

test('public static route shells have self-referencing route metadata', () => {
  routes.forEach(([route, title, description]) => {
    const shell = readRoute(route);
    const url = SITE_URL + '/' + route + '/';
    const htmlTitle = title.replace(/&/g, '&amp;');
    const htmlDescription = description.replace(/&/g, '&amp;');

    assert.match(shell, new RegExp('<title[^>]*>' + htmlTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</title>'));
    assert.match(shell, new RegExp('name="description" content="' + htmlDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'));
    assert.match(shell, new RegExp('rel="canonical" href="' + url + '"'));
    assert.match(shell, new RegExp('property="og:title" content="' + htmlTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'));
    assert.match(shell, new RegExp('property="og:description" content="' + htmlDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'));
    assert.match(shell, new RegExp('property="og:url" content="' + url + '"'));
    assert.match(shell, new RegExp('name="twitter:title" content="' + htmlTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'));
    assert.match(shell, new RegExp('name="twitter:description" content="' + htmlDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'));
    assert.doesNotMatch(shell, /hreflang=/);
  });
});

test('route schemas describe the current route and do not copy the home FAQ', () => {
  routes.forEach(([route, title, _description, schema]) => {
    const shell = readRoute(route);
    const schemaMatch = shell.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    assert.ok(schemaMatch, 'expected JSON-LD for ' + route);
    const data = JSON.parse(schemaMatch[1]);

    assert.equal(JSON.stringify(data).includes('FAQPage'), false, route + ' must not inherit home FAQ schema');
    assert.equal(JSON.stringify(data).includes(SITE_URL + '/' + route + '/'), true, route + ' schema must reference itself');
    assert.equal(JSON.stringify(data).includes(title), true, route + ' schema must name the page');
    assert.equal(
      schema === 'organization' ? data['@graph'][0]['@type'] : data['@type'],
      schema === 'organization' ? 'Organization' : 'WebPage'
    );
  });
});

test('public route shells render their matching page partial without JavaScript', () => {
  routes.forEach(([route]) => {
    const shell = readRoute(route);
    const noScript = shell.match(/<script defer src="\/js\/cdn-fallback\.js"><\/script>\s*<noscript>([\s\S]*?)<\/noscript>/);

    assert.ok(noScript, 'expected no-JavaScript fallback for ' + route);
    assert.match(noScript[1], new RegExp('data-page="' + route + '"'));
    assert.doesNotMatch(noScript[1], /Simphonia — Stay Connected, Wherever You Go/);
    if (route === 'privacy' || route === 'terms') {
      assert.doesNotMatch(noScript[1], /Loading document…/);
      assert.match(noScript[1], /<div class="legal-prose">/);
      assert.match(noScript[1], /<h2 id="/);
    }
    if (['join', 'open-in-app', 'verify-email', 'reset-password'].includes(route)) {
      assert.match(noScript[1], /Download Simphonia/);
      assert.doesNotMatch(noScript[1], /display:none/);
    }
  });
});

test('deep-link shells are self-canonical noindex pages without home structured data', () => {
  [
    ['join', 'noindex, follow'],
    ['open-in-app', 'noindex, nofollow'],
    ['verify-email', 'noindex, nofollow'],
    ['reset-password', 'noindex, nofollow']
  ].forEach(([route, robots]) => {
    const shell = readRoute(route);
    const url = SITE_URL + '/' + route + '/';

    assert.match(shell, new RegExp('rel="canonical" href="' + url + '"'));
    assert.match(shell, new RegExp('name="robots" content="' + robots + '"'));
    assert.match(shell, new RegExp('property="og:url" content="' + url + '"'));
    assert.doesNotMatch(shell, /application\/ld\+json/);
    assert.doesNotMatch(shell, /hreflang=/);
    assert.doesNotMatch(shell, /Simphonia — Stay Connected, Wherever You Go/);
  });
});
