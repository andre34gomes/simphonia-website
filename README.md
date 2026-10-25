# Simphonia — Marketing Website

The public marketing site for [Simphonia](https://simphonia.pt), a global eSIM connectivity
app for travelers. Built with Next.js (App Router), TypeScript, Tailwind CSS v4, and shadcn/ui.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (Base UI variant)
- **QR codes:** generated server-side with the `qrcode` package (no third-party API dependency)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project Structure

```
src/
  app/                 Route segments (App Router) — one folder per page
    join/               Referral deep-link landing page
    open-in-app/        Generic "continue on mobile" deep-link page
  components/
    home/ about/ how-it-works/ support/ destinations/ download/
    legal/              Shared renderer for Privacy Policy / Terms of Service
    deeplink/           Shared components for the deep-link pages above
    layout/              Header, footer, nav
    ui/                 shadcn/ui primitives
  lib/                  Shared utilities (site config, QR generation, device/UA
                        sniffing)
  content/              Structured content (legal JSON, destinations data, etc.)
public/
  screenshots/          Live app screenshots (captured via ADB from a running
                        Flutter build — see "Screenshots" below)
```

## Screenshots

All in-app screenshots under `public/screenshots/` are **real captures** from the
Simphonia Flutter app running on an Android emulator (captured via `adb shell screencap`),
not stock imagery or mockups. If the app's UI changes, re-capture and replace these files
directly — file names are referenced by path throughout `src/components/`.

## Deep-link Pages

`/join` and `/open-in-app` are server-rendered pages
that back the app's universal/deep links. They read the request's `User-Agent` to decide
whether to auto-redirect (mobile) or show a QR code + store badges (desktop).
These routes carry referral data, not authentication tokens.

Account sign-in uses a single-use verification code sent by email, or a linked
social provider. The code is entered directly in the app.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build locally
npm run lint     # eslint
```

## Deployment

This site deploys to **Vercel** (native Next.js hosting) straight from GitHub; there is no deploy script.

Two Vercel projects (Hobby-plan friendly, full isolation), both linked to this repo:

| Environment | Vercel project | Production Branch | Domain |
|-------------|----------------|-------------------|--------|
| Simphonia TEST (mirror of prod) | `simphonia-test` | `develop` | `test.simphonia.pt` |
| Simphonia PROD | `simphonia-prod` | `main` | `simphonia.pt` (`www` → 308 to apex) |

Each project builds only its own branch (Settings > Git > Ignored Build Step: `[ "$VERCEL_GIT_COMMIT_REF" = "<branch>" ] && exit 1 || exit 0`), and its **Production** environment holds that environment's values. DNS in Cloudflare (DNS only, not proxied): apex `A 216.198.79.1` + `A 64.29.17.1`, `www` and `test` `CNAME <project-specific>.vercel-dns-017.com` (values shown in Vercel > Domains). `simphonia-test` uses Vercel Authentication on all deployments (including `test.simphonia.pt`), so only team members can open it.

Set these variables in Vercel (Settings > Environment Variables), per environment (`NEXT_PUBLIC_*` is inlined at build time):

| Variable | `simphonia-test` | `simphonia-prod` |
|----------|---------|------------|
| `NEXT_PUBLIC_APP_ENV` | `staging` | `production` |
| `NEXT_PUBLIC_API_BASE` | `https://api-test.simphonia.pt` | `https://api.simphonia.pt` |
| `NEXT_PUBLIC_SITE_URL` | `https://test.simphonia.pt` | `https://simphonia.pt` |

They are read in `src/lib/env.ts`; staging/production builds fail if a URL is missing, so a deployed site can never silently fall back to another backend. Staging serves `X-Robots-Tag: noindex` and a disallow-all `robots.txt`. For local dev copy `.env.example` to `.env` (the only local env file).

### Security headers, robots & sitemap

`next.config.ts` sets a Content-Security-Policy and standard security headers (X-Frame-Options,
HSTS, Referrer-Policy, Permissions-Policy, COOP) on every route. `src/app/robots.ts` and
`src/app/sitemap.ts` generate `/robots.txt` and `/sitemap.xml` — the deep-link pages are
excluded from both (they're single-use functional redirects, already `noindex` via page metadata).

### Production readiness and indexing

See [`docs/INDEXING.md`](docs/INDEXING.md) for the verified production host, canonical and
crawler behavior, and the remaining Google Search Console submission steps.

### ⚠️ Universal Links / App Links — needs real values before going live

`src/app/.well-known/apple-app-site-association/route.ts` and
`src/app/.well-known/assetlinks.json/route.ts` carry over **unresolved placeholders** from the
previous site (`$(APPLE_TEAM_ID)` and `$(APP_SHA256_FINGERPRINT)`) — no substitution mechanism
was found in the old repo either, so these may never have been live. Replace them with:

- **`$(APPLE_TEAM_ID)`** — your 10-character Apple Developer Team ID (App Store Connect → Membership).
- **`$(APP_SHA256_FINGERPRINT)`** — your app's SHA-256 signing certificate fingerprint
  (Play Console → Setup → App integrity → App signing key certificate).

Until these are set, iOS Universal Links and Android App Links to `/join`
will not open the app directly (the pages still work standalone as
web fallbacks with QR codes / store badges).

### ⚠️ Known gap: no i18n (previous site had 21 languages)

The previous static site shipped translations for 21 locales (`js/i18n/*.json`: ar, cs, de, en,
es, fa, fr, hi, hu, id, it, ja, ko, nl, pl, pt, ru, tr, uk, vi, zh). This rebuild is **English-only**.
Re-adding full i18n (e.g. via `next-intl`) is a substantial follow-up project — translating 12
pages into 20 additional languages — and was intentionally left out of this rebuild rather than
attempted with unreviewed machine translations. Flagging here as a deliberate scope decision for
follow-up, not an oversight.
