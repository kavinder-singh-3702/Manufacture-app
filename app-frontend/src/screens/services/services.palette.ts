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
};

export const SERVICE_ACCENT_MAP: Record<ServiceType, ServiceAccent> = {
  machine_repair: {
    color: "#D97706",
    soft: "#FEF3C7",
    wash: "#FFFBEB",
    emoji: "🔧",
  },
  worker: {
    color: "#059669",
    soft: "#D1FAE5",
    wash: "#ECFDF5",
    emoji: "👷",
  },
  transport: {
    color: "#2563EB",
    soft: "#DBEAFE",
    wash: "#EFF6FF",
    emoji: "🚚",
  },
  advertisement: {
    color: "#DC2626",
    soft: "#FEE2E2",
    wash: "#FEF2F2",
    emoji: "📢",
  },
};

export const BUSINESS_ACCENT: ServiceAccent = {
  color: "#7C3AED",
  soft: "#EDE9FE",
  wash: "#F5F3FF",
  emoji: "🚀",
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
