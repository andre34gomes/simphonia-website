<div align="center">

# Simphonia — Marketing Website

Premium marketing website for the Simphonia eSIM travel app.  
Apple-inspired design with 3D elements, glassmorphism, and scroll-driven animations.

</div>

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Semantic HTML5 with ARIA landmarks |
| Styling | CSS3 — Custom Properties, Grid, Flexbox, Backdrop Filter (split per-page, see below) |
| Scripting | Vanilla JavaScript (ES Modules), client-side router (`js/router.js`) |
| Animation | GSAP 3.12 + ScrollTrigger (vendored locally in `js/vendor/`, not a CDN) |
| Localization | 21-language JSON dictionaries in `js/i18n/`, loaded by `js/i18n.js` |
| Offline / caching | Service worker (`sw.js`) — network-first HTML, stale-while-revalidate assets |
| Hosting glue | Netlify/Vercel/Cloudflare-style edge functions (`functions/[[path]].js`) for SPA-shell 404 fallback |
| Typography | Inter (Google Fonts) |

There is no bundler/build step (no `package.json`) — plain static files served as-is.
Maintenance automation lives in `scripts/` (route-shell syncing, service-worker
precache list generation, i18n key/translation checks, version stamping) rather
than a bundler.

## Architecture: SPA shell + synced route shells

This is a client-routed single-page app, **not** a set of independent static
pages:
- `index.html` (and the near-identical `about/index.html`, `destinations/index.html`,
  `how-it-works/index.html`, `join/index.html`, `open-in-app/index.html`,
  `privacy/index.html`, `reset-password/index.html`, `support/index.html`,
  `terms/index.html`, `verify-email/index.html`) are **route shells**: the same
  document (head, nav, footer, script tags) served at every route so a direct
  link/refresh on any route works without a server round-trip to resolve the SPA.
  They are intentionally identical — `scripts/sync-shells.js` keeps them in sync
  and `tests/hosting-routing-config.test.js` asserts they stay that way. Don't
  hand-edit a route shell directly; edit the source shell and re-run the sync
  script.
- `pages/*.html` are the actual per-route **content partials** (`home.html`,
  `destinations.html`, `how-it-works.html`, `about.html`, `support.html`,
  `privacy.html`, `terms.html`, `join.html`, `open-in-app.html`,
  `reset-password.html`, `verify-email.html`, `not-found.html`) that `js/router.js`
  injects into the shell's `<main data-page>` on navigation.
- `functions/[[path]].js` + `functions/_shared/spa-fallback.mjs` run at the CDN
  edge to serve the right shell/`404.html` for extensionless navigations that
  miss a static file.
- There is no 3D globe/Three.js in this codebase (despite what older
  documentation said) — visuals are CSS/SVG plus GSAP-driven scroll animations.

## Pages

| Page | Shell route | Content partial | Description |
|------|-------------|------------------|-------------|
| **Home** | `/` | `pages/home.html` | Hero, trust bar, how-it-works, features, app showcase, destinations bento, testimonials, pricing |
| **Destinations** | `/destinations` | `pages/destinations.html` | Searchable/filterable grid of 200+ countries with plans |
| **How It Works** | `/how-it-works` | `pages/how-it-works.html` | Detailed 3-step guide with imagery and FAQ |
| **About** | `/about` | `pages/about.html` | Company story, mission, values, team |
| **Support** | `/support` | `pages/support.html` | Searchable FAQ accordion + contact form |
| **Privacy Policy** | `/privacy` | `pages/privacy.html` | Full privacy policy (fetched from the backend legal API, see `js/legal.js`) |
| **Terms of Service** | `/terms` | `pages/terms.html` | Full terms of service (same backend-fetched pattern) |
| **Join / Deep link / Verify email / Reset password / Open in app** | respective routes | matching `pages/*.html` | Mobile app deep-link and account-flow landing pages |

## File Structure

```
simphonia-website/
├── index.html, about/, destinations/, how-it-works/, join/, open-in-app/,
│   privacy/, reset-password/, support/, terms/, verify-email/   # synced route shells
├── css/
│   ├── base.css                # Shell/reset/tokens — render-blocking (styles the
│   │                            #   persistent nav/footer, visible pre-router)
│   ├── home.css, about.css, destinations.css, how-it-works.css,
│   │   support.css, legal.css, 404.css, deeplink.css, content-page.css
│   │                            # Per-page styles — preloaded non-render-blocking
│   │                            #   and swapped to active <link rel=stylesheet>
│   │                            #   by js/css-preload-swap.js once downloaded
├── js/
│   ├── main.js                  # Entry point — boots layout, theme, i18n
│   ├── router.js                # Client-side route resolution + partial injection
│   ├── css-preload-swap.js      # Converts preloaded page CSS into active stylesheets
│   ├── animations-core.js / animations-home.js / animations-subpages.js
│   │                             # GSAP scroll-triggered animations, split by scope
│   ├── i18n.js + i18n/*.json     # 21-language dictionaries
│   ├── vendor/gsap.min.js, ScrollTrigger.min.js
│   └── components/layout.js     # Shared nav + footer (DRY injection at runtime)
├── pages/                        # Per-route content partials (see table above)
├── functions/                     # Edge functions: SPA-shell 404 fallback routing
├── scripts/                       # Site maintenance: shell sync, i18n checks,
│                                   #   SW precache list generation, version stamping
├── tests/                         # Node test suite: routing, SPA fallback, security
│                                   #   headers/tokens, scroll behavior, i18n, a11y
├── sw.js                          # Service worker (network-first HTML, SWR assets)
└── assets/                        # Static assets (SVGs, images)
```

## Design System

### Colors (CSS Custom Properties)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#D4AF37` | Brand gold — buttons, highlights, links |
| `--bg-primary` | `#0A0A0A` | Page background |
| `--bg-elevated` | `#1E1E1E` | Cards, elevated surfaces |
| `--text-primary` | `#FFFFFF` | Headings, body text |
| `--text-secondary` | `#B0ACA5` | Paragraphs, descriptions |
| `--glass-bg` | `rgba(255,255,255,0.04)` | Glassmorphism cards |

### Components

- **Glass Card** — Backdrop blur + subtle border + hover glow
- **Buttons** — Primary (solid gold), Outline, Ghost variants
- **Badge** — Pill-shaped status indicators with pulse dot
- **Section Header** — Label + H2 + description pattern

## Development

Serve with any static file server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

## Accessibility

- Skip navigation link
- ARIA landmarks and labels
- `prefers-reduced-motion` respected (disables all animations)
- `<noscript>` fallback for JS-dependent features
- Semantic HTML5 headings hierarchy
- Focus-visible styles on interactive elements
- Color contrast meets WCAG AA guidelines

## Performance

- Lazy-loaded images (`loading="lazy"`), used inconsistently — audit before
  adding new imagery and prefer lazy unless it's above-the-fold hero content.
- `base.css` (shell/nav/footer) is the only render-blocking stylesheet; every
  other page-specific CSS file loads via `<link rel="preload" as="style" data-swap>`
  and is swapped to an active stylesheet by `js/css-preload-swap.js` once
  downloaded — non-render-blocking without a flash-of-unstyled-content, and
  CSP-safe (no inline `onload` handlers; see the comment header in that file).
- No 3D library (Three.js) in the current codebase — GSAP + vendored
  ScrollTrigger drive scroll animations, loaded on every route shell today
  (a remaining opportunity: gate per-route animation bundles the same way CSS
  is gated, since `animations-home.js`/`animations-subpages.js` currently load
  unconditionally regardless of the active route).

## SEO

- Semantic `<meta>` tags on every page.
- Open Graph tags for social sharing.
- JSON-LD structured data (Organization, FAQPage) — currently identical across
  all route shells (home page schema/title/description); route-specific
  JSON-LD/meta is a known gap, not yet fixed.
- Descriptive `<title>` and `alt` attributes.

## License

See [LICENSE](LICENSE).
