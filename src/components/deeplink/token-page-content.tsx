import { Spinner } from "@/components/ui/spinner";
import { StoreBadges } from "@/components/shared/store-badges";
import { DeeplinkStoreCta } from "@/components/deeplink/deeplink-store-cta";

type TokenPageKind = "reset-password" | "verify-email";

interface TokenPageContentProps {
  kind: TokenPageKind;
  trusted: boolean;
  isMobile: boolean;
  isIOS: boolean;
}

const ACTION_LABEL: Record<TokenPageKind, string> = {
  "reset-password": "password-reset",
  "verify-email": "email-verification",
};

/**
 * Shared body for the reset-password and verify-email pages. Both routes
 * carry a sensitive one-time token and only reveal their action once the
 * request's `host` header matches the trusted production domain — see
 * `isTrustedProductionHost`. On an untrusted host (e.g. a phishing
 * mirror), this permanently shows a processing spinner instead of the
 * real download CTA, matching the previous site's behavior but now as an
 * intentional server-computed branch rather than a JS-timing artifact.
 */
export function TokenPageContent({
  kind,
  trusted,
  isMobile,
  isIOS,
}: TokenPageContentProps) {
  const actionLabel = ACTION_LABEL[kind];

  if (!trusted) {
    return (
      <div className="mt-6 flex flex-col items-center gap-5">
        <p className="max-w-md text-lg text-pretty text-muted-foreground">
          Processing your secure {actionLabel} link...
        </p>
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-6">
      <p className="max-w-md text-lg text-pretty text-muted-foreground">
        For your security, open a new {actionLabel} link on the mobile
        device where Simphonia is installed.
      </p>
      {isMobile ? (
        <DeeplinkStoreCta
          store={isIOS ? "apple" : "google"}
          label="Download Simphonia"
        />
      ) : (
        <StoreBadges />
      )}
    </div>
  );
}
