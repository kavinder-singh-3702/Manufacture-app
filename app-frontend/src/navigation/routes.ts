import type { ThemeGradientKey } from "../theme";

/**
 * Unified routes - All navigation tabs in one place
 * Role-based filtering happens in the navigation component
 */
export const routes = {
  // Common routes (shown to all users)
  DASHBOARD: "dashboard",

  // User-specific routes (5 tabs)
  CART: "cart",
  SERVICES: "services",
  ACCOUNTING: "accounting",
  STATS: "stats",
  PROFILE_TAB: "profile-tab",

  // Admin-specific routes
  USERS: "users",
  VERIFICATIONS: "verifications",
  COMPANIES: "companies",
  CHAT: "chat", // Admin ops tab
} as const;

export type RouteName = (typeof routes)[keyof typeof routes];

/**
 * Route metadata for building navigation tabs
 */
export type RouteConfig = {
  route: RouteName;
  label: string;
  icon: string;
  gradientKey: ThemeGradientKey;
  tabLabel?: string;
  activeIcon?: string;
  inactiveIcon?: string;
  topBarMode?: "two_row" | "compact";
  /** Which roles can see this tab */
  roles: Array<"super-admin" | "admin" | "user" | "guest">;
  /** For placeholder tabs that show alerts */
  isPlaceholder?: boolean;
};

/**
 * All available tabs with their configuration
 * The navigation component filters these based on user role
 */
export const TAB_CONFIG: RouteConfig[] = [
  // User tabs (5 tabs)
  {
    route: routes.DASHBOARD,
    label: "Home",
    tabLabel: "Home",
    icon: "🏠",
    activeIcon: "home",
    inactiveIcon: "home-outline",
    topBarMode: "two_row",
    gradientKey: "heroCyan",
    roles: ["user", "guest"],
  },
  {
    route: routes.CART,
    label: "Cart",
    tabLabel: "Cart",
    icon: "🛒",
    activeIcon: "bag-handle",
    inactiveIcon: "bag-handle-outline",
    topBarMode: "two_row",
    gradientKey: "ctaPrimary",
    roles: ["user", "guest"],
  },
  {
    route: routes.SERVICES,
    label: "Services",
    tabLabel: "Services",
    icon: "🛠️",
    activeIcon: "grid",
    inactiveIcon: "grid-outline",
    topBarMode: "two_row",
    gradientKey: "statusInfo",
    roles: ["user", "guest"],
  },
  {
    route: routes.ACCOUNTING,
    label: "Accounts",
    tabLabel: "Accounts",
    icon: "📒",
    activeIcon: "pie-chart",
    inactiveIcon: "pie-chart-outline",
    topBarMode: "two_row",
    gradientKey: "canvasSubtle",
    roles: ["user", "guest"],
  },
  {
    route: routes.PROFILE_TAB,
    label: "Profile",
    tabLabel: "Profile",
    icon: "👤",
    activeIcon: "person",
    inactiveIcon: "person-outline",
    topBarMode: "compact",
    gradientKey: "heroCoral",
    roles: ["user", "guest"],
    isPlaceholder: true,
  },

  // Admin tabs (5 tabs)
  {
    route: routes.DASHBOARD,
    label: "Dashboard",
    tabLabel: "Dashboard",
    icon: "📊",
    activeIcon: "speedometer",
    inactiveIcon: "speedometer-outline",
    topBarMode: "two_row",
    gradientKey: "heroCyan",
    roles: ["admin", "super-admin"],
  },
  {
    route: routes.USERS,
    label: "Users",
    tabLabel: "Users",
    icon: "👥",
    activeIcon: "people",
    inactiveIcon: "people-outline",
    topBarMode: "compact",
    gradientKey: "accentDiagonal",
    roles: ["admin", "super-admin"],
  },
  {
    route: routes.CHAT,
    label: "Ops",
    tabLabel: "Ops",
    icon: "🧭",
    activeIcon: "chatbubbles",
    inactiveIcon: "chatbubbles-outline",
    topBarMode: "compact",
    gradientKey: "canvasSubtle",
    roles: ["admin", "super-admin"],
  },
  {
    route: routes.VERIFICATIONS,
    label: "Reviews",
    tabLabel: "Reviews",
    icon: "📋",
    activeIcon: "clipboard",
    inactiveIcon: "clipboard-outline",
    topBarMode: "compact",
    gradientKey: "heroCoral",
    roles: ["admin", "super-admin"],
  },
  {
    route: routes.COMPANIES,
    label: "Companies",
    tabLabel: "Companies",
    icon: "🏢",
    activeIcon: "business",
    inactiveIcon: "business-outline",
    topBarMode: "compact",
    gradientKey: "ctaPrimary",
    roles: ["admin", "super-admin"],
  },
];

/**
 * Get tabs filtered by user role
 */
export const getTabsForRole = (role: "super-admin" | "admin" | "user" | "guest"): RouteConfig[] => {
  return TAB_CONFIG.filter((tab) => tab.roles.includes(role));
};
