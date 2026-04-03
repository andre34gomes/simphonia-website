const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createEventTarget() {
  const listeners = new Map();

  return {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      if (!listeners.has(type)) return;
      listeners.set(type, listeners.get(type).filter(function (fn) {
        return fn !== handler;
      }));
    },
    dispatch(type, event) {
      (listeners.get(type) || []).slice().forEach(function (handler) {
        handler(event || { type: type });
      });
    }
  };
}

function createClassList() {
  const values = new Set();
  return {
    add(name) { values.add(name); },
    remove(name) { values.delete(name); },
    contains(name) { return values.has(name); }
  };
}

function createRuntime() {
  const documentEvents = createEventTarget();
  const windowEvents = createEventTarget();
  const timers = new Map();
  const rafCallbacks = new Map();
  const observerRecords = [];
  let nextTimerId = 1;
  let nextRafId = 1;

  function createMarqueeList() {
    return {
      attributes: {},
      innerHTML: '',
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      cloneNode() {
        return createMarqueeList();
      }
    };
  }

  const originalList = createMarqueeList();
  const marqueeLists = [originalList];
  const track = {
    querySelector(selector) {
      return selector === '.marquee-list' ? marqueeLists[0] : null;
    },
    querySelectorAll(selector) {
      return selector === '.marquee-list' ? marqueeLists.slice() : [];
    },
    appendChild(node) {
      marqueeLists.push(node);
      return node;
    }
  };

  const stripEvents = createEventTarget();
  const strip = {
    dataset: {},
    style: {},
    scrollLeft: 0,
    scrollWidth: 600,
    querySelector(selector) {
      return selector === '.marquee-track' ? track : null;
    },
    querySelectorAll(selector) {
      return selector === '.marquee-list' ? marqueeLists.slice() : [];
    },
    addEventListener: stripEvents.addEventListener,
    removeEventListener: stripEvents.removeEventListener,
    dispatch(type, event) {
      stripEvents.dispatch(type, event || { type: type });
    },
    matches() {
      return false;
    }
  };

  const document = {
    currentScript: { src: 'https://simphonia.pt/js/main.js?v=test' },
    hidden: false,
    readyState: 'complete',
    documentElement: { classList: createClassList(), dataset: {} },
    body: { classList: createClassList() },
    head: { appendChild() {} },
    scripts: [],
    querySelector(selector) {
      if (selector === '.hero__destinations-strip') return strip;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    getElementById() {
      return null;
    },
    createElement(tagName) {
      return {
        tagName: String(tagName || '').toUpperCase(),
        style: {},
        dataset: {},
        setAttribute() {},
        getAttribute() { return null; },
        appendChild() {},
        classList: createClassList(),
        rel: '',
        as: '',
        href: '',
        src: '',
        defer: false,
        onload: null,
        onerror: null
      };
    },
    addEventListener: documentEvents.addEventListener,
    removeEventListener: documentEvents.removeEventListener,
    dispatchEvent(event) {
      documentEvents.dispatch(event.type, event);
    }
  };

  const windowObject = {
    document,
    location: {
      href: 'https://simphonia.pt/',
      origin: 'https://simphonia.pt',
      pathname: '/',
      hash: ''
    },
    history: { pushState() {} },
    navigator: {
      language: 'en',
      connection: { saveData: true }
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    addEventListener: windowEvents.addEventListener,
    removeEventListener: windowEvents.removeEventListener,
    dispatch(type, event) {
      windowEvents.dispatch(type, event || { type: type });
    },
    matchMedia() {
      return { matches: false, addEventListener() {} };
    },
    initTheme() {},
    injectShell() {},
    injectNav() {},
    injectFooter() {},
    injectNoscript() {},
    injectScrollProgress() {},
    injectMobileCTA() {},
    injectBackToTop() {},
    injectCookieBanner() {},
    initRouter() {},
    flagEmoji() { return '🏳️'; },
    getGuestToken() { return Promise.resolve('guest-token'); },
    SIMPHONIA_API: { base: 'https://api.simphonia.pt' },
    SIMPHONIA_LANG: 'en',
    i18nReady: Promise.resolve(),
    t(key) {
      if (key === 'home.hero.typingPhrases') return ['Anywhere'];
      return key;
    },
    scrollTo() {},
    fetch() {
      return Promise.resolve({ ok: true, json() { return Promise.resolve([]); } });
    }
  };

  function requestAnimationFrame(callback) {
    const id = nextRafId++;
    rafCallbacks.set(id, callback);
    return id;
  }

  const cancelledRafIds = [];

  function cancelAnimationFrame(id) {
    cancelledRafIds.push(id);
    rafCallbacks.delete(id);
  }

  function setTimeoutStub(callback) {
    const id = nextTimerId++;
    timers.set(id, callback);
    return id;
  }

  function clearTimeoutStub(id) {
    timers.delete(id);
  }

  function IntersectionObserver(callback) {
    this.observe = function (target) {
      observerRecords.push({ callback: callback, target: target });
    };
    this.disconnect = function () {};
    this.unobserve = function () {};
  }

  const context = {
    console,
    window: windowObject,
    document,
    history: windowObject.history,
    location: windowObject.location,
    navigator: windowObject.navigator,
    localStorage: windowObject.localStorage,
    sessionStorage: windowObject.sessionStorage,
    Promise,
    URL,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Date,
    RegExp,
    Map,
    Set,
    AbortController: class {
      constructor() {
        this.signal = {};
      }
      abort() {}
    },
    IntersectionObserver,
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    CustomEvent: function (type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    fetch: windowObject.fetch,
    requestAnimationFrame,
    cancelAnimationFrame,
    setTimeout: setTimeoutStub,
    clearTimeout: clearTimeoutStub,
    queueMicrotask,
    encodeURIComponent,
    decodeURIComponent
  };

  windowObject.requestAnimationFrame = requestAnimationFrame;
  windowObject.cancelAnimationFrame = cancelAnimationFrame;
  windowObject.setTimeout = setTimeoutStub;
  windowObject.clearTimeout = clearTimeoutStub;
  windowObject.IntersectionObserver = IntersectionObserver;
  windowObject.AbortController = context.AbortController;
  windowObject.fetch = context.fetch;
  windowObject.CustomEvent = context.CustomEvent;

  const source = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'main.js'),
    'utf8'
  );
  vm.runInNewContext(source, context, { filename: 'main.js' });

  return {
    window: windowObject,
    document,
    strip,
    cancelledRafIds,
    getPendingRafIds() {
      return Array.from(rafCallbacks.keys());
    },
    flushAnimationFrames() {
      const queue = Array.from(rafCallbacks.entries());
      rafCallbacks.clear();
      queue.forEach(function (entry) {
        entry[1]();
      });
    },
    setHidden(hidden) {
      document.hidden = hidden;
      documentEvents.dispatch('visibilitychange', { type: 'visibilitychange' });
    },
    setIntersecting(isIntersecting) {
      observerRecords.forEach(function (record) {
        record.callback([{ isIntersecting: isIntersecting, target: record.target }]);
      });
    },
    dispatchWindow(type, event) {
      windowObject.dispatch(type, event || { type: type });
    }
  };
}

test('home destinations marquee cancels its pending animation frame when the tab becomes hidden', () => {
  const runtime = createRuntime();

  runtime.window.initDestinationsMarquee();
  runtime.setIntersecting(true);

  const pendingBeforeHide = runtime.getPendingRafIds();
  assert.equal(pendingBeforeHide.length, 1);

  runtime.setHidden(true);

  assert.deepEqual(runtime.cancelledRafIds, [pendingBeforeHide[0]]);
  assert.deepEqual(runtime.getPendingRafIds(), []);
});

test('home destinations marquee resumes only after the tab becomes visible again', () => {
  const runtime = createRuntime();

  runtime.window.initDestinationsMarquee();
  runtime.setIntersecting(true);

  const firstRafId = runtime.getPendingRafIds()[0];
  runtime.setHidden(true);
  assert.deepEqual(runtime.getPendingRafIds(), []);

  runtime.setHidden(false);
  const pendingAfterShow = runtime.getPendingRafIds();
  assert.equal(pendingAfterShow.length, 1);
  assert.notEqual(pendingAfterShow[0], firstRafId);

  runtime.flushAnimationFrames();
  assert.equal(runtime.strip.scrollLeft > 0, true);
});

test('home destinations marquee stays stopped after pagehide and restarts on pageshow', () => {
  const runtime = createRuntime();

  runtime.window.initDestinationsMarquee();
  runtime.setIntersecting(true);

  const firstRafId = runtime.getPendingRafIds()[0];
  runtime.dispatchWindow('pagehide', { type: 'pagehide' });

  assert.deepEqual(runtime.cancelledRafIds, [firstRafId]);
  assert.deepEqual(runtime.getPendingRafIds(), []);

  runtime.dispatchWindow('pageshow', { type: 'pageshow', persisted: true });
  assert.equal(runtime.getPendingRafIds().length, 1);
});

