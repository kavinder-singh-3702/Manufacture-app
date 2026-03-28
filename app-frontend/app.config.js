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
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    icon: "./assets/brand/arvann-icon-1024.png",
    splash: {
      backgroundColor: "#000000",
      image: "./assets/brand/arvann-splash-logo.png",
      resizeMode: "contain",
    },
    ios: {
      supportsTablet: true,
      buildNumber: "1",
      bundleIdentifier: isProd ? PROD_BUNDLE_IDENTIFIER : DEV_BUNDLE_IDENTIFIER,
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
        NSCameraUsageDescription: "ARVANN needs camera access to take product photos.",
        NSPhotoLibraryUsageDescription: "ARVANN needs photo library access to upload product images.",
      },
    },
    android: {
      package: isProd ? "com.manufactureapp.frontend" : "com.manufactureapp.frontend.dev",
      versionCode: 2,
      usesCleartextTraffic: !isProd,
      softwareKeyboardLayoutMode: "adjustResize",
      adaptiveIcon: {
        foregroundImage: "./assets/brand/arvann-icon-1024.png",
        backgroundColor: "#454545",
      },
      permissions: [
        "INTERNET",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS",
      ],
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
      [
        "expo-notifications",
        {
          icon: "./assets/brand/arvann-icon-1024.png",
          color: "#4F46E5",
          defaultChannel: "default",
        },
      ],
      "expo-video",
    ],
  };
};
