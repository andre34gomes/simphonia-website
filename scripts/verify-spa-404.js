#!/usr/bin/env node

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function createEventTarget() {
  const listeners = Object.create(null);
  return {
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
    },
    dispatchEvent(event) {
      (listeners[event.type] || []).forEach((handler) => handler(event));
    }
  };
}

function createAttributeElement(initial = {}) {
  return {
    attrs: { ...initial },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    getAttribute(name) { return this.attrs[name]; },
    removeAttribute(name) { delete this.attrs[name]; },
    classList: { toggle() {}, add() {}, remove() {} },
    style: {}
  };
}

function createPage(pageName) {
  return {
    pageName,
    style: { display: 'none' },
    dataset: { page: pageName },
    setAttribute() {},
    getAttribute(name) {
      return name === 'data-page' ? pageName : null;
    }
  };
}

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
}

async function main() {
  const pages = Object.create(null);
  const events = createEventTarget();
  const metaDescription = createAttributeElement({ content: '' });
  const ogTitle = createAttributeElement({ content: '' });
  const twitterTitle = createAttributeElement({ content: '' });
  const ogDescription = createAttributeElement({ content: '' });
  const twitterDescription = createAttributeElement({ content: '' });
  const robots = createAttributeElement({ content: 'index, follow' });
  const canonical = createAttributeElement({ href: 'https://simphonia.pt/' });
  const ogUrl = createAttributeElement({ content: 'https://simphonia.pt/' });

  const mainContent = {
    appendChild(node) {
      if (node && node.dataset && node.dataset.page) {
        pages[node.dataset.page] = node;
      }
      if (node && typeof node.__consume === 'function') {
        node.__consume();
      }
    }
  };

  const document = {
    hidden: false,
    title: '',
    head: { appendChild() {} },
    addEventListener: events.addEventListener,
    dispatchEvent: events.dispatchEvent,
    getElementById(id) {
      return {
        'main-content': mainContent,
        'meta-description': metaDescription,
        'og-title': ogTitle,
        'twitter-title': twitterTitle,
        'og-description': ogDescription,
        'twitter-description': twitterDescription,
        'meta-robots': robots,
        'canonical-url': canonical,
        'og-url': ogUrl
      }[id] || null;
    },
    querySelector(selector) {
      const match = selector.match(/^\[data-page="([^"]+)"]$/);
      return match ? (pages[match[1]] || null) : null;
    },
    querySelectorAll(selector) {
      return selector === '[data-page]' ? Object.values(pages) : [];
    },
    createElement(tagName) {
      if (tagName === 'link') return createAttributeElement();
      if (tagName === 'div') {
        const tmp = {
          firstChild: null,
          set innerHTML(value) {
            const match = value.match(/data-page="([^"]+)"/);
            if (!match) {
              this.firstChild = null;
              return;
            }
            const node = createPage(match[1]);
            node.__consume = () => {
              if (tmp.firstChild === node) tmp.firstChild = null;
            };
            this.firstChild = node;
          }
        };
        return tmp;
      }
      return createAttributeElement();
    }
  };

  const location = { pathname: '/missing-city/', origin: 'https://simphonia.pt' };
  const history = {
    pushState(_state, _title, path) {
      location.pathname = path;
    }
  };

  const windowObj = {
    location,
    history,
    currentRoute: null,
    matchMedia() {
      return { matches: false, addEventListener() {} };
    },
    scrollTo() {},
    resetAnimations() {},
    applyTranslations() {},
    initNotFoundPage() {
      windowObj.__notFoundInitCount = (windowObj.__notFoundInitCount || 0) + 1;
    },
    t(key) {
      return {
        'page.titles.home': 'Home',
        'page.descriptions.home': 'Home description',
        'page.titles.support': 'Support',
        'page.descriptions.support': 'Support description',
        'page.titles.notFound': 'Page Not Found',
        'page.descriptions.notFound': 'Not found description'
      }[key] || key;
    },
    addEventListener() {}
  };

  global.window = windowObj;
  global.document = document;
  global.history = history;
  global.fetch = async function (url) {
    return {
      ok: true,
      text: async function () {
        if (url.includes('not-found')) return '<div data-page="not-found"></div>';
        if (url.includes('support')) return '<div data-page="support"></div>';
        return '<div data-page="home"></div>';
      }
    };
  };
  global.AbortController = class {
    constructor() {
      this.signal = {};
    }
    abort() {}
  };
  global.setTimeout = (fn) => {
    fn();
    return 1;
  };
  global.clearTimeout = () => {};
  global.requestAnimationFrame = (fn) => {
    fn();
    return 1;
  };
  global.cancelAnimationFrame = () => {};
  global.CustomEvent = function (type, init) {
    this.type = type;
    this.detail = init && init.detail;
  };
  global.initAnimations = undefined;
  global.initLegalToc = undefined;

  vm.runInThisContext(
    fs.readFileSync('/Users/ctw03375/Projetos/simphonia-website/js/router.js', 'utf8'),
    { filename: 'router.js' }
  );

  assert.strictEqual(typeof window.initRouter, 'function');
  assert.strictEqual(typeof window.navigateTo, 'function');

  window.initRouter();
  await flush();

  assert.ok(pages['not-found']);
  assert.strictEqual(pages['not-found'].style.display, 'block');
  assert.strictEqual(window.currentRoute, 'not-found');
  assert.strictEqual(document.title, 'Page Not Found');
  assert.strictEqual(robots.attrs.content, 'noindex, follow');
  assert.strictEqual(canonical.attrs.href, 'https://simphonia.pt/missing-city/');
  assert.strictEqual(window.__notFoundInitCount, 1);

  window.navigateTo('/support/?ref=footer', true);
  await flush();

  assert.ok(pages['support']);
  assert.strictEqual(pages['support'].style.display, 'block');
  assert.strictEqual(pages['not-found'].style.display, 'none');
  assert.strictEqual(location.pathname, '/support/');
  assert.strictEqual(document.title, 'Support');
  assert.strictEqual(robots.attrs.content, 'index, follow');

  window.navigateTo('/another-missing-url/', true);
  await flush();

  assert.strictEqual(location.pathname, '/another-missing-url/');
  assert.strictEqual(canonical.attrs.href, 'https://simphonia.pt/another-missing-url/');
  assert.strictEqual(window.currentRoute, 'not-found');

  console.log('PASS verify-spa-404');
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});



