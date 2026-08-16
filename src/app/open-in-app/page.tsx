import type { Metadata } from "next";
import { Smartphone } from "lucide-react";
import { DeeplinkShell } from "@/components/deeplink/deeplink-shell";
import { DeeplinkQrCode } from "@/components/deeplink/deeplink-qr-code";
import { StoreBadges } from "@/components/shared/store-badges";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Open This Link on Your Phone",
  description:
    "This action needs to be completed in the Simphonia mobile app. Scan the QR code below with your phone, or download the app from the store.",
  robots: { index: false, follow: false },
};

const ACTION_LABELS: Record<string, string> = {
  "verify-email": "Email Verification",
  "reset-password": "Password Reset",
  join: "Referral Invitation",
};

const CONTINUE_STEPS = [
  "Download Simphonia on your phone",
  "Scan the QR code above with your camera",
  "The app will handle the action automatically",
];

/**
 * Rebuilds the deep-link URL a mobile visitor should scan to continue,
 * from the `action` (+ optional `code`/`token`) query params. Mirrors
 * the previous site's `getOpenInAppDeepLink`.
 */
function getDeepLink(
  action: string | undefined,
  code: string | undefined,
  token: string | undefined
) {
  if (action === "join" && code) {
    return `${SITE_URL}/join?code=${encodeURIComponent(code)}`;
  }
  if (action === "verify-email") {
    return token
      ? `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`
      : `${SITE_URL}/verify-email`;
  }
  if (action === "reset-password") {
    return token
      ? `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`
      : `${SITE_URL}/reset-password`;
  }
  return SITE_URL;
}

export default async function OpenInAppPage({
  searchParams,
}: PageProps<"/open-in-app">) {
  const params = await searchParams;
  const action = typeof params.action === "string" ? params.action : undefined;
  const code = typeof params.code === "string" ? params.code : undefined;
  const token = typeof params.token === "string" ? params.token : undefined;
  const actionLabel = action ? ACTION_LABELS[action] : undefined;

  return (
    <DeeplinkShell
      icon={<Smartphone />}
      eyebrow="Continue on Mobile"
      title="Open This Link on Your Phone"
      subtitle="This action needs to be completed in the Simphonia mobile app. Scan the QR code below with your phone, or download the app from the store."
    >
      {actionLabel ? (
        <div className="mt-6 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          {actionLabel}
        </div>
      ) : null}

      <DeeplinkQrCode
        data={getDeepLink(action, code, token)}
        label="Scan with your phone camera to continue"
        size={180}
      />

      <div className="mt-8">
        <StoreBadges />
      </div>

      <div className="mt-12 w-full max-w-sm text-left">
        <h2 className="text-sm font-semibold text-foreground">
          How to continue
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground marker:text-primary">
          {CONTINUE_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </DeeplinkShell>
  );
}
