# Production hosting and Google indexing

## Hosting decision

The public website is the Next.js marketing site and its canonical production host remains
`https://simphonia.pt`. The Simphonia application is a native Flutter app; creating an
`app.simphonia.pt` alias would not host that app and could create a second indexable copy of
the marketing site. The backend already uses `api.simphonia.pt`, and the test site and API
use `test.simphonia.pt` and `api-test.simphonia.pt`.

The Vercel account currently has the production and test domains attached to their respective
projects and marked verified. Cloudflare is authoritative for `simphonia.pt`. At audit time:

| Host | DNS record | Current destination | Purpose |
| --- | --- | --- | --- |
| `@` | A | `64.29.17.1`, `216.198.79.1` | Production website |
| `www` | CNAME | `cf9e6f89eb35ddc4.vercel-dns-017.com` | Vercel; 308 redirect to apex |
| `test` | CNAME | `00837e9ec737788d.vercel-dns-017.com` | Protected test website |
| `api` | CNAME | `d77ed81e23e8150e.vercel-dns-017.com` | Production API |
| `api-test` | CNAME | `e413c015b1634958.vercel-dns-017.com` | Test API |

These are the observed records, not a request to replace them. Vercel reports the domains
verified and not misconfigured, but also reports `ipStatus: required-change` and recommends
`76.76.21.21` for the apex. Do not change the apex records without first reconciling that
advisory with the active Vercel project's Domains page; the existing production site resolves
and serves HTTPS. No `app` DNS record or project domain currently exists, and none is needed
for the native app.

## Crawl and canonical behavior

The production site publishes `/robots.txt` and `/sitemap.xml`. The sitemap contains only
the eight public marketing/legal routes, uses the environment-specific `NEXT_PUBLIC_SITE_URL`,
and excludes `/join` and `/open-in-app`. Those two routes are functional deep-link pages and
carry `noindex`; they are also disallowed in `robots.txt`. Staging uses a disallow-all robots
policy and `X-Robots-Tag: noindex, nofollow`.

Page-level canonical URLs now use `SITE_URL`; the homepage, public content pages, and the two
noindex deep-link routes have route-specific canonical tags. The Open Graph and Twitter image
metadata points to the existing `/icon-512.png` asset (the previously configured `/og-image.png`
did not exist in `public/`).

At audit time, the deployed homepage, `/robots.txt`, and `/sitemap.xml` returned HTTPS 200;
`www.simphonia.pt` redirected to the apex. The live sitemap had eight HTTPS entries. The
apex already has a `google-site-verification` TXT record. This proves a DNS verification token
is published, but does not prove Search Console access, property verification completion, or
indexing.

The deployed homepage did not yet emit a canonical tag and still referenced the missing
`/og-image.png`; the repository changes above correct both on the next website deployment.
The live `robots.txt` also contains legacy disallows for `/reset-password` and `/verify-email`
that are not in the current source or sitemap. No such public website pages were found; review
the source/output difference on the next deployment.

## Manual Search Console steps

1. Sign in to Google Search Console using the account that owns the `simphonia.pt` property.
   If it is not already verified, use the existing DNS TXT token rather than adding a second
   verification record.
2. Confirm the Domain property covers both `simphonia.pt` and its subdomains. If using a URL
   prefix property instead, verify `https://simphonia.pt/`.
3. Submit `https://simphonia.pt/sitemap.xml` under **Sitemaps** and confirm Google reports it
   fetched successfully.
4. Use **URL Inspection** for the homepage and key public pages (`/destinations`,
   `/how-it-works`, `/download`, `/support`, `/about`) to request indexing if appropriate.
5. Monitor indexing and crawl errors. Submission and successful fetch are not guarantees that
   Google will index a URL.

Search Console is not connected to the repository session, so submission and indexing status
remain unverified.

## Remaining production checks

- Vercel currently marks test domains verified, but the test project is documented as protected
  by Vercel Authentication. Keep it out of public indexing.
- The connected Vercel account is on Hobby. The backend deployment guide says Hobby is
  non-commercial; confirm the plan is appropriate or upgrade before commercial production use.
- Cloudflare DNS access was available and the zone is active, but no registrar account or
  Google Search Console integration was connected to this session.
- At audit time, `https://api.simphonia.pt/q/health/ready` returned HTTP 404 even though the
  Quarkus source configures `/q/health`. Vercel showed the only production-target deployment
  for `simphonia-api-prod` as canceled because the ignored-build-step branch filter returned
  exit code 0 for a Dependabot branch; `api-test` has a ready deployment. Confirm or trigger a
  successful production-branch deployment. The same health path on `api-test` also returned
  HTTP 404 (`GEN011`), so verify the health route on both environments before treating API
  readiness as verified.
- Preserve the existing apex, `www`, mail, and MX records. No DNS changes were made.
