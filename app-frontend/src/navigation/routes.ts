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
  CHAT: "chat", // Admin chat tab
} as const;

export type RouteName = (typeof routes)[keyof typeof routes];

/**
 * Route metadata for building navigation tabs
 */
export type RouteConfig = {
  route: RouteName;
  label: string;
  icon: string;
  gradientColors: [string, string];
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
    gradientColors: ["#FF6B6B", "#FF8E53"],
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
    gradientColors: ["#22C55E", "#16A34A"],
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
    gradientColors: ["#0EA5E9", "#38BDF8"],
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
    gradientColors: ["#6C63FF", "#4AC9FF"],
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
    gradientColors: ["#EC4899", "#F43F5E"],
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
    gradientColors: ["#8B5CF6", "#A78BFA"],
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
    gradientColors: ["#EC4899", "#F472B6"],
    roles: ["admin", "super-admin"],
  },
  {
    route: routes.CHAT,
    label: "Messages",
    tabLabel: "Messages",
    icon: "💬",
    activeIcon: "chatbubbles",
    inactiveIcon: "chatbubbles-outline",
    topBarMode: "compact",
    gradientColors: ["#6C63FF", "#5248E6"],
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
    gradientColors: ["#F59E0B", "#FBBF24"],
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
    gradientColors: ["#10B981", "#34D399"],
    roles: ["admin", "super-admin"],
  },
];

/**
 * Get tabs filtered by user role
 */
export const getTabsForRole = (role: "super-admin" | "admin" | "user" | "guest"): RouteConfig[] => {
  return TAB_CONFIG.filter((tab) => tab.roles.includes(role));
};
