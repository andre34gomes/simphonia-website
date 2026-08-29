import type { Metadata } from "next";
import { headers } from "next/headers";
import { Gift } from "lucide-react";
import { DeeplinkShell } from "@/components/deeplink/deeplink-shell";
import { DeeplinkQrCode } from "@/components/deeplink/deeplink-qr-code";
import { JoinMobileRedirect } from "@/components/deeplink/join-mobile-redirect";
import { StoreBadges } from "@/components/shared/store-badges";
import { isIOSUserAgent, isMobileUserAgent } from "@/lib/device";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Join Simphonia",
  description:
    "A friend shared their referral code with you. Download the Simphonia app and the discount will be applied automatically at checkout.",
  robots: { index: false, follow: true },
};

// Matches the previous site's referral-code validation exactly.
const REFERRAL_CODE_PATTERN = /^[a-zA-Z0-9_-]{1,32}$/;

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const params = await searchParams;
  const rawCode = typeof params.code === "string" ? params.code : undefined;
  const code =
    rawCode && REFERRAL_CODE_PATTERN.test(rawCode) ? rawCode : undefined;

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  const isMobile = isMobileUserAgent(userAgent);
  const isIOS = isIOSUserAgent(userAgent);

  return (
    <DeeplinkShell
      icon={<Gift />}
      eyebrow="Referral Invitation"
      title="You've Been Invited!"
      subtitle="A friend shared their referral code with you. Download the Simphonia app and the discount will be applied automatically at checkout."
    >
      {code ? (
        <>
          <div className="mt-6 inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 font-mono text-sm text-foreground">
            {code}
          </div>
          {isMobile ? (
            <JoinMobileRedirect code={code} isIOS={isIOS} />
          ) : (
            <>
              <DeeplinkQrCode
                data={`${SITE_URL}/join?code=${encodeURIComponent(code)}`}
                label="Scan with your phone camera to open in the app"
                size={160}
              />
              <div className="mt-8">
                <StoreBadges />
              </div>
            </>
          )}
        </>
      ) : null}
    </DeeplinkShell>
  );
}
