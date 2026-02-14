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
    newArchEnabled: true,
    icon: "./assets/brand/arvann-icon-1024.png",
    splash: {
      backgroundColor: "#000000",
      image: "./assets/brand/arvann-splash-logo.png",
      resizeMode: "contain",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: isProd ? PROD_BUNDLE_IDENTIFIER : DEV_BUNDLE_IDENTIFIER,
      ...(isProd
        ? {}
        : {
            infoPlist: {
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
                NSAllowsLocalNetworking: true,
              },
            },
          }),
    },
    android: {
      package: isProd ? "com.manufactureapp.frontend" : "com.manufactureapp.frontend.dev",
      adaptiveIcon: {
        foregroundImage: "./assets/brand/arvann-icon-1024.png",
        backgroundColor: "#454545",
      },
    },
    web: {
      bundler: "metro",
    },
    extra: {
      eas: {
        projectId: "c2343c00-43ee-4da9-a32a-d24b8f0f099b",
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
    ],
  };
};
