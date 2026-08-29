// Server-side user-agent sniffing for the deep-link pages (join,
// open-in-app, reset-password, verify-email). Ported from the previous
// site's `deeplink-page.js`, but evaluated against the request's
// `user-agent` header during SSR instead of `navigator.userAgent` in the
// browser — this removes the loading-spinner flash the old static-JS
// version had while it waited to detect the device client-side.
const MOBILE_PATTERN = /android|iphone|ipad|ipod/i;
const IOS_PATTERN = /iphone|ipad|ipod/i;

export function isMobileUserAgent(userAgent: string): boolean {
  return MOBILE_PATTERN.test(userAgent);
}

export function isIOSUserAgent(userAgent: string): boolean {
  return IOS_PATTERN.test(userAgent);
}
