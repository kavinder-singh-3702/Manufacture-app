/**
 * Unified routes - All navigation tabs in one place
 * Role-based filtering happens in the navigation component
 */
export const routes = {
  // Common routes (shown to all users)
  DASHBOARD: "dashboard",

  // User-specific routes (5 tabs like original)
  CART: "cart",
  SERVICES: "services",
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
  /** Which roles can see this tab */
  roles: Array<"admin" | "user" | "guest">;
  /** For placeholder tabs that show alerts */
  isPlaceholder?: boolean;
};

/**
 * All available tabs with their configuration
 * The navigation component filters these based on user role
 */
export const TAB_CONFIG: RouteConfig[] = [
  // User tabs (5 tabs like original footer)
  {
    route: routes.DASHBOARD,
    label: "Home",
    icon: "🏠",
    gradientColors: ["#FF6B6B", "#FF8E53"],
    roles: ["user", "guest"],
  },
  {
    route: routes.CART,
    label: "Cart",
    icon: "🛒",
    gradientColors: ["#FF4757", "#FF6348"],
    roles: ["user", "guest"],
  },
  {
    route: routes.SERVICES,
    label: "Services",
    icon: "🛎️",
    gradientColors: ["#ee0979", "#ff6a00"],
    roles: ["user", "guest"],
    // No longer a placeholder - now has chat functionality!
  },
  {
    route: routes.STATS,
    label: "Stats",
    icon: "📊",
    gradientColors: ["#F97316", "#FBBF24"],
    roles: ["user", "guest"],
  },
  {
    route: routes.PROFILE_TAB,
    label: "Profile",
    icon: "👤",
    gradientColors: ["#EC4899", "#F43F5E"],
    roles: ["user", "guest"],
    isPlaceholder: true,
  },

  // Admin tabs (5 tabs)
  {
    route: routes.DASHBOARD,
    label: "Dashboard",
    icon: "📊",
    gradientColors: ["#8B5CF6", "#A78BFA"],
    roles: ["admin"],
  },
  {
    route: routes.USERS,
    label: "Users",
    icon: "👥",
    gradientColors: ["#EC4899", "#F472B6"],
    roles: ["admin"],
  },
  {
    route: routes.CHAT,
    label: "Messages",
    icon: "💬",
    gradientColors: ["#6C63FF", "#5248E6"],
    roles: ["admin"],
  },
  {
    route: routes.VERIFICATIONS,
    label: "Reviews",
    icon: "📋",
    gradientColors: ["#F59E0B", "#FBBF24"],
    roles: ["admin"],
  },
  {
    route: routes.COMPANIES,
    label: "Companies",
    icon: "🏢",
    gradientColors: ["#10B981", "#34D399"],
    roles: ["admin"],
  },
];

/**
 * Get tabs filtered by user role
 */
export const getTabsForRole = (role: "admin" | "user" | "guest"): RouteConfig[] => {
  return TAB_CONFIG.filter((tab) => tab.roles.includes(role));
};
