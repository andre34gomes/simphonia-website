const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createEventTarget() {
  const listeners = Object.create(null);
  return {
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
    },
    dispatchEvent(event) {
      (listeners[event.type] || []).forEach(function (handler) {
        handler(event);
      });
    }
  };
}

function createPage(pageName) {
  return {
    tagName: 'DIV',
    dataset: { page: pageName },
    style: { display: 'none' },
    getAttribute(name) {
      return name === 'data-page' ? pageName : null;
    },
    setAttribute() {},
    focus() {},
  };
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function partialFor(url) {
  if (String(url).indexOf('/pages/privacy') !== -1) return '<div data-page="privacy"></div>';
  if (String(url).indexOf('/pages/terms') !== -1) return '<div data-page="terms"></div>';
  if (String(url).indexOf('/pages/about') !== -1) return '<div data-page="about"></div>';
  return '<div data-page="home"></div>';
}

test('router cleans up legal TOC listeners across legal-page navigation and exit', async () => {
  const events = createEventTarget();
  const pages = Object.create(null);
  let initCalls = 0;
  let cleanupCalls = 0;

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
    title: '',
    head: { appendChild() {} },
    addEventListener: events.addEventListener,
    dispatchEvent: events.dispatchEvent,
    getElementById(id) {
      if (id === 'main-content') return mainContent;
      return { setAttribute() {}, getAttribute() { return ''; }, removeAttribute() {} };
    },
    querySelector(selector) {
      const match = selector.match(/^\[data-page="([^"]+)"\]$/);
      return match ? (pages[match[1]] || null) : null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-page]') return Object.values(pages);
      if (selector === '.nav__link' || selector === '.mobile-nav__link') return [];
      return [];
    },
    createElement(tagName) {
      if (tagName === 'link') {
        return { rel: '', as: '', href: '' };
      }
      if (tagName === 'div') {
        const tmp = {
          firstChild: null,
          querySelectorAll(selector) {
            return { forEach: function() {} };
          },
          set innerHTML(value) {
            const match = value.match(/data-page="([^"]+)"/i);
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
      return {
        setAttribute() {},
        getAttribute() { return ''; },
        removeAttribute() {},
        style: {},
        classList: { toggle() {}, add() {}, remove() {} }
      };
    }
  };

  const location = { pathname: '/privacy/', origin: 'https://simphonia.pt' };
  const history = {
    pushState(_state, _title, nextPath) {
      location.pathname = nextPath;
    }
  };

  const windowObj = {
    location,
    history,
    currentRoute: null,
    __simphoniaLegalTocCleanup: null,
    scrollTo() {},
    resetAnimations() {},
    applyTranslations() {},
    t(key) { return key; },
    addEventListener() {}
  };

  const context = {
    window: windowObj,
    document,
    history,
    console,
    fetch: async function (url) {
      return {
        ok: true,
        text: async function () {
          return partialFor(url);
        }
      };
    },
    AbortController: class {
      constructor() {
        this.signal = {};
      }
      abort() {}
    },
    setTimeout(fn) {
      fn();
      return 1;
    },
    clearTimeout() {},
    requestAnimationFrame(fn) {
      fn();
      return 1;
    },
    cancelAnimationFrame() {},
    CustomEvent: function (type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    initAnimations: undefined,
    initLegalToc: function () {
      initCalls += 1;
      windowObj.__simphoniaLegalTocCleanup = function () {
        cleanupCalls += 1;
        windowObj.__simphoniaLegalTocCleanup = null;
      };
    },
    DOMParser: undefined,
  };

  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'js', 'router.js'), 'utf8'),
    context,
    { filename: 'router.js' }
  );

  context.window.initRouter();
  await flush();

  assert.equal(initCalls, 1);
  assert.equal(cleanupCalls, 0);

  context.window.navigateTo('/terms/', false);
  await flush();

  assert.equal(initCalls, 2);
  assert.equal(cleanupCalls, 1);

  context.window.navigateTo('/about/', false);
  await flush();

  assert.equal(cleanupCalls, 2);
});

