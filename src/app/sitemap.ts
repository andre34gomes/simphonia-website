import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Generates /sitemap.xml. Only content pages are listed — the four
// deep-link/action pages (/join, /open-in-app, /reset-password,
// /verify-email) are single-use functional redirects marked noindex via
// their own metadata, so they're deliberately excluded here too.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
    { path: "", changeFrequency: "weekly", priority: 1.0 },
    { path: "destinations", changeFrequency: "weekly", priority: 0.9 },
    { path: "how-it-works", changeFrequency: "monthly", priority: 0.8 },
    { path: "download", changeFrequency: "monthly", priority: 0.8 },
    { path: "support", changeFrequency: "monthly", priority: 0.7 },
    { path: "about", changeFrequency: "monthly", priority: 0.6 },
    { path: "privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path ? `/${path}` : ""}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
