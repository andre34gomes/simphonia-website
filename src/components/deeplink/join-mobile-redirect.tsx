"use client";

import { useEffect, useState } from "react";
import { DeeplinkStoreCta } from "@/components/deeplink/deeplink-store-cta";

interface JoinMobileRedirectProps {
  code: string;
  isIOS: boolean;
}

/**
 * Attempts to open the Simphonia app via its custom URL scheme on
 * mobile, then reveals a store-download fallback if the OS didn't
 * intercept it (e.g. the app isn't installed). A referral code isn't a
 * sensitive credential, so a custom-scheme redirect attempt is safe here
 * — unlike the token-bearing reset-password/verify-email pages, which
 * never use one.
 */
export function JoinMobileRedirect({ code, isIOS }: JoinMobileRedirectProps) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    window.location.href = `simphonia://app/join?code=${encodeURIComponent(code)}`;
    const timer = window.setTimeout(() => setShowFallback(true), 1500);
    return () => window.clearTimeout(timer);
  }, [code]);

  if (!showFallback) {
    return (
      <p className="mt-10 text-sm text-muted-foreground">
        Opening the Simphonia app…
      </p>
    );
  }

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Download Simphonia to claim your discount:
      </p>
      <DeeplinkStoreCta
        store={isIOS ? "apple" : "google"}
        label={isIOS ? "Download on App Store" : "Get it on Google Play"}
      />
    </div>
  );
}
