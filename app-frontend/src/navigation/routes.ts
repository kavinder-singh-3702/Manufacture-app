export const routes = {
  DASHBOARD: "dashboard",
  INVENTORY: "inventory",
} as const;

export type RouteName = (typeof routes)[keyof typeof routes];
