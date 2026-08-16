import { NextResponse } from "next/server";

// iOS Universal Links configuration (apple-app-site-association).
//
// IMPORTANT: `$(APPLE_TEAM_ID)` is a placeholder carried over verbatim from
// the previous static site — it was never substituted there either (no
// build step/template engine existed to do so). Replace it with the real
// 10-character Apple Developer Team ID (App Store Connect -> Membership)
// before relying on Universal Links in production.
export function GET() {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: "$(APPLE_TEAM_ID).com.simphonia.app",
            paths: [
              "/join",
              "/join?*",
              "/verify-email",
              "/verify-email?*",
              "/reset-password",
              "/reset-password?*",
            ],
          },
        ],
      },
    },
    { headers: { "Content-Type": "application/json" } },
  );
}
