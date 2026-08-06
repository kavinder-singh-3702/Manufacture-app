// Kept in its own module (rather than living inside AdminFrame.tsx, which
// mounts AdminMobileRail) so AdminFrame and AdminMobileRail can both import
// it without a circular AdminFrame <-> AdminMobileRail dependency.
export const adminNavItems = [
  { id: "overview",           label: "Overview",             href: "/admin" },
  { id: "verification",       label: "Verification queue",   href: "/admin/verification-requests" },
  { id: "users",              label: "Users",                href: "/admin/users" },
  { id: "orders",             label: "Orders pipeline",      href: "/admin/orders" },
  // Ops console and Product inquiries moved up (right after the primary bottom-rail
  // tabs) so they land in the first row of the mobile "More" grid instead of the
  // third — they're daily-triage queues, not occasional-use settings pages.
  { id: "ops",                label: "Ops console",          href: "/admin/ops" },
  { id: "product-inquiries",  label: "Product inquiries",    href: "/admin/product-inquiries" },
  { id: "companies",          label: "Companies",            href: "/admin/companies" },
  { id: "products",           label: "In-house products",    href: "/admin/products" },
  { id: "chat",               label: "Chat",                 href: "/admin/chat" },
  { id: "notifications",      label: "Notification studio",  href: "/admin/notifications" },
  { id: "ad-studio",          label: "Ad studio",            href: "/admin/ad-studio" },
] as const;
