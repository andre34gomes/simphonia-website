import { NextResponse } from "next/server";

// Android App Links configuration (assetlinks.json).
//
// IMPORTANT: `$(APP_SHA256_FINGERPRINT)` is a placeholder carried over
// verbatim from the previous static site — replace it with the real
// SHA-256 signing certificate fingerprint from Play Console (Setup ->
// App integrity -> App signing key certificate) before relying on
// Android App Links in production.
export function GET() {
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.simphonia.app",
          sha256_cert_fingerprints: ["$(APP_SHA256_FINGERPRINT)"],
        },
      },
    ],
    { headers: { "Content-Type": "application/json" } },
  );
}
