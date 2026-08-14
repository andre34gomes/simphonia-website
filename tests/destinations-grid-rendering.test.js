const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// destinations-page.js renders API country data straight into innerHTML.
// These tests exercise the real module (loaded fresh per test via vm) against
// a minimal DOM mock, to guard against unescaped/uncoerced API fields
// (plan count, discount, price) breaking out of the card markup.

function createDomNode(tag) {
  const node = {
    tagName: (tag || 'div').toUpperCase(),
    children: [],
    attributes: {},
    dataset: {},
    value: '',
    hidden: false,
    style: { setProperty() {} },
    _html: '',
    _text: '',
    get innerHTML() { return node._html; },
    set innerHTML(v) { node._html = v; node.children = []; },
    get textContent() { return node._text; },
    set textContent(v) { node._text = v; if (v === '') node.children = []; },
    setAttribute(k, v) { node.attributes[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(node.attributes, k) ? node.attributes[k] : null; },
    appendChild(child) {
      if (child && child._isFragment) {
        node.children.push.apply(node.children, child.children);
        child.children = [];
      } else {
        node.children.push(child);
      }
      return child;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    remove() {},
  };
  return node;
}

function createFragment() {
  const frag = createDomNode('fragment');
  frag._isFragment = true;
  return frag;
}

function buildDom() {
  const grid = createDomNode('div');
  const elementsById = {
    'region-tabs': createDomNode('div'),
    'dest-grid': grid,
    'no-results': createDomNode('div'),
    'no-results-query': createDomNode('span'),
    'dest-count': createDomNode('span'),
    'dest-search': createDomNode('input'),
    'dest-search-clear': createDomNode('button'),
    'no-results-clear': createDomNode('button'),
  };
  const document = {
    getElementById(id) { return elementsById[id] || null; },
    createElement(tag) { return createDomNode(tag); },
    createDocumentFragment() { return createFragment(); },
    addEventListener() {},
    readyState: 'complete',
  };
  return { grid, document };
}

function loadDestinationsPage({ countries, regions }) {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'destinations-page.js'),
    'utf8'
  );

  const { grid, document } = buildDom();

  const context = {
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { language: 'en' },
    document,
    window: {
      SIMPHONIA_API: { base: 'https://api.simphonia.pt' },
      SIMPHONIA_LANG: 'en',
      flagEmoji: function (code) { return code ? '<img alt="' + code + '">' : ''; },
      escHTML: function (str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      },
      t: function (key) { return key; },
      getGuestToken: async function () { return 'test-token'; },
    },
    fetch: async function (url) {
      if (url.indexOf('/api/v1/regions?') !== -1) {
        return { ok: true, status: 200, json: async () => ({ data: regions || [] }) };
      }
      return { ok: true, status: 200, json: async () => ({ data: countries || [] }) };
    },
  };

  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'destinations-page.js' });
  return { context, grid };
}

function flush() {
  return new Promise(function (resolve) { setTimeout(resolve, 50); });
}

test('destinations grid renders plan count as a plain number even if the API sends extra markup', async () => {
  const { context, grid } = loadDestinationsPage({
    countries: [{
      countryCode: 'pt',
      countryName: 'Portugal',
      planCount: '7<img src=x onerror=alert(1)>',
    }],
  });

  context.window.initDestinationsPage();
  await flush();

  assert.equal(grid.children.length, 1);
  const cardHtml = grid.children[0].innerHTML;
  assert.match(cardHtml, /<div class="dest-card__plans">7 /);
  assert.equal(cardHtml.includes('onerror'), false);
  assert.equal(cardHtml.includes('<img src=x'), false);
});

test('destinations grid coerces discount and price fields to plain numbers', async () => {
  const { context, grid } = loadDestinationsPage({
    countries: [{
      countryCode: 'es',
      countryName: 'Spain',
      discount: '15',
      startingPrice: '3.5',
    }],
  });

  context.window.initDestinationsPage();
  await flush();

  const cardHtml = grid.children[0].innerHTML;
  assert.match(cardHtml, /-15%/);
  assert.match(cardHtml, /3\.50/);
});

test('destinations grid escapes the country name', async () => {
  const { context, grid } = loadDestinationsPage({
    countries: [{
      countryCode: 'us',
      countryName: '<script>alert(1)</script>',
    }],
  });

  context.window.initDestinationsPage();
  await flush();

  const cardHtml = grid.children[0].innerHTML;
  assert.equal(cardHtml.includes('<script>'), false);
  assert.match(cardHtml, /&lt;script&gt;/);
});
