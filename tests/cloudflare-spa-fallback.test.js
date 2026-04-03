const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadHelper() {
  return import(pathToFileURL(path.join(__dirname, '..', 'functions', '_shared', 'spa-fallback.mjs')).href);
}

test('serves SPA shell for browser navigation to extensionless deep links', async () => {
  const { shouldServeSpaShell } = await loadHelper();

  assert.equal(shouldServeSpaShell({
    pathname: '/missing-city/',
    method: 'GET',
    acceptHeader: 'text/html,application/xhtml+xml',
    secFetchMode: 'navigate'
  }), true);
});

test('does not serve SPA shell for page partial requests', async () => {
  const { shouldServeSpaShell } = await loadHelper();

  assert.equal(shouldServeSpaShell({
    pathname: '/pages/not-found.html',
    method: 'GET',
    acceptHeader: 'text/html',
    secFetchMode: 'same-origin'
  }), false);
});

test('does not serve SPA shell for static asset-like paths', async () => {
  const { shouldServeSpaShell } = await loadHelper();

  assert.equal(shouldServeSpaShell({
    pathname: '/js/app.js',
    method: 'GET',
    acceptHeader: '*/*',
    secFetchMode: 'no-cors'
  }), false);
});

test('does not serve SPA shell for api requests', async () => {
  const { shouldServeSpaShell } = await loadHelper();

  assert.equal(shouldServeSpaShell({
    pathname: '/api/v1/faqs',
    method: 'GET',
    acceptHeader: 'application/json',
    secFetchMode: 'cors'
  }), false);
});

test('does not serve SPA shell for non-navigation requests without html accept header', async () => {
  const { shouldServeSpaShell } = await loadHelper();

  assert.equal(shouldServeSpaShell({
    pathname: '/missing-city/',
    method: 'GET',
    acceptHeader: 'application/json',
    secFetchMode: 'cors'
  }), false);
});

test('does not serve SPA shell for non-GET methods', async () => {
  const { shouldServeSpaShell } = await loadHelper();

  assert.equal(shouldServeSpaShell({
    pathname: '/missing-city/',
    method: 'POST',
    acceptHeader: 'text/html',
    secFetchMode: 'navigate'
  }), false);
});

