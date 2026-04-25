const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createLink(hash) {
  const listeners = { click: [] };
  return {
    classList: {
      toggle() {}
    },
    getAttribute(name) {
      return name === 'href' ? hash : null;
    },
    addEventListener(type, handler) {
      listeners[type].push(handler);
    },
    removeEventListener(type, handler) {
      listeners[type] = listeners[type].filter(function (candidate) {
        return candidate !== handler;
      });
    },
    listenerCount(type) {
      return listeners[type].length;
    }
  };
}

function extractFunctionSource(source, functionName) {
  const marker = 'function ' + functionName + '()';
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'Could not find ' + functionName + ' in main.js');

  let depth = 0;
  let bodyStart = source.indexOf('{', start);
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) {
      return source.slice(start, i + 1);
    }
  }

  throw new Error('Could not extract ' + functionName + ' body');
}

function loadMainContext() {
  const links = [createLink('#section-a'), createLink('#section-b')];
  const sections = {
    '#section-a': {
      id: 'section-a',
      getBoundingClientRect() {
        return { top: 0 };
      }
    },
    '#section-b': {
      id: 'section-b',
      getBoundingClientRect() {
        return { top: 200 };
      }
    }
  };

  const windowListeners = { scroll: [] };
  const windowObj = {
    __simphoniaLegalTocCleanup: null,
    innerHeight: 900,
    location: { href: 'https://simphonia.pt/privacy/' },
    addEventListener(type, handler) {
      (windowListeners[type] ||= []).push(handler);
    },
    removeEventListener(type, handler) {
      windowListeners[type] = (windowListeners[type] || []).filter(function (candidate) {
        return candidate !== handler;
      });
    },
    listenerCount(type) {
      return (windowListeners[type] || []).length;
    }
  };

  const document = {
    currentScript: null,
    scripts: [],
    head: { appendChild() {} },
    documentElement: {},
    querySelectorAll(selector) {
      if (selector === '.legal-toc__link') return links;
      return [];
    },
    querySelector(selector) {
      return sections[selector] || null;
    }
  };

  const context = {
    window: windowObj,
    document,
    console,
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
    getComputedStyle() {
      return {
        getPropertyValue() {
          return '72';
        }
      };
    }
  };

  const mainSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
  vm.runInNewContext(
    extractFunctionSource(mainSource, 'initLegalToc'),
    context,
    { filename: 'main.js' }
  );

  return {
    context,
    links,
    windowObj,
  };
}

test('initLegalToc remains idempotent across repeated initialisation', () => {
  const { context, links, windowObj } = loadMainContext();

  assert.equal(typeof context.initLegalToc, 'function');

  context.initLegalToc();
  assert.equal(windowObj.listenerCount('scroll'), 1);
  assert.equal(links[0].listenerCount('click'), 1);
  assert.equal(links[1].listenerCount('click'), 1);

  context.initLegalToc();
  assert.equal(windowObj.listenerCount('scroll'), 1);
  assert.equal(links[0].listenerCount('click'), 1);
  assert.equal(links[1].listenerCount('click'), 1);

  assert.equal(typeof windowObj.__simphoniaLegalTocCleanup, 'function');
  windowObj.__simphoniaLegalTocCleanup();
  assert.equal(windowObj.listenerCount('scroll'), 0);
  assert.equal(links[0].listenerCount('click'), 0);
  assert.equal(links[1].listenerCount('click'), 0);
});


