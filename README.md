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
    reset-password/     Password-reset deep-link page (host-gated)
    verify-email/       Email-verification deep-link page (host-gated)
  components/
    home/ about/ how-it-works/ support/ destinations/ download/
    legal/              Shared renderer for Privacy Policy / Terms of Service
    deeplink/           Shared components for the 4 deep-link pages above
    layout/              Header, footer, nav
    ui/                 shadcn/ui primitives
  lib/                  Shared utilities (site config, QR generation, device/UA
                        sniffing, trusted-host check)
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

`/join`, `/open-in-app`, `/reset-password`, and `/verify-email` are server-rendered pages
that back the app's universal/deep links. They read the request's `User-Agent` to decide
whether to auto-redirect (mobile) or show a QR code + store badges (desktop), and
`reset-password`/`verify-email` additionally gate rendering behind a trusted-hostname check
(see `src/lib/trusted-host.ts`) so a sensitive one-time token is only ever acted on on the
production domain.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build locally
npm run lint     # eslint
```

## Deployment

This site is configured for **Cloudflare Workers** (via the `@opennextjs/cloudflare` adapter),
matching the hosting platform already used in production. It's still a standard Next.js app
otherwise, so it can also be deployed to any Next.js-compatible host (Vercel, Node server, etc.)
with `npm run build && npm run start` if that ever changes.

```bash
npm run build-open   # builds + bundles into .open-next/ (verify locally, no Cloudflare login needed)
npm run preview      # build-open, then serve it locally via the Workers runtime (wrangler dev)
npm run deploy       # build-open, then deploy to Cloudflare (requires `wrangler login` first)
```

Config lives in `wrangler.jsonc` (Worker name, compatibility flags, static-assets binding) and
`open-next.config.ts` (adapter options — currently defaults, no custom incremental cache).

### Security headers, robots & sitemap

`next.config.ts` sets a Content-Security-Policy and standard security headers (X-Frame-Options,
HSTS, Referrer-Policy, Permissions-Policy, COOP) on every route, plus `Cache-Control: no-store`
on `/reset-password` and `/verify-email` (bearer-token pages). `src/app/robots.ts` and
`src/app/sitemap.ts` generate `/robots.txt` and `/sitemap.xml` — the 4 deep-link pages are
excluded from both (they're single-use functional redirects, already `noindex` via page metadata).

### ⚠️ Universal Links / App Links — needs real values before going live

`src/app/.well-known/apple-app-site-association/route.ts` and
`src/app/.well-known/assetlinks.json/route.ts` carry over **unresolved placeholders** from the
previous site (`$(APPLE_TEAM_ID)` and `$(APP_SHA256_FINGERPRINT)`) — no substitution mechanism
was found in the old repo either, so these may never have been live. Replace them with:

- **`$(APPLE_TEAM_ID)`** — your 10-character Apple Developer Team ID (App Store Connect → Membership).
- **`$(APP_SHA256_FINGERPRINT)`** — your app's SHA-256 signing certificate fingerprint
  (Play Console → Setup → App integrity → App signing key certificate).

Until these are set, iOS Universal Links and Android App Links to `/join`, `/reset-password`,
and `/verify-email` will not open the app directly (the pages still work standalone as
web fallbacks with QR codes / store badges).

### ⚠️ Known gap: no i18n (previous site had 21 languages)

The previous static site shipped translations for 21 locales (`js/i18n/*.json`: ar, cs, de, en,
es, fa, fr, hi, hu, id, it, ja, ko, nl, pl, pt, ru, tr, uk, vi, zh). This rebuild is **English-only**.
Re-adding full i18n (e.g. via `next-intl`) is a substantial follow-up project — translating 12
pages into 20 additional languages — and was intentionally left out of this rebuild rather than
attempted with unreviewed machine translations. Flagging here as a deliberate scope decision for
follow-up, not an oversight.
