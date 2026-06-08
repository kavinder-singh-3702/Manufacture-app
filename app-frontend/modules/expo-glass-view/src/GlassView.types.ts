import type { ViewProps } from "react-native";

export type GlassTint = "light" | "dark" | "system";

export type GlassViewProps = ViewProps & {
  /** Material tint. iOS uses systemUltraThinMaterial / -Dark; iOS 26 uses UIGlassEffect. */
  tint?: GlassTint;
  /** 0-100. On Android, controls blur radius; on iOS it scales the optional inner sheen opacity. */
  intensity?: number;
  /** Rounded-corner radius in dp/pt. */
  cornerRadius?: number;
  /** Optional 1px highlight border color (e.g. "rgba(255,255,255,0.35)"). */
  borderColor?: string;
};
