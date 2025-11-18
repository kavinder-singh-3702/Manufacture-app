import { NavigatorScreenParams } from "@react-navigation/native";
import { RouteName, routes } from "./routes";

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Profile: undefined;
};

// Helper mapped type ensures that every declared route has a tab entry.
export type MainTabParamList = {
  [K in RouteName]: undefined;
};

export const MAIN_TAB_ORDER: Array<{ route: RouteName; label: string }> = [
  { route: routes.DASHBOARD, label: "Operations" },
  { route: routes.INVENTORY, label: "Inventory" },
];
