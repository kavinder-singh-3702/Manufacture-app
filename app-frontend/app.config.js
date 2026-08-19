const DEV_BUNDLE_IDENTIFIER = "com.manufactureapp.frontend.dev";
const PROD_BUNDLE_IDENTIFIER = "com.manufactureapp.frontend";

function resolveVariant() {
  const variant = process.env.APP_VARIANT?.trim().toLowerCase();
  return variant === "prod" ? "prod" : "dev";
}

module.exports = ({ config }) => {
  const appVariant = resolveVariant();
  const isProd = appVariant === "prod";

  return {
    ...config,
    name: "ARVANN",
    slug: "arvann",
    version: "1.0.1",
    // "default" lets iPhone use its natural device orientation (usually
    // portrait on rotate-locked devices) and lets iPad rotate freely
    // between portrait and landscape. iPad users expect rotation; locking
    // it caused a scroll bug where iOS rotated the app anyway (because
    // supportsTablet + no UIRequiresFullScreen) but our screens still
    // assumed portrait dimensions.
    orientation: "default",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    // Custom-scheme fallback only (e.g. deep links from other apps/QR codes).
    // The password-reset email link uses universal/app links below, which
    // open directly in-app without the scheme-confirmation prompt browsers
    // show for arvann:// URLs.
    scheme: "arvann",
    icon: "./assets/brand/arvann-icon-new.png",
    splash: {
      backgroundColor: "#000000",
      image: "./assets/brand/arvann-icon-new.png",
      resizeMode: "contain",
    },
    ios: {
      supportsTablet: true,
      // 1.0.0 was APPROVED on the App Store, which seals it permanently —
      // Apple rejects any further upload carrying an approved marketing
      // version (error 90062), so every release from here bumps `version`.
      // Build numbers only need to be unique within a version; a new
      // version restarts at 1.
      buildNumber: "1",
      bundleIdentifier: isProd ? PROD_BUNDLE_IDENTIFIER : DEV_BUNDLE_IDENTIFIER,
      usesAppleSignIn: true,
      // Requires apple-app-site-association to be served from
      // https://arvann.in/.well-known/ (web-frontend, not the API host —
      // see web-frontend/app/.well-known/). Only takes effect after a
      // native rebuild + TestFlight/store install; does not work in Expo Go.
      associatedDomains: isProd ? ["applinks:arvann.in"] : [],
      infoPlist: {
        ...(isProd
          ? {}
          : {
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
                NSAllowsLocalNetworking: true,
              },
            }),
        NSLocalNetworkUsageDescription:
          "ARVANN needs local network access to connect to the development server.",
        NSBonjourServices: ["_http._tcp"],
        // Apple rejects if the description doesn't match every real use.
        // Camera is invoked from three surfaces: product listings, chat
        // image attachments, and business-verification document capture.
        NSCameraUsageDescription:
          "ARVANN uses your camera to take photos for product listings, chat messages, and business-verification documents.",
        NSPhotoLibraryUsageDescription:
          "ARVANN needs photo library access so you can upload product images, chat attachments, and verification documents.",
      },
    },
    android: {
      package: isProd ? "com.manufactureapp.frontend" : "com.manufactureapp.frontend.dev",
      // Play refuses duplicate versionCodes; 3 is already on the closed
      // track, and local Gradle builds do NOT auto-increment (eas.json's
      // autoIncrement only applies to EAS builds). Bump before each upload.
      versionCode: 4,
      usesCleartextTraffic: !isProd,
      softwareKeyboardLayoutMode: "adjustResize",
      adaptiveIcon: {
        foregroundImage: "./assets/brand/arvann-icon-new.png",
        backgroundColor: "#000000",
      },
      permissions: [
        "INTERNET",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS",
      ],
      // Scoped to /reset-password only — an unscoped filter would hijack
      // every arvann.in link into the app instead of just the reset flow.
      // autoVerify requires assetlinks.json served from
      // https://arvann.in/.well-known/ (see web-frontend/app/.well-known/)
      // and only takes effect after a native rebuild + reinstall.
      intentFilters: isProd
        ? [
            {
              action: "VIEW",
              autoVerify: true,
              data: [
                {
                  scheme: "https",
                  host: "arvann.in",
                  pathPrefix: "/reset-password",
                },
              ],
              category: ["BROWSABLE", "DEFAULT"],
            },
          ]
        : [],
    },
    web: {
      bundler: "metro",
    },
    extra: {
      eas: {
        projectId: "de0a7eeb-a054-4057-a4c0-f60640b32765",
      },
      appVariant,
      iosBundleIdentifierProd: PROD_BUNDLE_IDENTIFIER,
      iosBundleIdentifierDev: DEV_BUNDLE_IDENTIFIER,
    },
    plugins: [
      "expo-secure-store",
      "expo-apple-authentication",
      "@react-native-community/datetimepicker",
      [
        "expo-notifications",
        {
          icon: "./assets/brand/arvann-icon-1024.png",
          color: "#4F46E5",
          defaultChannel: "default",
        },
      ],
      "./plugins/withArvannAndroidReleaseSigning",
      "expo-video",
      "expo-web-browser",
    ],
  };
};
