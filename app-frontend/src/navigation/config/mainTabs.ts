import { ComponentType } from "react";
import { Ionicons } from "@expo/vector-icons";
import { DashboardScreen } from "../../screens/DashboardScreen";
import { InventoryScreen } from "../../screens/InventoryScreen";
import { RouteName, routes } from "../routes";

export type TabDefinition = {
  route: RouteName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const tabScreens: Record<RouteName, ComponentType> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.INVENTORY]: InventoryScreen,
};

export const tabDefinitions: TabDefinition[] = [
  { route: routes.DASHBOARD, label: "Operations", icon: "home-outline" },
  { route: routes.INVENTORY, label: "Inventory", icon: "cube-outline" },
];
