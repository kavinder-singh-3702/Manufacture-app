import { ImageSourcePropType } from "react-native";

export const APP_NAME = "ARVANN";
export const BRAND_SHORT = "AR";
export const GUEST_EMAIL = "guest@arvann.app";

export const BRAND_COLORS = {
  charcoal: "#121923",
  charcoalDeep: "#05070C",
  charcoalSoft: "#0B0F14",
  blue: "#19B8E6",
  blueSoft: "#4CCEEF",
  red: "#F56E79",
  redSoft: "#FF8E98",
  glowBlue: "rgba(25,184,230,0.35)",
  glowRed: "rgba(245,110,121,0.30)",
} as const;

export const BRAND_IMAGES: Record<"logo" | "icon" | "splash" | "wordmark", ImageSourcePropType> = {
  logo: require("../../assets/brand/arvann-logo-source.png"),
  icon: require("../../assets/brand/arvann-icon-1024.png"),
  splash: require("../../assets/brand/arvann-splash-logo.png"),
  wordmark: require("../../assets/brand/arvann-logo-source.png"),
};
