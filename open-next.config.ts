import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default in-memory cache is fine for this mostly-static marketing site
// (only 4 pages are dynamic, for user-agent based deep-link redirects —
// no ISR/ on-demand revalidation is used, so no R2/KV cache override is
// needed here). Kept as a minimal, explicit config for future tuning.
export default defineCloudflareConfig({});
