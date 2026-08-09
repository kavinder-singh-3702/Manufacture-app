import { ImageSourcePropType } from "react-native";

export const APP_NAME = "ARVANN";
export const BRAND_SHORT = "AR";
export const GUEST_EMAIL = "guest@arvann.app";

/**
 * ARVANN's own contact details — single source of truth for every "call us" /
 * "message us" surface in the app. These are ARVANN's business details, not
 * third-party seller PII, so they are shown unmasked and to guests too.
 *
 * A seller's number is a different thing entirely and still comes from
 * `product.company.contact.phone` via `screens/product/utils/productContact.ts`.
 * Note that for ARVANN's own in-house catalog the backend now seeds that same
 * field with this number (backend `inhouseCatalog.service.js`), so both paths
 * agree — the constants below are what the UI *displays*, and what keeps the
 * Call button working even on a build talking to an un-backfilled server.
 */
export const SUPPORT_PHONE = "+919306407553";
export const SUPPORT_PHONE_DISPLAY = "+91 93064 07553";
/** `https://wa.me/…`, not `whatsapp://` — the https form is already covered by
 *  the AndroidManifest `<queries>` VIEW intent and falls back to WhatsApp Web. */
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, "")}`;
export const SUPPORT_EMAIL = "arvann100@gmail.com";
/** WhatsApp's own brand green — intentionally outside the theme palette so it
 *  reads as WhatsApp in both light and dark mode. */
export const WHATSAPP_GREEN = "#25D366";

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
  logo: require("../../assets/brand/arvann-icon-new.png"),
  icon: require("../../assets/brand/arvann-icon-new.png"),
  splash: require("../../assets/brand/arvann-icon-new.png"),
  wordmark: require("../../assets/brand/arvann-icon-new.png"),
};
