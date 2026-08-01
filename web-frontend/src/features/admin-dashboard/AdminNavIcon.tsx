// Admin counterpart to the user dashboard's NavIcon (Navigation.tsx) — same
// switch-by-id shape and the same `{active, color}` contract, so
// AdminMobileRail can pass it to the shared MobileNavRail's `renderIcon`
// prop exactly like MobileTabRail passes NavIcon. Paths are borrowed
// directly from NavIcon where the concept overlaps (verification, orders,
// products, notifications, ad-studio/ads, companies/company) rather than
// inventing a second visual language.
export const AdminNavIcon = ({ id, active, color: colorOverride }: { id: string; active: boolean; color?: string }) => {
  const color = colorOverride ?? (active ? "#fff" : "var(--medium-gray)");
  switch (id) {
    case "overview":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
        </svg>
      );
    case "verification":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3l7 4v5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V7l7-4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "users":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.8" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="17" cy="8" r="2.5" stroke={color} strokeWidth="1.8" />
          <path d="M15.3 14.2c2.6.5 4.7 2.6 4.7 5.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "companies":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4M7 17h1M16 17h1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "orders":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 8h6m-6 4h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "products":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 8 12 3 3 8m18 0v8l-9 5m9-13L12 13m0 0L3 8m9 5v8m0 0L3 16V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ops":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2" stroke={color} strokeWidth="1.8" />
          <path d="M8 20h8M12 16v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7 9l2.5 2L7 13" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11.5 13h3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "product-inquiries":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8" />
          <path d="m3 7 9 6 9-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 14v-3a6 6 0 1 0-12 0v3l-1.5 3H19.5L18 14z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "ad-studio":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 11v2a2 2 0 0 0 2 2h1l4 4V5L6 9H5a2 2 0 0 0-2 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 8a4 4 0 0 1 0 8M19 5a8 8 0 0 1 0 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
};
