---
name: simphonia-website-patterns
description: Coding patterns extracted from simphonia-website
version: 1.0.0
source: local-git-analysis
analyzed_commits: 200
---

# Simphonia Website Patterns

## Commit Conventions

Most commits use descriptive free-form messages grouped by scope. Occasional conventional-commit prefixes appear for precision:

- `fix:` — Bug fixes (e.g., `fix: footer social links`, `fix(security): escape API data`)
- `chore:` — Maintenance (e.g., `chore: replace cPanel deploy with CI test check`)
- `feat:` — Implied by "Add …" prefix (e.g., `Add Deep Links logic to the website`)
- Free-form scope phrases are common: `Website Improvements`, `Update Translation Files`, `Deep Links improvements`

When scoping a fix to a subsystem, use parentheses: `fix(security): …`, `fix(routing): …`.

## Code Architecture

```
simphonia-website/
├── index.html              # SPA shell — single entry point for all routes
├── pages/                  # HTML partial fragments (loaded by SPA router)
│   ├── home.html
│   ├── about.html
│   ├── destinations.html
│   └── …
├── <route>/                # One index.html per clean URL for direct access
│   └── index.html          # (about/, destinations/, support/, …)
├── js/
│   ├── main.js             # Bootstrap — deferred entry point
│   ├── router.js           # SPA router (History API)
│   ├── components/
│   │   └── layout.js       # Injects nav, footer, shell — keeps pages DRY
│   ├── i18n.js             # Translation engine (window.t())
│   ├── i18n/               # Per-locale JSON files (22 languages)
│   │   ├── en.json, es.json, pt.json … (22 files)
│   ├── animations-core.js  # Shared animation helpers
│   ├── animations-home.js  # Page-specific animation init
│   ├── animations-subpages.js
│   ├── destinations-page.js
│   ├── support.js
│   ├── legal.js
│   └── …                   # One JS file per feature/page
├── css/
│   ├── base.css            # Global styles & design tokens
│   ├── home.css, about.css, destinations.css … (per-page)
│   └── content-page.css    # Shared for legal/content pages
├── assets/                 # Images, icons, static media
├── tests/                  # Node.js native test runner (node:test)
├── scripts/                # Build/dev utilities (stamp-version.js, generate-head.sh)
├── .well-known/            # Apple App Site Association + assetlinks.json (deep links)
├── vercel.json             # Vercel deployment + security headers
├── netlify.toml            # Netlify deployment + security headers
└── _routes.json            # Cloudflare Pages routing
```

## SPA Router Pattern

Routes are declared in `js/router.js` under a `ROUTES` object:

```js
const ROUTES = {
  '/':             { page: 'home',    titleKey: 'page.titles.home',    descriptionKey: 'page.descriptions.home' },
  '/destinations': { page: 'destinations', titleKey: '…', descriptionKey: '…' },
  // robots field optional — add for noindex pages:
  '/join':         { page: 'join', titleKey: '…', descriptionKey: '…', robots: 'noindex, follow' },
};
```

- The router fetches `/pages/<name>` then `/pages/<name>.html` as fallback.
- Each page has a corresponding `<route>/index.html` shell for direct URL access.
- To add a new page: add entry to `ROUTES`, create `pages/<name>.html` partial, and create `<name>/index.html` shell.

## Layout Injection

`js/components/layout.js` is loaded as a deferred script and exposes these functions on `window`:

- `initTheme()` — applies dark/light theme
- `injectShell()` — injects the page shell container
- `injectNav()` — renders the top navigation bar
- `injectFooter()` — renders the footer
- `injectScrollProgress()`, `injectMobileCTA()`, `injectBackToTop()`, `injectCookieBanner()`

`main.js` checks `hasLayoutBootstrap()` before bootstrapping and lazy-loads `layout.js` if needed.

## Internationalisation (i18n)

- Translation function: `window.t(key)` — returns a localised string.
- Translation files live at `js/i18n/<locale>.json` (22 languages: ar, cs, de, en, es, fa, fr, hi, hu, id, it, ja, ko, nl, pl, pt, ru, tr, uk, vi, zh).
- Page titles and meta descriptions use i18n keys in the router: `titleKey`, `descriptionKey`.
- When adding new UI copy, add the key to **all 22 locale files**.

## Security Patterns

All user-facing HTML rendering uses the shared XSS-safe helpers defined in `js/components/layout.js`:

```js
// Safe HTML escaping — always use for untrusted strings in innerHTML
window.escHTML(str)   // uses textContent/innerHTML round-trip

// Country flags — uses flagcdn.com img tags (no Unicode flag emoji; broken on Windows)
window.flagEmoji(countryCode)
```

- Never interpolate raw API data into `innerHTML`. Use `escHTML()` or set `textContent` directly.
- Numeric fields (prices, discounts): always parse with `parseInt()` / `Number()` before use.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) are mirrored in both `vercel.json` and `netlify.toml` — keep them in sync.

## API Base URL

Environment-aware API URL via:

```js
window.SIMPHONIA_API.base  // 'http://localhost:3000' locally, 'https://api.simphonia.pt' in production
```

Always use `window.SIMPHONIA_API.base` for all backend requests — never hardcode URLs.

## Testing Patterns

- Framework: Node.js native `node:test` + `node:assert/strict` (no external test runner).
- Tests live in `tests/` with `.test.js` suffix, named after the module they cover.
- JS modules are loaded with `vm.runInThisContext(fs.readFileSync(...))` to test browser globals without a browser.
- Browser globals (`window`, `document`, `fetch`, etc.) are mocked manually in each test file.
- Run all tests: `node --test tests/*.test.js` (or `node --test`).

### Test File Naming

| Module | Test file |
|--------|-----------|
| `js/router.js` | `tests/router-full-document-partial.test.js`, `tests/router-legal-toc.test.js` |
| `js/support.js` | `tests/support-faq-sanitization.test.js` |
| `js/legal.js` | `tests/legal-toc.test.js` |
| `js/main.js` | `tests/main-marquee-visibility.test.js` |
| Deployment config | `tests/hosting-routing-config.test.js`, `tests/cloudflare-spa-fallback.test.js` |

## Deployment

The site is multi-platform static (no build step):

- **Vercel** — `vercel.json` (rewrites, security headers, `cleanUrls: true`, `trailingSlash: true`)
- **Netlify** — `netlify.toml` (redirects, headers)
- **Cloudflare Pages** — `_routes.json` + `functions/[[path]].js` SPA fallback

Cache strategy:
- `/css/*`, `/js/*`, `/assets/*` → `max-age=31536000, immutable`
- `/*.html` → `max-age=0, must-revalidate`

## Workflows

### Adding a New Page

1. Add the route entry to `ROUTES` in `js/router.js`.
2. Create the HTML partial: `pages/<name>.html` (the content fragment loaded by the router).
3. Create the direct-access shell: `<name>/index.html` (mirrors other route shells).
4. Add per-page CSS: `css/<name>.css` and link it in the partial.
5. If the page has page-specific JS: `js/<name>.js` or `js/<name>-page.js`.
6. Add title/description i18n keys to all 22 `js/i18n/*.json` files.
7. Update `sitemap.xml` if the route should be indexed.

### Adding a Translation Key

1. Add key to `js/i18n/en.json` first.
2. Propagate the key to all remaining 21 locale files.
3. Use `window.t('your.key')` in HTML partials or JS.

### Updating Security Headers

Headers are duplicated across `vercel.json` and `netlify.toml`. Always update **both** files together when changing CSP or other security headers.

### Deep Links

- Apple: `.well-known/apple-app-site-association`
- Android: `.well-known/assetlinks.json`
- Deep-link pages (`/join`, `/verify-email`, `/reset-password`, `/open-in-app`) use `robots: 'noindex, nofollow'` and have dedicated CSS in `css/deeplink.css`.
