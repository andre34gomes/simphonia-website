import { SITE_URL } from "@/lib/site";

// The reset-password and verify-email pages carry a sensitive one-time
// token in the URL. The previous site only ever ran its unlock logic in
// the browser, checking `window.location` against a hardcoded
// `TRUSTED_HOSTS` allowlist before revealing any action — this is the
// same check, ported to run against the request's `host` header during
// SSR so it can't be bypassed by client-side script and renders
// correctly on first paint instead of flashing a loading state.
const TRUSTED_HOSTNAME = new URL(SITE_URL).hostname;

export function isTrustedProductionHost(host: string | null): boolean {
  if (!host) return false;
  // Strip a port if present (e.g. "simphonia.pt:443").
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === TRUSTED_HOSTNAME;
}
