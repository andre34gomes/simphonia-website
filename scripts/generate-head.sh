#!/bin/bash
# ──────────────────────────────────────────────────────────
# Simphonia Website — HTML Head Partial Generator
#
# Generates the shared <head> boilerplate that's duplicated
# across all 14 HTML pages. Run this script to output the
# common meta tags, favicon links, font preconnects, and
# theme-init script.
#
# Usage:
#   ./scripts/generate-head.sh "Page Title" "Page description" "/page-path/" "../"
#
# Arguments:
#   $1 — Page title (e.g. "About — Simphonia eSIM")
#   $2 — Meta description
#   $3 — Canonical path (e.g. "/about/")
#   $4 — Asset prefix (e.g. "../" for subpages, "" for root)
# ──────────────────────────────────────────────────────────

TITLE="${1:-Simphonia}"
DESC="${2:-Instant eSIM activation for 200+ countries.}"
PATH_SLUG="${3:-/}"
PREFIX="${4:-}"

CANONICAL="https://simphonia.pt${PATH_SLUG}"

cat <<EOF
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
  <title>${TITLE}</title>
  <meta name="description" content="${DESC}">
  <meta name="theme-color" content="#121212">
  <link rel="canonical" href="${CANONICAL}">
  <meta property="og:title" content="${TITLE}">
  <meta property="og:description" content="${DESC}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${CANONICAL}">
  <meta property="og:image" content="https://simphonia.pt/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${TITLE}">
  <meta name="twitter:description" content="${DESC}">
  <meta name="twitter:image" content="https://simphonia.pt/assets/og-image.png">
  <link rel="icon" type="image/svg+xml" href="${PREFIX}assets/favicon.svg">
  <link rel="shortcut icon" href="${PREFIX}assets/favicon.svg">
  <link rel="mask-icon" href="${PREFIX}assets/favicon.svg" color="#D4AF37">
  <link rel="manifest" href="/manifest.json">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Simphonia">
  <script src="${PREFIX}js/theme-init.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Pacifico&display=swap" rel="stylesheet">
EOF

