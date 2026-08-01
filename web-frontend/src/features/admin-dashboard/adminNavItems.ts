// Kept in its own module (rather than living inside AdminFrame.tsx, which
// mounts AdminMobileRail) so AdminFrame and AdminMobileRail can both import
// it without a circular AdminFrame <-> AdminMobileRail dependency.
export const adminNavItems = [
  { id: "overview",           label: "Overview",             href: "/admin" },
  { id: "verification",       label: "Verification queue",   href: "/admin/verification-requests" },
  { id: "users",              label: "Users",                href: "/admin/users" },
  { id: "companies",          label: "Companies",            href: "/admin/companies" },
  { id: "orders",             label: "Orders pipeline",      href: "/admin/orders" },
  { id: "products",           label: "In-house products",    href: "/admin/products" },
  { id: "ops",                label: "Ops console",          href: "/admin/ops" },
  { id: "product-inquiries",  label: "Product inquiries",    href: "/admin/product-inquiries" },
  { id: "notifications",      label: "Notification studio",  href: "/admin/notifications" },
  { id: "ad-studio",          label: "Ad studio",            href: "/admin/ad-studio" },
] as const;
