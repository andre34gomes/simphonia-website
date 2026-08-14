const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// `flagEmoji` is fed country codes sourced from API data (destination/country
// lists) and its return value is concatenated directly into innerHTML by
// callers (js/main.js marquee, js/destinations-page.js grid). These tests
// guard against a malformed or attacker-influenced country code ever
// breaking out of the src/alt attributes it builds.

function extractFlagEmojiSource() {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'components', 'layout.js'),
    'utf8'
  );

  const marker = 'window.flagEmoji = function(code) {';
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'Could not find window.flagEmoji in layout.js');

  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) {
      const fnBody = source.slice(bodyStart, i + 1);
      return 'function flagEmoji(code) ' + fnBody;
    }
  }

  throw new Error('Could not extract flagEmoji body');
}

function loadFlagEmoji() {
  const context = {};
  vm.runInNewContext(extractFlagEmojiSource(), context, { filename: 'layout.js' });
  return context.flagEmoji;
}

test('flagEmoji renders a flag image for a valid lowercase code', () => {
  const flagEmoji = loadFlagEmoji();

  const html = flagEmoji('pt');

  assert.match(html, /^<img /);
  assert.match(html, /src="https:\/\/flagcdn\.com\/20x15\/pt\.png"/);
  assert.match(html, /srcset="https:\/\/flagcdn\.com\/40x30\/pt\.png 2x"/);
  assert.match(html, /alt="PT"/);
  assert.match(html, /loading="lazy"/);
});

test('flagEmoji normalizes an uppercase code to the same markup', () => {
  const flagEmoji = loadFlagEmoji();

  assert.equal(flagEmoji('PT'), flagEmoji('pt'));
});

test('flagEmoji only ever uses the first two letters, alt included', () => {
  const flagEmoji = loadFlagEmoji();

  // Regression guard: alt used to be built from the *unsliced* code while
  // src/srcset used only the first two characters, so a longer string
  // produced mismatched src="...us.png" / alt="USA" markup.
  const html = flagEmoji('USA');

  assert.match(html, /src="https:\/\/flagcdn\.com\/20x15\/us\.png"/);
  assert.match(html, /alt="US"/);
  assert.equal(html.includes('USA'), false);
});

test('flagEmoji rejects codes whose first two characters are not letters (XSS-safe)', () => {
  const flagEmoji = loadFlagEmoji();

  assert.equal(flagEmoji('"><img src=x onerror=alert(1)>'), '');
  assert.equal(flagEmoji('<script>'), '');
  assert.equal(flagEmoji('1x'), '');
  assert.equal(flagEmoji('  '), '');
});

test('flagEmoji returns empty string for falsy or too-short input', () => {
  const flagEmoji = loadFlagEmoji();

  assert.equal(flagEmoji(''), '');
  assert.equal(flagEmoji(null), '');
  assert.equal(flagEmoji(undefined), '');
  assert.equal(flagEmoji('p'), '');
});
