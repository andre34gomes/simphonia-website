const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function extractFunctionSource(source, functionName) {
  const marker = 'function ' + functionName + '(';
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'Could not find ' + functionName + ' in support.js');

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

function loadHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'support.js'), 'utf8');
  const context = { console };
  vm.runInNewContext(
    [
      extractFunctionSource(source, 'escapeHtml'),
      extractFunctionSource(source, 'decodeFaqEntities'),
      extractFunctionSource(source, 'faqHtmlToText'),
    ].join('\n\n'),
    context,
    { filename: 'support.js' }
  );
  return context;
}

test('faqHtmlToText strips executable markup and preserves visible text only', () => {
  const { faqHtmlToText } = loadHelpers();

  const sanitized = faqHtmlToText(
    '<p>Hello <strong>traveler</strong></p>' +
      '<script>alert(1)</script>' +
      '<a href="javascript:alert(2)">Tap here</a>' +
      '<img src="x" onerror="alert(3)">' +
      '<ul><li>First</li><li>Second</li></ul>'
  );

  assert.equal(sanitized.includes('<'), false);
  assert.equal(sanitized.includes('script'), false);
  assert.equal(sanitized.includes('javascript:'), false);
  assert.match(sanitized, /Hello traveler/);
  assert.match(sanitized, /Tap here/);
  assert.match(sanitized, /• First/);
  assert.match(sanitized, /• Second/);
});

test('escapeHtml neutralizes dangerous FAQ question/category text', () => {
  const { escapeHtml } = loadHelpers();

  assert.equal(
    escapeHtml('<img src=x onerror=alert(1)>'),
    '&lt;img src=x onerror=alert(1)&gt;'
  );
  assert.equal(
    escapeHtml('Tom & Jerry'),
    'Tom &amp; Jerry'
  );
});

