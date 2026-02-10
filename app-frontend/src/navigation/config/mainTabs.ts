// Legacy tab config retained to avoid import breakage. Active tab configuration lives in src/navigation/routes.ts.
import { ComponentType } from "react";
import { Ionicons } from "@expo/vector-icons";
import { DashboardScreen } from "../../screens/DashboardScreen";
import { StatsScreen } from "../../screens/StatsScreen";
import { RouteName, routes } from "../routes";

export type TabDefinition = {
  route: RouteName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const tabScreens: Partial<Record<RouteName, ComponentType>> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.STATS]: StatsScreen,
};

export const tabDefinitions: TabDefinition[] = [
  { route: routes.DASHBOARD, label: "Operations", icon: "home-outline" },
  { route: routes.STATS, label: "Product Stats", icon: "bar-chart-outline" },
];
