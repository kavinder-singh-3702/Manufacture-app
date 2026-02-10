import { RouteName } from "../../../routes";

export type TopBarMode = "two_row" | "compact";

export type TopBarConfig = {
  mode: TopBarMode;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
};

export type FooterItemConfig = {
  route: RouteName;
  label: string;
  tabLabel?: string;
  icon?: string;
  activeIcon?: string;
  inactiveIcon?: string;
  isPlaceholder?: boolean;
};
