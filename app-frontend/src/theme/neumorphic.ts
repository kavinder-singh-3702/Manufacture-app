import type { ViewStyle } from "react-native";

/**
 * Shared neumorphic palette + shadow helpers for the admin Command Center surfaces.
 *
 * Previously duplicated verbatim across:
 *   - src/screens/admin/CommandCenterScreen.tsx
 *   - src/screens/admin/components/OverviewTab.tsx
 *   - src/screens/admin/components/TradesTab.tsx
 *   - src/screens/admin/components/AlertsTab.tsx
 *   - src/screens/admin/components/LogsTab.tsx
 *   - src/screens/admin/AdminOpsConsoleScreen.tsx
 *
 * Lifted as part of the ops console rebuild (phase 1). Consumers should import
 * from "@/theme/neumorphic" instead of redeclaring locally.
 */

export const NEU_LIGHT = "#EDF1F7";
export const NEU_DARK = "#1A1F2B";
export const NEU_INSET_LIGHT = "#E2E8F0";
export const NEU_INSET_DARK = "#151A24";

/** Outer raised surface — drop shadow that lifts the element off the background. */
export const neuRaised = (isDark: boolean): ViewStyle =>
  isDark
    ? { shadowColor: "#000", shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.45, shadowRadius: 6, elevation: 4 }
    : { shadowColor: "#A3B1C6", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 };

/** Pressed / inset surface — softer shadow that sinks the element into the background. */
export const neuPressed = (isDark: boolean): ViewStyle =>
  isDark
    ? { shadowColor: "#000", shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 1 }
    : { shadowColor: "#A3B1C6", shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 1 };

/** Base card background for raised surfaces. */
export const neuCardBg = (isDark: boolean): string => (isDark ? NEU_DARK : NEU_LIGHT);

/** Inset background for pressed surfaces (slightly recessed from the card bg). */
export const neuInsetBg = (isDark: boolean): string => (isDark ? NEU_INSET_DARK : NEU_INSET_LIGHT);
