import { ComponentType } from "react";
import { DashboardScreen } from "../../screens/DashboardScreen";
import { InventoryScreen } from "../../screens/InventoryScreen";
import { RouteName, routes } from "../routes";

export type TabDefinition = {
  route: RouteName;
  label: string;
};

export const tabScreens: Record<RouteName, ComponentType> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.INVENTORY]: InventoryScreen,
};

export const tabDefinitions: TabDefinition[] = [
  { route: routes.DASHBOARD, label: "Operations" },
  { route: routes.INVENTORY, label: "Inventory" },
];
