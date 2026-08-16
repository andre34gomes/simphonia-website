import { Button } from "@/components/ui/button";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/data/nav";

interface DeeplinkStoreCtaProps {
  store: "apple" | "google";
  label: string;
}

/**
 * Single OS-matched download button used as the mobile fallback on the
 * join, reset-password, and verify-email pages. The previous site
 * hardcoded this fallback to the Google Play link regardless of the
 * visitor's device; here `store` is chosen server-side from the request's
 * user agent so iOS visitors are correctly sent to the App Store.
 */
export function DeeplinkStoreCta({ store, label }: DeeplinkStoreCtaProps) {
  const href = store === "apple" ? APP_STORE_URL : PLAY_STORE_URL;

  return (
    <Button
      size="lg"
      className="h-12 px-6 text-base"
      render={<a href={href} target="_blank" rel="noopener noreferrer" />}
      nativeButton={false}
    >
      {label}
    </Button>
  );
}
