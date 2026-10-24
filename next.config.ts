import path from "node:path";
import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

// Content-Security-Policy and other security headers, applied to every
// response. Scoped to the exact external hosts this app actually calls:
// the environment's API (support live-status check) and self-hosted fonts/images
// (next/font self-hosts Google fonts at build time, so no fonts.googleapis
// .com / fonts.gstatic.com entries are needed, unlike the legacy static site).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiBase}`,
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
  // Keep non-production deployments out of search engines.
  ...(isProduction ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {},
  async headers() {
    return [
      {
        // Applied to every route.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
