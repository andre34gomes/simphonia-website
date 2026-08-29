import type { Metadata } from "next";
import { headers } from "next/headers";
import { Mail } from "lucide-react";
import { DeeplinkShell } from "@/components/deeplink/deeplink-shell";
import { TokenPageContent } from "@/components/deeplink/token-page-content";
import { StripTokenFromUrl } from "@/components/deeplink/strip-token-from-url";
import { isIOSUserAgent, isMobileUserAgent } from "@/lib/device";
import { isTrustedProductionHost } from "@/lib/trusted-host";

export const metadata: Metadata = {
  title: "Email Verification",
  description:
    "For your security, open a new email-verification link on the mobile device where Simphonia is installed.",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const params = await searchParams;
  const hasToken = typeof params.token === "string" && params.token.length > 0;

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  const trusted = isTrustedProductionHost(headersList.get("host"));
  const isMobile = isMobileUserAgent(userAgent);
  const isIOS = isIOSUserAgent(userAgent);

  return (
    <DeeplinkShell icon={<Mail />} eyebrow="Account Security" title="Email Verification">
      {trusted && hasToken ? (
        <StripTokenFromUrl path="/verify-email" />
      ) : null}
      <TokenPageContent
        kind="verify-email"
        trusted={trusted}
        isMobile={isMobile}
        isIOS={isIOS}
      />
    </DeeplinkShell>
  );
}
