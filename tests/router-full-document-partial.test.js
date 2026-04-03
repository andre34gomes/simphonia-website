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
      (listeners[event.type] || []).forEach((handler) => handler(event));
    }
  };
}

function createPage(pageName) {
  return {
    tagName: 'DIV',
    pageName,
    dataset: { page: pageName },
    style: { display: 'none' },
    setAttribute() {},
    getAttribute(name) {
      return name === 'data-page' ? pageName : null;
    }
  };
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function runRouterScenario(options) {
  const events = createEventTarget();
  const pages = Object.create(null);
  let appendedHtmlNodes = 0;
  const fetchCalls = [];

  options = options || {};
  var pageName = options.pageName || 'about';
  var pathname = options.pathname || ('/' + pageName + '/');
  var fetchImpl = options.fetchImpl;

  const mainContent = {
    appendChild(node) {
      if (node && node.tagName === 'HTML') {
        appendedHtmlNodes += 1;
      }
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
          set innerHTML(value) {
            if (/<html\b/i.test(value)) {
              this.firstChild = { tagName: 'HTML', style: {} };
              return;
            }

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
      return { setAttribute() {}, getAttribute() { return ''; }, removeAttribute() {}, style: {}, classList: { toggle() {}, add() {}, remove() {} } };
    }
  };

  const location = { pathname: pathname, origin: 'https://simphonia.pt' };
  const history = {
    pushState(_state, _title, pathValue) {
      location.pathname = pathValue;
    }
  };

  const windowObj = {
    location,
    history,
    currentRoute: null,
    scrollTo() {},
    resetAnimations() {},
    applyTranslations() {},
    t(key) {
      var map = {};
      map['page.titles.' + pageName] = pageName.charAt(0).toUpperCase() + pageName.slice(1);
      map['page.descriptions.' + pageName] = pageName + ' description';
      return map[key] || key;
    },
    addEventListener() {}
  };

  global.window = windowObj;
  global.document = document;
  global.history = history;
  global.fetch = async function (url) {
    fetchCalls.push(url);
    return fetchImpl(url);
  };
  global.AbortController = class {
    constructor() { this.signal = {}; }
    abort() {}
  };
  global.setTimeout = (fn) => { fn(); return 1; };
  global.clearTimeout = () => {};
  global.requestAnimationFrame = (fn) => { fn(); return 1; };
  global.cancelAnimationFrame = () => {};
  global.CustomEvent = function (type, init) {
    this.type = type;
    this.detail = init && init.detail;
  };
  global.initAnimations = undefined;
  global.initLegalToc = undefined;
  global.DOMParser = undefined;

  vm.runInThisContext(
    fs.readFileSync(path.join(__dirname, '..', 'js', 'router.js'), 'utf8'),
    { filename: 'router.js' }
  );

  window.initRouter();
  await flush();

  return {
    appendedHtmlNodes,
    fetchCalls,
    pages,
    windowObj,
  };
}

test('router extracts the page fragment when a full HTML document is returned', async () => {
  var result = await runRouterScenario({
    fetchImpl: async function () {
      return {
        ok: true,
        text: async function () {
          return '<!DOCTYPE html><html lang="en"><head><meta http-equiv="Content-Security-Policy" content="default-src \'self\'"></head><body><div data-page="about"></div></body></html>';
        }
      };
    }
  });

  assert.equal(result.appendedHtmlNodes, 0);
  assert.ok(result.pages.about);
  assert.equal(result.pages.about.style.display, 'block');
  assert.equal(result.windowObj.currentRoute, 'about');
});

test('router falls back to the next candidate when the first partial URL returns an invalid full document', async () => {
  var result = await runRouterScenario({
    fetchImpl: async function (url) {
      return {
        ok: true,
        text: async function () {
          if (String(url).indexOf('/pages/about.html') !== -1) {
            return '<div data-page="about"></div>';
          }
          return '<!DOCTYPE html><html lang="en"><head><meta http-equiv="Content-Security-Policy" content="default-src \'self\'"></head><body><main id="main-content"></main></body></html>';
        }
      };
    }
  });

  assert.deepEqual(result.fetchCalls, ['/pages/about', '/pages/about.html']);
  assert.equal(result.appendedHtmlNodes, 0);
  assert.ok(result.pages.about);
  assert.equal(result.pages.about.style.display, 'block');
  assert.equal(result.windowObj.currentRoute, 'about');
});


