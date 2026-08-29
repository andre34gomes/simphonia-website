import type { Metadata } from "next";
import { headers } from "next/headers";
import { Lock } from "lucide-react";
import { DeeplinkShell } from "@/components/deeplink/deeplink-shell";
import { TokenPageContent } from "@/components/deeplink/token-page-content";
import { StripTokenFromUrl } from "@/components/deeplink/strip-token-from-url";
import { isIOSUserAgent, isMobileUserAgent } from "@/lib/device";
import { isTrustedProductionHost } from "@/lib/trusted-host";

export const metadata: Metadata = {
  title: "Password Reset",
  description:
    "For your security, open a new password-reset link on the mobile device where Simphonia is installed.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams;
  const hasToken = typeof params.token === "string" && params.token.length > 0;

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  const trusted = isTrustedProductionHost(headersList.get("host"));
  const isMobile = isMobileUserAgent(userAgent);
  const isIOS = isIOSUserAgent(userAgent);

  return (
    <DeeplinkShell icon={<Lock />} eyebrow="Account Security" title="Password Reset">
      {trusted && hasToken ? (
        <StripTokenFromUrl path="/reset-password" />
      ) : null}
      <TokenPageContent
        kind="reset-password"
        trusted={trusted}
        isMobile={isMobile}
        isIOS={isIOS}
      />
    </DeeplinkShell>
  );
}
