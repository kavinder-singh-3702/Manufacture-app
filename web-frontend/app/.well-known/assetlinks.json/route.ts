import { NextResponse } from "next/server";

// Served at https://arvann.in/.well-known/assetlinks.json
// This is what makes tapping the password-reset email's link open the
// ARVANN app directly on Android instead of a browser, once
// app.config.js's android.intentFilters (autoVerify) matches and a native
// build with that config has been installed.
//
// ANDROID_CERT_SHA256 must be set (the release signing certificate's
// SHA-256 fingerprint) for this to declare a real app; until then it
// serves a valid, empty list (no app configured yet).
const ANDROID_PACKAGE = "com.manufactureapp.frontend";

export async function GET() {
  const fingerprint = process.env.ANDROID_CERT_SHA256?.trim();

  const body = fingerprint
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: ANDROID_PACKAGE,
            sha256_cert_fingerprints: [fingerprint],
          },
        },
      ]
    : [];

  return NextResponse.json(body, {
    headers: { "Content-Type": "application/json" },
  });
}
