import { NextResponse } from "next/server";

// Served at https://arvann.in/.well-known/apple-app-site-association
// (no file extension — Apple fetches it directly over HTTPS, ignoring
// Content-Type, but we set application/json to be a well-behaved host).
// This is what makes tapping the password-reset email's link open the
// ARVANN app directly on iOS instead of Safari, once app.config.js's
// ios.associatedDomains matches and a native build with that config has
// been installed (TestFlight/App Store — this never works in Expo Go).
//
// APPLE_TEAM_ID must be set for this to declare a real app; until then it
// serves a valid, empty association (no app configured yet).
const IOS_BUNDLE_ID = "com.manufactureapp.frontend";

export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const appId = teamId ? `${teamId}.${IOS_BUNDLE_ID}` : null;

  const body = {
    applinks: {
      apps: [] as string[],
      details: appId
        ? [
            {
              appID: appId,
              paths: ["/reset-password", "/reset-password/*"],
            },
          ]
        : [],
    },
  };

  return NextResponse.json(body, {
    headers: { "Content-Type": "application/json" },
  });
}
