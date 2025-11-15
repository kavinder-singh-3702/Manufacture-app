export const roles = {
  supervisor: "Supervisor",
  operator: "Operator",
  maintenance: "Maintenance",
  quality: "Quality",
} as const;

export type Role = (typeof roles)[keyof typeof roles];
