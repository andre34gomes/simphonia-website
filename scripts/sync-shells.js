#!/usr/bin/env node

/**
 * sync-shells.js
 *
 * Generates static route shells from index.html and scripts/pages.conf.
 * Each clean-URL route gets the shared SPA shell plus crawlable metadata
 * appropriate to the route, so direct URL access works without duplicating
 * shell markup by hand.
 *
 * Usage:
 *   node scripts/sync-shells.js           # sync + exit 0
 *   node scripts/sync-shells.js --check   # dry-run; exit 1 if any shell is out of sync
 *
 * Run with --check in CI to catch accidental shell drift before deploy.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const SHELL_SRC  = path.join(ROOT, 'index.html');
const PAGE_CONFIG = path.join(__dirname, 'pages.conf');
const PARTIALS_DIR = path.join(ROOT, 'pages');
const LEGAL_CONTENT_DIR = path.join(ROOT, 'content', 'legal');
const SITE_URL = 'https://simphonia.pt';
const DEEP_LINK_ROUTES = [
  {
    dir: 'join',
    title: 'You\u2019ve Been Invited! — Simphonia',
    description: 'Open the Simphonia app to accept your invitation.',
    titleKey: 'page.titles.join',
    descriptionKey: 'page.descriptions.join',
    robots: 'noindex, follow'
  },
  {
    dir: 'open-in-app',
    title: 'Open Simphonia on Your Phone',
    description: 'Open this Simphonia link on your phone to continue.',
    titleKey: 'page.titles.openInApp',
    descriptionKey: 'page.descriptions.openInApp',
    robots: 'noindex, nofollow'
  },
  {
    dir: 'verify-email',
    title: 'Verify Email — Simphonia',
    description: 'Verify your Simphonia email address in the app.',
    titleKey: 'page.titles.verifyEmail',
    descriptionKey: 'page.descriptions.verifyEmail',
    robots: 'noindex, nofollow'
  },
  {
    dir: 'reset-password',
    title: 'Reset Password — Simphonia',
    description: 'Reset your Simphonia password securely in the app.',
    titleKey: 'page.titles.resetPassword',
    descriptionKey: 'page.descriptions.resetPassword',
    robots: 'noindex, nofollow'
  }
];

const CHECK_MODE = process.argv.includes('--check');

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}

function readRoutes() {
  return fs.readFileSync(PAGE_CONFIG, 'utf8')
    .split(/\r?\n/)
    .filter(function (line) { return line && !line.startsWith('#'); })
    .map(function (line) {
      const [slug, title, description, assetPrefix, cssFile, titleKey, descriptionKey, schema] = line.split('|');
      if (!slug || !title || !description || !titleKey || !descriptionKey || !schema) {
        throw new Error('Invalid route metadata in ' + PAGE_CONFIG + ': ' + line);
      }
      return { slug, title, description, assetPrefix, cssFile, titleKey, descriptionKey, schema };
    });
}

function canonicalUrl(slug) {
  return SITE_URL + slug;
}

function organizationSchema() {
  return {
    '@type': 'Organization',
    name: 'Simphonia',
    url: SITE_URL,
    logo: SITE_URL + '/assets/og-image.png',
    description: 'Instant eSIM activation for 200+ countries. No roaming fees, no SIM swaps, no contracts.',
    foundingDate: '2024',
    founder: { '@type': 'Person', name: 'André Gomes' },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@simphonia.pt',
      url: SITE_URL + '/support/'
    },
    sameAs: [
      'https://instagram.com/simphonia.pt',
      'https://x.com/simphonia',
      'https://linkedin.com/company/simphonia'
    ]
  };
}

function structuredData(route) {
  const url = canonicalUrl(route.slug);
  if (route.schema === 'organization') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        organizationSchema(),
        {
          '@type': 'AboutPage',
          name: route.title,
          description: route.description,
          url: url,
          about: { '@type': 'Organization', name: 'Simphonia', url: SITE_URL }
        }
      ]
    };
  }

  if (route.schema === 'webpage') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: route.title,
      description: route.description,
      url: url,
      isPartOf: { '@type': 'WebSite', name: 'Simphonia', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'Simphonia', url: SITE_URL }
    };
  }

  throw new Error('Unsupported schema type "' + route.schema + '" for ' + route.slug);
}

function noScriptFallback(route) {
  const pageName = route.slug.replace(/^\/|\/$/g, '');
  if (pageName === 'join') {
    return '<div data-page="join"><section class="deeplink-page"><div class="deeplink-page__card">' +
      '<h1>You\u2019ve Been Invited!</h1><p>Open this invitation in the Simphonia app to continue.</p>' +
      '<p><a href="https://apps.apple.com/app/simphonia" class="btn btn--primary">Download Simphonia</a></p>' +
      '</div></section></div>';
  }
  if (pageName === 'open-in-app') {
    return '<div data-page="open-in-app"><section class="deeplink-page"><div class="deeplink-page__card">' +
      '<h1>Open Simphonia on Your Phone</h1><p>Download or open the Simphonia app on your phone to continue.</p>' +
      '<p><a href="https://apps.apple.com/app/simphonia" class="btn btn--primary">Download Simphonia</a></p>' +
      '</div></section></div>';
  }
  if (pageName === 'verify-email') {
    return '<div data-page="verify-email"><section class="deeplink-page"><div class="deeplink-page__card">' +
      '<h1>Verify Your Email</h1><p>Open this verification link in the Simphonia app to continue.</p>' +
      '<p><a href="https://apps.apple.com/app/simphonia" class="btn btn--primary">Download Simphonia</a></p>' +
      '</div></section></div>';
  }
  if (pageName === 'reset-password') {
    return '<div data-page="reset-password"><section class="deeplink-page"><div class="deeplink-page__card">' +
      '<h1>Reset Your Password</h1><p>Open this password-reset link in the Simphonia app to continue.</p>' +
      '<p><a href="https://apps.apple.com/app/simphonia" class="btn btn--primary">Download Simphonia</a></p>' +
      '</div></section></div>';
  }
  if (pageName === 'privacy' || pageName === 'terms') {
    return legalNoScriptFallback(pageName);
  }

  const partialPath = path.join(PARTIALS_DIR, pageName + '.html');
  if (!fs.existsSync(partialPath)) {
    throw new Error('Missing no-JavaScript page partial for ' + route.slug + ': ' + partialPath);
  }

  return fs.readFileSync(partialPath, 'utf8').trim();
}

function indentNoScriptContent(content) {
  return content.split(/\r?\n/).map(function (line) {
    return '    ' + line.trimEnd();
  }).join('\n');
}

function safeInlineHtml(value) {
  const escaped = escapeHtml(value);
  return escaped.replace(
    /&lt;a href=&quot;(\/(?!\/)[^"&]*|https?:\/\/[^"&]*)&quot;&gt;([\s\S]*?)&lt;\/a&gt;/g,
    function (_match, href, text) {
      return '<a href="' + href + '" rel="noopener noreferrer">' + text + '</a>';
    }
  );
}

function renderLegalBlock(block) {
  if (block.type === 'heading') {
    const level = Math.min(6, Math.max(2, Number(block.level) || 3));
    return '<h' + level + '>' + escapeHtml(block.text || '') + '</h' + level + '>';
  }
  if (block.type === 'list') {
    return '<ul>' + (block.items || []).map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join('') + '</ul>';
  }
  return '<p>' + (block.html ? safeInlineHtml(block.html) : escapeHtml(block.text || '')) + '</p>';
}

function legalNoScriptFallback(pageName) {
  const contentPath = path.join(LEGAL_CONTENT_DIR, pageName + '.json');
  if (!fs.existsSync(contentPath)) {
    throw new Error('Missing static legal content for ' + pageName + ': ' + contentPath);
  }
  const document = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const sections = (document.sections || []).map(function (section) {
    return '<h2 id="' + escapeHtml(section.id || '') + '">' + escapeHtml(section.title || '') + '</h2>' +
      (section.content || []).map(renderLegalBlock).join('');
  }).join('\n');
  const cta = document.cta
    ? '<div class="legal-cta"><div class="legal-cta__text"><h4>' + escapeHtml(document.cta.heading || '') +
      '</h4><p>' + escapeHtml(document.cta.description || '') + '</p></div><a href="' +
      escapeHtml(document.cta.buttonLink || '/') + '" class="btn btn--primary">' +
      escapeHtml(document.cta.buttonText || '') + '</a></div>'
    : '';

  return [
    '<div data-page="' + pageName + '">',
    '  <section class="legal-hero">',
    '    <div class="container rel-z1">',
    '      <span class="label reveal">' + escapeHtml(document.heroLabel || 'Legal') + '</span>',
    '      <h1 class="reveal"><span>' + escapeHtml(document.heroHeading1 || document.title || '') +
      '</span><br><span class="text-gradient">' + escapeHtml(document.heroHeading2 || '') + '</span></h1>',
    '      <p class="reveal">Last updated: ' + escapeHtml(document.lastUpdated || '') + '</p>',
    '    </div>',
    '  </section>',
    '  <section class="section section--compact-top">',
    '    <div class="container"><div class="legal-layout"><div class="legal-prose">',
    '      <p>' + escapeHtml(document.intro || '') + '</p>',
    sections,
    cta,
    '    </div></div></div>',
    '  </section>',
    '</div>'
  ].join('\n');
}

function renderShell(shell, route) {
  const canonical = canonicalUrl(route.slug);
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const schema = JSON.stringify(structuredData(route), null, 2)
    .split('\n')
    .map(function (line) { return '  ' + line; })
    .join('\n');
  const noScriptContent = noScriptFallback(route);

  return shell
    .replace(/  <title[^>]*>[\s\S]*?<\/title>/, '  <title data-i18n="' + route.titleKey + '">' + title + '</title>')
    .replace(/  <meta id="meta-description"[^>]*>/, '  <meta id="meta-description" name="description" content="' + description + '" data-i18n-content="' + route.descriptionKey + '">')
    .replace(/  <link id="canonical-url" rel="canonical" href="[^"]*">/, '  <link id="canonical-url" rel="canonical" href="' + canonical + '">')
    .replace(/  <link rel="alternate" hreflang="en"[\s\S]*?  <link rel="alternate" hreflang="x-default"[^>]*>\r?\n/, '')
    .replace(/  <meta id="og-title"[^>]*>/, '  <meta id="og-title" property="og:title" content="' + title + '" data-i18n-content="' + route.titleKey + '">')
    .replace(/  <meta id="og-description"[^>]*>/, '  <meta id="og-description" property="og:description" content="' + description + '" data-i18n-content="' + route.descriptionKey + '">')
    .replace(/  <meta id="og-url"[^>]*>/, '  <meta id="og-url" property="og:url" content="' + canonical + '">')
    .replace(/  <meta id="twitter-title"[^>]*>/, '  <meta id="twitter-title" name="twitter:title" content="' + title + '" data-i18n-content="' + route.titleKey + '">')
    .replace(/  <meta id="twitter-description"[^>]*>/, '  <meta id="twitter-description" name="twitter:description" content="' + description + '" data-i18n-content="' + route.descriptionKey + '">')
    .replace(
      /  <!-- Structured Data \(JSON-LD\)[\s\S]*?  <\/script>\r?\n/,
      '  <!-- Structured Data (JSON-LD) — generated from scripts/pages.conf -->\n' +
      '  <script type="application/ld+json">\n' + schema + '\n  </script>\n'
    )
    .replace(
      /(  <script defer src="\/js\/cdn-fallback\.js"><\/script>\r?\n)  <noscript>[\s\S]*?  <\/noscript>/,
      function (_match, fallbackScript) {
        return fallbackScript + '  <noscript>\n' +
          '    <style>.hero-postcard__orb{display:none}[data-page]{display:block!important}</style>\n' +
          indentNoScriptContent(noScriptContent) +
          '\n  </noscript>';
      }
    );
}

function renderNoIndexShell(shell, route) {
  const canonical = SITE_URL + '/' + route.dir + '/';
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const noScriptContent = noScriptFallback({ slug: '/' + route.dir + '/' });

  return shell
    .replace(/  <title[^>]*>[\s\S]*?<\/title>/, '  <title>' + title + '</title>')
    .replace(/  <meta id="meta-description"[^>]*>/, '  <meta id="meta-description" name="description" content="' + description + '">')
    .replace(/  <link id="canonical-url" rel="canonical" href="[^"]*">/, '  <link id="canonical-url" rel="canonical" href="' + canonical + '">')
    .replace(/  <link rel="alternate" hreflang="en"[\s\S]*?  <link rel="alternate" hreflang="x-default"[^>]*>\r?\n/, '')
    .replace(/  <meta id="meta-robots" name="robots" content="[^"]*">/, '  <meta id="meta-robots" name="robots" content="' + route.robots + '">')
    .replace(/  <meta id="og-title"[^>]*>/, '  <meta id="og-title" property="og:title" content="' + title + '">')
    .replace(/  <meta id="og-description"[^>]*>/, '  <meta id="og-description" property="og:description" content="' + description + '">')
    .replace(/  <meta id="og-url"[^>]*>/, '  <meta id="og-url" property="og:url" content="' + canonical + '">')
    .replace(/  <meta id="twitter-title"[^>]*>/, '  <meta id="twitter-title" name="twitter:title" content="' + title + '">')
    .replace(/  <meta id="twitter-description"[^>]*>/, '  <meta id="twitter-description" name="twitter:description" content="' + description + '">')
    .replace(/  <!-- Structured Data[\s\S]*?  <\/script>\r?\n/, '')
    .replace(
      /(  <script defer src="\/js\/cdn-fallback\.js"><\/script>\r?\n)  <noscript>[\s\S]*?  <\/noscript>/,
      function (_match, fallbackScript) {
        return fallbackScript + '  <noscript>\n' +
          '    <style>.hero-postcard__orb{display:none}[data-page]{display:block!important}</style>\n' +
          indentNoScriptContent(noScriptContent) +
          '\n  </noscript>';
      }
    );
}

function main() {
  if (!fs.existsSync(SHELL_SRC) || !fs.existsSync(PAGE_CONFIG)) {
    console.error('[sync-shells] ERROR: index.html or scripts/pages.conf is missing.');
    process.exit(1);
  }

  const shell = fs.readFileSync(SHELL_SRC, 'utf8');
  const routes = readRoutes().filter(function (route) { return route.slug !== '/'; });
  let   drifted = 0;
  let   synced  = 0;

  routes.forEach(function (route) {
    const dir = route.slug.replace(/^\/|\/$/g, '');
    const destDir  = path.join(ROOT, dir);
    const destFile = path.join(destDir, 'index.html');
    const expected = renderShell(shell, route).replace(/[ \t]+(?=\r?\n)/g, '');

    if (!fs.existsSync(destDir)) {
      if (CHECK_MODE) {
        console.error('[sync-shells] DRIFT  directory missing — ' + dir + '/');
        drifted++;
        return;
      }
      fs.mkdirSync(destDir, { recursive: true });
    }

    const existing = fs.existsSync(destFile) ? fs.readFileSync(destFile, 'utf8') : null;

    if (existing === expected) {
      console.log('[sync-shells] OK  ' + dir + '/index.html');
      return;
    }

    if (CHECK_MODE) {
      console.error('[sync-shells] DRIFT  ' + dir + '/index.html does not match generated shell');
      drifted++;
    } else {
      fs.writeFileSync(destFile, expected, 'utf8');
      console.log('[sync-shells] SYNC  ' + dir + '/index.html');
      synced++;
    }
  });

  DEEP_LINK_ROUTES.forEach(function (route) {
    const destFile = path.join(ROOT, route.dir, 'index.html');
    const existing = fs.existsSync(destFile) ? fs.readFileSync(destFile, 'utf8') : null;
    const expected = renderNoIndexShell(shell, route).replace(/[ \t]+(?=\r?\n)/g, '');

    if (existing === expected) {
      console.log('[sync-shells] OK  ' + route.dir + '/index.html');
      return;
    }
    if (CHECK_MODE) {
      console.error('[sync-shells] DRIFT  ' + route.dir + '/index.html does not match generated noindex metadata');
      drifted++;
      return;
    }
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.writeFileSync(destFile, expected, 'utf8');
    console.log('[sync-shells] SYNC  ' + route.dir + '/index.html');
    synced++;
  });

  if (CHECK_MODE) {
    if (drifted > 0) {
      console.error('\n[sync-shells] ' + drifted + ' shell(s) out of sync.');
      console.error('[sync-shells] Run: node scripts/sync-shells.js  to fix.');
      process.exit(1);
    } else {
      console.log('\n[sync-shells] All route shells are in sync.');
    }
  } else {
    console.log('\n[sync-shells] Done.' + (synced > 0 ? ' Synced ' + synced + ' shell(s).' : ' All shells were already in sync.'));
  }
}

main();
