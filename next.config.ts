import path from "node:path";
import type { NextConfig } from "next";

// Content-Security-Policy and other security headers, applied to every
// response. Scoped to the exact external hosts this app actually calls:
// api.simphonia.pt (support live-status check) and self-hosted fonts/images
// (next/font self-hosts Google fonts at build time, so no fonts.googleapis
// .com / fonts.gstatic.com entries are needed, unlike the legacy static site).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.simphonia.pt",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        // Applied to every route.
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Deep-link pages carry short-lived bearer tokens in the query
        // string — never let a browser or CDN edge cache these responses.
        source: "/(reset-password|verify-email)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
