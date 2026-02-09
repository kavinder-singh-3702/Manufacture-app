import { ImageSourcePropType } from "react-native";

export const APP_NAME = "ARVANN";
export const BRAND_SHORT = "AR";
export const GUEST_EMAIL = "guest@arvann.app";

export const BRAND_COLORS = {
  charcoal: "#454545",
  charcoalDeep: "#0B0B0D",
  charcoalSoft: "#16181D",
  blue: "#8CA5EF",
  blueSoft: "#AFC0FA",
  red: "#E3483E",
  redSoft: "#F06F65",
  glowBlue: "rgba(140,165,239,0.35)",
  glowRed: "rgba(227,72,62,0.30)",
} as const;

export const BRAND_IMAGES: Record<"logo" | "icon" | "splash" | "wordmark", ImageSourcePropType> = {
  logo: require("../../assets/brand/arvann-logo-source.png"),
  icon: require("../../assets/brand/arvann-icon-1024.png"),
  splash: require("../../assets/brand/arvann-splash-logo.png"),
  wordmark: require("../../assets/brand/arvann-logo-source.png"),
};
