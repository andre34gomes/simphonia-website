"use client";

import { useEffect } from "react";

/**
 * Removes a sensitive one-time token from the visible URL (address bar,
 * browser history, referrer headers on any outgoing links) once the page
 * has rendered, without triggering a navigation or reload. Only rendered
 * for trusted-host requests that actually carry a token — see
 * `token-page-content.tsx`.
 */
export function StripTokenFromUrl({ path }: { path: string }) {
  useEffect(() => {
    window.history.replaceState(null, "", path);
  }, [path]);

  return null;
}
