const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function createClassList() {
  const values = new Set();
  return {
    add(name) { values.add(name); },
    remove(name) { values.delete(name); },
    toggle(name, force) {
      if (typeof force === 'boolean') {
        if (force) values.add(name); else values.delete(name);
        return force;
      }
      if (values.has(name)) { values.delete(name); return false; }
      values.add(name);
      return true;
    },
    contains(name) { return values.has(name); },
  };
}

function createElement(id) {
  return {
    id,
    attributes: {},
    classList: createClassList(),
    focusCalls: [],
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name]; },
    focus(options) { this.focusCalls.push(options); },
  };
}

function createRuntime(options = {}) {
  const rafQueue = [];
  const listeners = new Map();
  const elements = new Map();
  const scrollTrigger = { refreshCalls: 0, refresh() { this.refreshCalls += 1; } };

  const document = {
    readyState: options.readyState || 'complete',
    documentElement: { classList: createClassList(), dataset: {} },
    body: { classList: createClassList() },
    getElementById(id) { return elements.get(id) || null; },
    querySelector() { return null; },
  };

  const windowObject = {
    innerWidth: options.innerWidth || 1200,
    location: { hash: options.hash || '' },
    addEventListener(type, handler, opts) {
      const once = opts && opts.once;
      const wrapped = once
        ? (...args) => {
            windowObject.removeEventListener(type, wrapped);
            handler(...args);
          }
        : handler;
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(wrapped);
    },
    removeEventListener(type, handler) {
      if (!listeners.has(type)) return;
      listeners.set(type, listeners.get(type).filter((fn) => fn !== handler));
    },
    dispatch(type, event = {}) {
      (listeners.get(type) || []).slice().forEach((h) => h(event));
    },
  };

  const context = {
    console,
    Date,
    decodeURIComponent,
    encodeURIComponent,
    window: windowObject,
    document,
    ScrollTrigger: scrollTrigger,
    localStorage: { getItem() { return null; }, setItem() {} },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    setTimeout(fn) { fn(); return 1; },
    clearTimeout() {},
    requestAnimationFrame(fn) { rafQueue.push(fn); return rafQueue.length; },
  };

  windowObject.document = document;
  windowObject.ScrollTrigger = scrollTrigger;
  windowObject.requestAnimationFrame = context.requestAnimationFrame;

  const source = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'components', 'layout.js'),
    'utf8'
  );
  vm.runInNewContext(source, context, { filename: 'layout.js' });

  return {
    context,
    window: windowObject,
    document,
    scrollTrigger,
    addElement(id) {
      const el = createElement(id);
      elements.set(id, el);
      return el;
    },
    flushRAF() {
      while (rafQueue.length) {
        const queue = rafQueue.splice(0);
        queue.forEach((fn) => fn());
      }
    },
    dispatch(type, event) { windowObject.dispatch(type, event); },
  };
}

// ─────────────────────────────────────────────────────────
test('scroll lock only touches body — never html', () => {
  const runtime = createRuntime();
  const coordinator = runtime.window.scrollCoordinator;

  coordinator.setScrollLocked(true);
  // body gets the class
  assert.equal(runtime.document.body.classList.contains('nav-scroll-locked'), true);
  // html must NOT get the class (prevents WebKit scroll-container confusion)
  assert.equal(runtime.document.documentElement.classList.contains('nav-scroll-locked'), false);

  coordinator.clearScrollLock();
  assert.equal(runtime.document.body.classList.contains('nav-scroll-locked'), false);
});

// ─────────────────────────────────────────────────────────
test('refresh scheduling is deduped within the same frame', () => {
  const runtime = createRuntime();
  const coordinator = runtime.window.scrollCoordinator;

  coordinator.scheduleRefresh();
  coordinator.scheduleRefresh();   // second call is a no-op while pending
  assert.equal(runtime.scrollTrigger.refreshCalls, 0);

  runtime.flushRAF();
  assert.equal(runtime.scrollTrigger.refreshCalls, 1);
});

// ─────────────────────────────────────────────────────────
test('waitForLoad defers refresh until load fires', () => {
  const runtime = createRuntime({ readyState: 'loading' });
  const coordinator = runtime.window.scrollCoordinator;

  coordinator.scheduleRefresh({ waitForLoad: true });
  runtime.flushRAF();
  assert.equal(runtime.scrollTrigger.refreshCalls, 0);   // still loading

  runtime.document.readyState = 'complete';
  runtime.dispatch('load');
  runtime.flushRAF();
  assert.equal(runtime.scrollTrigger.refreshCalls, 1);
});

// ─────────────────────────────────────────────────────────
test('hash focus targets element without forcing another scroll', () => {
  const runtime = createRuntime({ hash: '#faq-section' });
  const coordinator = runtime.window.scrollCoordinator;
  const target = runtime.addElement('faq-section');

  const result = coordinator.focusHashTarget();
  assert.equal(result, target);
  runtime.flushRAF();

  assert.equal(target.getAttribute('tabindex'), '-1');
  assert.deepEqual(target.focusCalls, [{ preventScroll: true }]);
});

// ─────────────────────────────────────────────────────────
test('pageshow clears stale scroll lock and refreshes after bfcache restore', () => {
  const runtime = createRuntime();
  const coordinator = runtime.window.scrollCoordinator;

  coordinator.setScrollLocked(true);
  assert.equal(runtime.document.body.classList.contains('nav-scroll-locked'), true);

  runtime.dispatch('pageshow', { persisted: true });
  runtime.flushRAF();

  assert.equal(runtime.document.body.classList.contains('nav-scroll-locked'), false);
  assert.equal(runtime.scrollTrigger.refreshCalls, 1);
});

// ─────────────────────────────────────────────────────────
test('pageshow without persistence clears lock but does not refresh', () => {
  const runtime = createRuntime();
  const coordinator = runtime.window.scrollCoordinator;

  coordinator.setScrollLocked(true);
  runtime.dispatch('pageshow', { persisted: false });
  runtime.flushRAF();

  assert.equal(runtime.document.body.classList.contains('nav-scroll-locked'), false);
  assert.equal(runtime.scrollTrigger.refreshCalls, 0);
});

// ─────────────────────────────────────────────────────────
test('resize does not trigger refresh — GSAP handles resize internally', () => {
  const runtime = createRuntime({ innerWidth: 1200 });

  // Same width → no refresh
  runtime.dispatch('resize');
  runtime.flushRAF();
  assert.equal(runtime.scrollTrigger.refreshCalls, 0);

  // Width change → still no refresh from coordinator
  runtime.window.innerWidth = 900;
  runtime.dispatch('resize');
  runtime.flushRAF();
  assert.equal(runtime.scrollTrigger.refreshCalls, 0);
});
