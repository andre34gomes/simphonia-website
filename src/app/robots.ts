import type { MetadataRoute } from "next";
import { IS_PRODUCTION } from "@/lib/env";
import { SITE_URL } from "@/lib/site";

// Generates /robots.txt at build/request time. Mirrors the crawl rules from
// the legacy static site: allow everything except deep-link/action pages
// (already noindex via per-page metadata) and block AI-training crawlers
// that don't respect content rights. Non-production deployments (the test
// mirror) are closed to all crawlers.
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/join", "/open-in-app"],
      },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Google-Extended", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
