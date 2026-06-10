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

function loadScript(sandbox) {
  const code = fs.readFileSync(
    path.resolve(__dirname, '..', 'js', 'scroll-progress.js'),
    'utf-8'
  );
  vm.runInNewContext(code, sandbox, { filename: 'scroll-progress.js' });
}

test('scroll-progress: creates progress bar element in the DOM', function () {
  const doc = createEventTarget();
  const win = createEventTarget();
  const bars = [];

  const sandbox = {
    document: Object.assign(doc, {
      readyState: 'complete',
      createElement(tag) {
        const el = {
          tagName: tag,
          id: '',
          style: { cssText: '' },
          setAttribute(k, v) { el[k] = v; },
        };
        return el;
      },
      body: {
        appendChild(child) { bars.push(child); }
      },
      documentElement: {
        scrollTop: 0,
        scrollHeight: 2000,
        clientHeight: 800,
      },
    }),
    window: Object.assign(win, {
      pageYOffset: 0,
    }),
    requestAnimationFrame(fn) { fn(); },
    setTimeout(fn, ms) { return 1; },
  };

  loadScript(sandbox);

  assert.equal(bars.length, 1, 'Should create exactly one progress bar');
  assert.equal(bars[0].id, 'scroll-progress-bar');
  assert.equal(bars[0]['aria-hidden'], 'true');
});

test('scroll-progress: hides bar when at top of page', function () {
  const doc = createEventTarget();
  const win = createEventTarget();
  let barStyle = {};

  const sandbox = {
    document: Object.assign(doc, {
      readyState: 'complete',
      createElement() {
        return {
          id: '',
          style: barStyle,
          setAttribute(k, v) { this[k] = v; },
        };
      },
      body: {
        appendChild() {}
      },
      documentElement: {
        scrollTop: 0,
        scrollHeight: 2000,
        clientHeight: 800,
      },
    }),
    window: Object.assign(win, {
      pageYOffset: 0,
    }),
    requestAnimationFrame(fn) { fn(); },
    setTimeout(fn, ms) { return 1; },
  };

  loadScript(sandbox);

  // Bar should be hidden (opacity 0) when at top
  assert.equal(barStyle.opacity, '0');
});

test('scroll-progress: updates width when scrolled', function () {
  const doc = createEventTarget();
  const win = createEventTarget();
  let barStyle = {};

  const sandbox = {
    document: Object.assign(doc, {
      readyState: 'complete',
      createElement() {
        return {
          id: '',
          style: barStyle,
          setAttribute(k, v) { this[k] = v; },
        };
      },
      body: {
        appendChild() {}
      },
      documentElement: {
        scrollTop: 600,
        scrollHeight: 2000,
        clientHeight: 800,
      },
    }),
    window: Object.assign(win, {
      pageYOffset: 600,
    }),
    requestAnimationFrame(fn) { fn(); },
    setTimeout(fn) { return 1; },
  };

  loadScript(sandbox);

  // Trigger scroll
  win.dispatch('scroll');

  // Bar should have a width > 0%
  assert.ok(barStyle.width, 'Bar should have a width set');
  assert.notEqual(barStyle.width, '0%', 'Bar should not be 0% when scrolled');
  assert.equal(barStyle.opacity, '1', 'Bar should be visible when scrolled');
});

test('scroll-progress: reset function resets bar', function () {
  const doc = createEventTarget();
  const win = createEventTarget();
  let barStyle = {};

  const sandbox = {
    document: Object.assign(doc, {
      readyState: 'complete',
      createElement() {
        return {
          id: '',
          style: barStyle,
          setAttribute(k, v) { this[k] = v; },
        };
      },
      body: {
        appendChild() {}
      },
      documentElement: {
        scrollTop: 0,
        scrollHeight: 2000,
        clientHeight: 800,
      },
    }),
    window: Object.assign(win, {
      pageYOffset: 0,
      __simphoniaScrollProgress: null,
    }),
    requestAnimationFrame(fn) { fn(); },
    setTimeout(fn, ms) { fn(); return 1; },
  };

  loadScript(sandbox);

  assert.ok(sandbox.window.__simphoniaScrollProgress, 'Should expose reset function');
  assert.equal(typeof sandbox.window.__simphoniaScrollProgress.reset, 'function');

  // Calling reset should not throw
  sandbox.window.__simphoniaScrollProgress.reset();
  assert.equal(barStyle.width, '0%');
  assert.equal(barStyle.opacity, '0');
});



