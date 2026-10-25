import { SITE_URL } from "@/lib/site";

/**
 * Builds an absolute canonical URL from a site-relative route.
 */
export function canonicalUrl(path: `/${string}`): string {
  return new URL(path, SITE_URL).toString();
}
