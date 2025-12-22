import { ComponentType } from "react";
import { DashboardScreen } from "../../screens/DashboardScreen";
import { StatsScreen } from "../../screens/StatsScreen";
import { RouteName, routes } from "../routes";
import homeIcon from "../../assets/footer/home-button.svg";
import statsIcon from "../../assets/footer/stats.png";

export type TabDefinition = {
  route: RouteName;
  label: string;
  icon: any;
};

export const tabScreens: Partial<Record<RouteName, ComponentType>> = {
  [routes.DASHBOARD]: DashboardScreen,
  [routes.STATS]: StatsScreen,
};

export const tabDefinitions: TabDefinition[] = [
  { route: routes.DASHBOARD, label: "Operations", icon: homeIcon },
  { route: routes.STATS, label: "Product Stats", icon: statsIcon },
];
