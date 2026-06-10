const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler, opts) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      if (!listeners.has(type)) return;
      listeners.set(type, listeners.get(type).filter(fn => fn !== handler));
    },
    dispatch(type, event) {
      (listeners.get(type) || []).slice().forEach(fn => fn(event || { type }));
    }
  };
}

function createAnchor(href, opts) {
  const el = {
    tagName: 'A',
    href: href,
    dataset: {},
    textContent: opts?.text || 'Link',
    children: [],
    getAttribute(k) { return el[k]; },
    setAttribute(k, v) { el[k] = v; },
    querySelector(sel) {
      return el.children.find(c => c.className === sel.replace('.', '')) || null;
    },
    appendChild(child) { el.children.push(child); },
    addEventListener(type, handler) {},
  };
  return el;
}

function loadScript(sandbox) {
  const code = fs.readFileSync(
    path.resolve(__dirname, '..', 'js', 'external-links.js'),
    'utf-8'
  );
  vm.runInNewContext(code, sandbox, { filename: 'external-links.js' });
}

test('external-links: adds target and rel to external links', function () {
  const doc = createEventTarget();
  const externalAnchor = createAnchor('https://example.com/page');

  const sandbox = {
    document: Object.assign(doc, {
      readyState: 'complete',
      querySelectorAll(sel) {
        if (sel === 'a[href]') return [externalAnchor];
        return [];
      },
      createElement(tag) {
        return {
          tagName: tag,
          className: '',
          textContent: '',
          style: { cssText: '' },
          setAttribute(k, v) { this[k] = v; },
        };
      },
      body: { appendChild() {} },
      documentElement: {},
    }),
    window: {
      location: { origin: 'https://simphonia.pt', hostname: 'simphonia.pt' },
    },
    WeakSet: WeakSet,
    URL: URL,
    MutationObserver: undefined,
    CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; this.detail = opts?.detail; } },
  };

  loadScript(sandbox);

  assert.equal(externalAnchor.target, '_blank');
  assert.equal(externalAnchor.rel, 'noopener noreferrer');
});

test('external-links: skips internal links', function () {
  const doc = createEventTarget();
  const internalAnchor = createAnchor('https://simphonia.pt/about');

  const sandbox = {
    document: Object.assign(doc, {
      readyState: 'complete',
      querySelectorAll(sel) {
        if (sel === 'a[href]') return [internalAnchor];
        return [];
      },
      createElement(tag) {
        return {
          tagName: tag, className: '', textContent: '',
          style: { cssText: '' },
          setAttribute(k, v) { this[k] = v; },
        };
      },
      body: {},
      documentElement: {},
    }),
    window: {
      location: { origin: 'https://simphonia.pt', hostname: 'simphonia.pt' },
    },
    WeakSet: WeakSet,
    URL: URL,
    MutationObserver: undefined,
    CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; } },
  };

  loadScript(sandbox);

  assert.notEqual(internalAnchor.target, '_blank', 'Internal link should not get target=_blank');
});

test('external-links: skips mailto links', function () {
  const doc = createEventTarget();
  const mailtoAnchor = createAnchor('mailto:hello@simphonia.pt');

  const sandbox = {
    document: Object.assign(doc, {
      readyState: 'complete',
      querySelectorAll(sel) {
        if (sel === 'a[href]') return [mailtoAnchor];
        return [];
      },
      createElement(tag) {
        return {
          tagName: tag, className: '', textContent: '',
          style: { cssText: '' },
          setAttribute(k, v) { this[k] = v; },
        };
      },
      body: {},
      documentElement: {},
    }),
    window: {
      location: { origin: 'https://simphonia.pt', hostname: 'simphonia.pt' },
    },
    WeakSet: WeakSet,
    URL: URL,
    MutationObserver: undefined,
    CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; } },
  };

  loadScript(sandbox);

  assert.notEqual(mailtoAnchor.target, '_blank', 'mailto link should not get target=_blank');
});

test('external-links: adds external icon to external links', function () {
  const doc = createEventTarget();
  const externalAnchor = createAnchor('https://stripe.com/docs');

  const sandbox = {
    document: Object.assign(doc, {
      readyState: 'complete',
      querySelectorAll(sel) {
        if (sel === 'a[href]') return [externalAnchor];
        return [];
      },
      createElement(tag) {
        return {
          tagName: tag,
          className: '',
          textContent: '',
          style: { cssText: '' },
          setAttribute(k, v) { this[k] = v; },
        };
      },
      body: {},
      documentElement: {},
    }),
    window: {
      location: { origin: 'https://simphonia.pt', hostname: 'simphonia.pt' },
    },
    WeakSet: WeakSet,
    URL: URL,
    MutationObserver: undefined,
    CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; } },
  };

  loadScript(sandbox);

  // Should have appended an icon span
  const iconChild = externalAnchor.children.find(c => c.className === 'external-icon');
  assert.ok(iconChild, 'External link should have an external-icon child');
  assert.equal(iconChild.textContent, ' ↗');
});

