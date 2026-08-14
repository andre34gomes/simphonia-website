const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// auth.js is a self-invoking function that assigns window.getGuestToken.
// Running it in a fresh vm context per test (with a plain `window` object
// provided) gives each test an isolated module instance -- no shared
// _pendingFetch/module-level state leaking between tests.

function createSessionStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
  };
}

function loadAuthModule({ fetchImpl, apiBase } = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
  const context = {
    console,
    sessionStorage: createSessionStorage(),
    fetch: fetchImpl,
    window: { SIMPHONIA_API: { base: apiBase || 'https://api.simphonia.pt' } },
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'auth.js' });
  return context;
}

test('getGuestToken fetches and returns a fresh token', async () => {
  let callCount = 0;
  const ctx = loadAuthModule({
    fetchImpl: async (url, opts) => {
      callCount++;
      assert.equal(url, 'https://api.simphonia.pt/api/v1/auth/guest');
      assert.equal(opts.method, 'POST');
      return { ok: true, status: 200, json: async () => ({ data: { token: 'tok-1', expiresIn: 3600 } }) };
    },
  });

  const token = await ctx.window.getGuestToken();

  assert.equal(token, 'tok-1');
  assert.equal(callCount, 1);
});

test('getGuestToken returns the cached token without re-fetching while still valid', async () => {
  let callCount = 0;
  const ctx = loadAuthModule({
    fetchImpl: async () => {
      callCount++;
      return { ok: true, status: 200, json: async () => ({ data: { token: 'tok-cached', expiresIn: 3600 } }) };
    },
  });

  const first = await ctx.window.getGuestToken();
  const second = await ctx.window.getGuestToken();

  assert.equal(first, 'tok-cached');
  assert.equal(second, 'tok-cached');
  assert.equal(callCount, 1, 'expected only one network request for two calls within the expiry window');
});

test('getGuestToken refetches once the cached token has expired', async () => {
  let callCount = 0;
  const ctx = loadAuthModule({
    fetchImpl: async () => {
      callCount++;
      // Expires almost immediately so the second call is treated as expired.
      return { ok: true, status: 200, json: async () => ({ data: { token: 'tok-' + callCount, expiresIn: 0 } }) };
    },
  });

  const first = await ctx.window.getGuestToken();
  const second = await ctx.window.getGuestToken();

  assert.equal(first, 'tok-1');
  assert.equal(second, 'tok-2');
  assert.equal(callCount, 2);
});

test('getGuestToken deduplicates concurrent in-flight requests', async () => {
  let callCount = 0;
  let resolveFetch;
  const ctx = loadAuthModule({
    fetchImpl: () => {
      callCount++;
      return new Promise((resolve) => {
        resolveFetch = () => resolve({
          ok: true, status: 200, json: async () => ({ data: { token: 'tok-shared', expiresIn: 3600 } }),
        });
      });
    },
  });

  const p1 = ctx.window.getGuestToken();
  const p2 = ctx.window.getGuestToken();
  resolveFetch();
  const [t1, t2] = await Promise.all([p1, p2]);

  assert.equal(t1, 'tok-shared');
  assert.equal(t2, 'tok-shared');
  assert.equal(callCount, 1, 'expected concurrent calls to share a single in-flight request');
});

test('getGuestToken accepts a flat (non-enveloped) response shape', async () => {
  const ctx = loadAuthModule({
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ token: 'tok-flat', expiresIn: 60 }) }),
  });

  assert.equal(await ctx.window.getGuestToken(), 'tok-flat');
});

test('getGuestToken rejects when the response is not ok', async () => {
  const ctx = loadAuthModule({
    fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) }),
  });

  await assert.rejects(() => ctx.window.getGuestToken(), /500/);
});

test('getGuestToken rejects when the response has no token', async () => {
  const ctx = loadAuthModule({
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ data: {} }) }),
  });

  await assert.rejects(() => ctx.window.getGuestToken(), /no token/i);
});
