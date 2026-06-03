import { ViewStyle } from "react-native";
import { ServiceType } from "../../services/serviceRequest.service";

/**
 * Service-specific accent colors — warm, fresh, and distinct per service type.
 */

export type ServiceAccent = {
  color: string;
  soft: string;
  wash: string;
  emoji: string;
  /** Rich dark gradient used as the service card background (diagonal). */
  gradient: [string, string];
  /** Colored shadow glow used around the card to give it identity. */
  glow: string;
};

export const SERVICE_ACCENT_MAP: Record<ServiceType, ServiceAccent> = {
  // All cards now use shades of blue for a unified palette,
  // graduating from cool teal-cyan through royal blue into indigo.
  machine_repair: {
    color: "#22D3EE", // cyan-400 — bright accent for CTA/dots
    soft: "#CFFAFE",
    wash: "#ECFEFF",
    emoji: "🔧",
    gradient: ["#0E7490", "#0B3D4E"], // teal/cyan deep
    glow: "rgba(34, 211, 238, 0.35)",
  },
  worker: {
    color: "#38BDF8", // sky-400
    soft: "#E0F2FE",
    wash: "#F0F9FF",
    emoji: "👷",
    gradient: ["#0369A1", "#0B2C44"], // sky deep
    glow: "rgba(56, 189, 248, 0.35)",
  },
  transport: {
    color: "#60A5FA", // blue-400
    soft: "#DBEAFE",
    wash: "#EFF6FF",
    emoji: "🚚",
    gradient: ["#1E40AF", "#0F1F4D"], // royal blue
    glow: "rgba(96, 165, 250, 0.35)",
  },
  advertisement: {
    color: "#818CF8", // indigo-400 / navy accent
    soft: "#E0E7FF",
    wash: "#EEF2FF",
    emoji: "📢",
    gradient: ["#1E3A8A", "#0B1437"], // navy deep
    glow: "rgba(129, 140, 248, 0.35)",
  },
};

export const BUSINESS_ACCENT: ServiceAccent = {
  color: "#A5B4FC", // indigo-300 — slightly lighter shade for the 5th card
  soft: "#E0E7FF",
  wash: "#EEF2FF",
  emoji: "🚀",
  gradient: ["#312E81", "#0F0C45"], // indigo deep
  glow: "rgba(165, 180, 252, 0.35)",
};

/* ─── Neumorphism ────────────────────────────────────────────────────── */

/**
 * True neumorphism requires TWO shadows (light highlight + dark shadow).
 * React Native only supports one shadow per View, so we use a wrapper pattern:
 *
 *   <View style={neu.lightShadow}>     ← top-left highlight
 *     <View style={neu.darkShadow}>    ← bottom-right shadow
 *       {content}
 *     </View>
 *   </View>
 *
 * The `NeuCard` component handles this automatically.
 */

/** Light-mode neumorphic base background (matches the page) */
export const NEU_BG_LIGHT = "#EDF1F7";
/** Dark-mode neumorphic base background */
export const NEU_BG_DARK = "#1A1F2B";

export const neu = {
  /** Outer wrapper: light highlight shadow (top-left) */
  lightShadow: (isDark: boolean): ViewStyle =>
    isDark
      ? {
          shadowColor: "#2A3040",
          shadowOffset: { width: -3, height: -3 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 6,
        }
      : {
          shadowColor: "#FFFFFF",
          shadowOffset: { width: -4, height: -4 },
          shadowOpacity: 0.9,
          shadowRadius: 8,
          elevation: 6,
        },

  /** Inner wrapper: dark shadow (bottom-right) */
  darkShadow: (isDark: boolean): ViewStyle =>
    isDark
      ? {
          shadowColor: "#000000",
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
        }
      : {
          shadowColor: "#A3B1C6",
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 4,
        },

  /** Concave / pressed inward — single shadow is enough for inset feel */
  pressed: (isDark: boolean): ViewStyle =>
    isDark
      ? {
          shadowColor: "#000000",
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.4,
          shadowRadius: 3,
          elevation: 1,
        }
      : {
          shadowColor: "#A3B1C6",
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 1,
        },

  /** Card background that blends with the neumorphic surface */
  cardBg: (isDark: boolean): string => (isDark ? NEU_BG_DARK : NEU_BG_LIGHT),

  /** Slightly recessed background for inset areas */
  insetBg: (isDark: boolean): string => (isDark ? "#151A24" : "#E2E8F0"),

  /** Button raised — prominent, solid feel */
  buttonRaised: (isDark: boolean): ViewStyle =>
    isDark
      ? {
          shadowColor: "#000000",
          shadowOffset: { width: 2, height: 3 },
          shadowOpacity: 0.5,
          shadowRadius: 5,
          elevation: 5,
        }
      : {
          shadowColor: "#8B9BB5",
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 5,
        },
};
