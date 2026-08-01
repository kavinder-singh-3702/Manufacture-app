"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardContext } from "./context";
import { buildInitials, resolveCompanyLabel } from "./helpers";
import { BrandWordmark, BrandLogo } from "@/src/components/BrandLogo";
import { useCart } from "@/src/providers/CartProvider";
import { useLogout } from "@/src/hooks/useLogout";

// No `description` field — every row is icon + label only. Subtext lines
// under each nav item read as consumer-y rather than professional, and the
// label alone is enough once the icon set is distinct.
type NavItem = {
  id: string;
  label: string;
  href: string;
  soon?: boolean;
};

const workspaceNav: NavItem[] = [
  { id: "overview",      label: "Overview",      href: "/dashboard" },
  { id: "products",      label: "Products",      href: "/dashboard/products" },
  { id: "company",       label: "Company",       href: "/dashboard/company" },
  { id: "verification",  label: "Verification",  href: "/dashboard/verification" },
  { id: "profile",       label: "Profile",       href: "/dashboard/profile" },
  { id: "activity",      label: "Activity",      href: "/dashboard/activity" },
  { id: "notifications", label: "Notifications", href: "/dashboard/notifications" },
  { id: "settings",      label: "Settings",      href: "/dashboard/settings" },
];

const modulesNav: NavItem[] = [
  { id: "my-products",        label: "My Products",    href: "/dashboard/products/mine" },
  { id: "orders",             label: "My Orders",      href: "/dashboard/orders" },
  { id: "cart",               label: "Cart",           href: "/dashboard/cart" },
  { id: "accounting",         label: "Accounting",     href: "/dashboard/accounting" },
  { id: "services",           label: "Services",       href: "/dashboard/services" },
  { id: "inventory",          label: "Inventory",      href: "/dashboard/inventory" },
  { id: "internal-inventory", label: "Internal Stock", href: "/dashboard/internal-inventory" },
  { id: "quotes",             label: "Quotes",         href: "/dashboard/quotes" },
  { id: "ads",                label: "Ad Runs",        href: "/dashboard/ads" },
  { id: "chat",               label: "Chat",           href: "/dashboard/chat" },
];

export const navItems: ReadonlyArray<NavItem> = [...workspaceNav, ...modulesNav];

/**
 * Longest-prefix match, not "first row whose href is a prefix": nested
 * destinations like /dashboard/products/mine are a prefix match for BOTH
 * "Products" and "My Products", and highlighting both would render two active
 * pills sharing one framer-motion layoutId.
 */
type MatchableNavItem = { id: string; href: string };

/**
 * Longest-prefix match, generalized to take an arbitrary item list + root
 * href instead of closing over this file's own `navItems`/"/dashboard" —
 * so MobileNavRail (shared/MobileNavRail.tsx) can resolve the active
 * destination for the admin nav set too, not just the user dashboard's.
 * `rootHref` (e.g. "/dashboard", "/admin") must match exactly rather than as
 * a prefix, since every other item's href is nested under it — without the
 * exception it would prefix-match (and fight over the active pill with)
 * every nested route.
 */
export const resolveActiveId = (
  activePath: string,
  items: ReadonlyArray<MatchableNavItem>,
  rootHref?: string
): string | null => {
  let best: MatchableNavItem | null = null;
  for (const item of items) {
    const matches =
      item.href === rootHref
        ? activePath === item.href
        : activePath === item.href || activePath.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.href.length)) best = item;
  }
  return best?.id ?? null;
};

/**
 * Longest-prefix match. A plain `startsWith` lights up both "Products"
 * (/dashboard/products) and "My Products" (/dashboard/products/mine) on the
 * nested route — which in the sidebar also meant two rows fighting over one
 * framer-motion layoutId. Exported so MobileTabRail's "More" sheet resolves
 * the active tile identically instead of re-deriving it.
 */
export const resolveActiveNavId = (activePath: string): string | null =>
  resolveActiveId(activePath, navItems, "/dashboard");

type NavId = string;

/**
 * Exported so MobileTabRail can reuse the exact same glyphs instead of
 * redrawing them. `active` defaults to white — correct when the icon sits on
 * a solid colored pill (Sidebar's active row, the "More" sheet grid) — but
 * MobileTabRail's bare tab row has no colored backing, so it passes
 * `color="var(--primary)"` explicitly there instead of relying on the default.
 */
export const NavIcon = ({ id, active, color: colorOverride }: { id: NavId; active: boolean; color?: string }) => {
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
    case "products":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 8 12 3 3 8m18 0v8l-9 5m9-13L12 13m0 0L3 8m9 5v8m0 0L3 16V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "my-products":
      // Price tag — reads as "my listings", distinct from the cube used for
      // the marketplace "Products" row above it.
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 11.5V4a1 1 0 0 1 1-1h7.5a1 1 0 0 1 .7.3l8.5 8.5a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 12.2a1 1 0 0 1-.3-.7z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7.5" cy="7.5" r="1.4" stroke={color} strokeWidth="1.8" />
        </svg>
      );
    case "company":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4M7 17h1M16 17h1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "activity":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12h3l2-6 4 12 2-6h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "verification":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3l7 4v5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V7l7-4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 14v-3a6 6 0 1 0-12 0v3l-1.5 3H19.5L18 14z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "orders":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 8h6m-6 4h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "inventory":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "quotes":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "services":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14.7 6.3a4 4 0 0 1 4.5 5.4l-1.3-1.3a2 2 0 0 0-2.8 2.8l1.3 1.3a4 4 0 0 1-5.4-4.5l-7.3 7.3a1.5 1.5 0 0 0 2.1 2.1l7.3-7.3" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chat":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-8 8 8.6 8.6 0 0 1-3.5-.7L4 21l1.7-5.5A8 8 0 1 1 21 12z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "accounting":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "cart":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "internal-inventory":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth="1.8" />
          <path d="M9 12h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "ads":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 11v2a2 2 0 0 0 2 2h1l4 4V5L6 9H5a2 2 0 0 0-2 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 8a4 4 0 0 1 0 8M19 5a8 8 0 0 1 0 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke={color} strokeWidth="1.8" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

const NavGroup = ({
  label,
  items,
  activePath,
  onNavigate,
  className = "",
  collapsed = false,
  pillId,
}: {
  label: string;
  items: NavItem[];
  activePath: string;
  onNavigate: () => void;
  className?: string;
  collapsed?: boolean;
  /** Shared framer-motion layoutId so the active pill glides between items on navigation instead of hard-cutting. */
  pillId: string;
}) => {
  const activeId = resolveActiveNavId(activePath);
  return (
  <div className={className}>
    {!collapsed && (
      <p
        className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: "var(--medium-gray)" }}
      >
        {label}
      </p>
    )}
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={`relative flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${collapsed ? "justify-center" : ""}`}
            style={{ textDecoration: "none" }}
          >
            {isActive && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all"
              style={{
                backgroundColor: isActive ? "rgba(255,255,255,0.18)" : "var(--background)",
                border: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--border)",
              }}
            >
              <NavIcon id={item.id} active={isActive} />
            </span>
            {!collapsed && (
              <span
                className="relative min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight"
                style={{ color: isActive ? "#fff" : "var(--foreground)" }}
              >
                {item.label}
              </span>
            )}
            {!collapsed && item.soon ? (
              <span
                className="relative flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.22)" : "var(--primary-light)",
                  color: isActive ? "#fff" : "var(--primary)",
                  letterSpacing: "0.08em",
                }}
              >
                Soon
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  </div>
  );
};

type SidebarContentProps = {
  activePath: string;
  onNavigate: () => void;
  onOpenCompanyCreate: () => void;
  onSwitchCompany: (id: string) => Promise<void>;
  switchingCompanyId: string | null;
  onLogout: () => void;
  loggingOut?: boolean;
  /** Desktop-only icon-rail mode — no effect inside the mobile overlay. */
  collapsed?: boolean;
  onExpand?: () => void;
};

const SidebarContent = ({
  activePath,
  onNavigate,
  onOpenCompanyCreate,
  onSwitchCompany,
  switchingCompanyId,
  onLogout,
  loggingOut = false,
  collapsed = false,
  onExpand,
}: SidebarContentProps) => {
  const [companySwitcherOpen, setCompanySwitcherOpen] = useState(false);
  const { user, activeCompany, companies } = useDashboardContext();

  const companyLabel = activeCompany?.displayName ?? resolveCompanyLabel(user);
  const companyInitials = buildInitials(companyLabel);
  const userInitials = buildInitials(user.displayName ?? user.email ?? "U");
  const userAvatar = typeof user.avatarUrl === "string" ? user.avatarUrl : undefined;
  const companyLogo = activeCompany?.logoUrl;

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand ─────────────────────────────────────────────────── */}
      <div className={`flex items-center px-5 py-4 ${collapsed ? "justify-center px-3" : "gap-2.5"}`} style={{ borderBottom: "1px solid var(--border)" }}>
        {collapsed ? <BrandLogo height={26} priority /> : <BrandWordmark height={26} priority />}
      </div>

      {/* ── Company switcher ──────────────────────────────────────── */}
      <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <button
          type="button"
          onClick={() => (collapsed ? onExpand?.() : setCompanySwitcherOpen((p) => !p))}
          title={collapsed ? companyLabel : undefined}
          className={`flex w-full items-center rounded-xl p-2.5 text-left transition-opacity hover:opacity-80 ${collapsed ? "justify-center" : "gap-3"}`}
          style={{ backgroundColor: "var(--primary-light)", border: "1px solid rgba(20,141,178,0.15)" }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold"
            style={{ backgroundColor: "var(--primary)", color: "#fff" }}
          >
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={companyLogo} alt={companyLabel} className="h-full w-full object-cover" />
            ) : (
              companyInitials
            )}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{companyLabel}</p>
                <p className="text-[11px] capitalize" style={{ color: "var(--medium-gray)" }}>
                  {activeCompany?.complianceStatus ?? "pending"}
                </p>
              </div>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                className="flex-shrink-0 transition-transform"
                style={{ color: "var(--medium-gray)", transform: companySwitcherOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>

        <AnimatePresence>
          {!collapsed && companySwitcherOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-2 overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
            >
              {companies.map((company) => {
                const isActive = company.id === activeCompany?.id;
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={async () => {
                      setCompanySwitcherOpen(false);
                      await onSwitchCompany(company.id);
                    }}
                    disabled={switchingCompanyId === company.id}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: isActive ? "var(--primary-light)" : "transparent" }}
                  >
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                      style={{
                        backgroundColor: isActive ? "var(--primary)" : "var(--background)",
                        color: isActive ? "#fff" : "var(--medium-gray)",
                        border: isActive ? "none" : "1px solid var(--border)",
                      }}
                    >
                      {buildInitials(company.displayName)}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                      {switchingCompanyId === company.id ? "Switching…" : company.displayName}
                    </p>
                    {isActive && (
                      <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                    )}
                  </button>
                );
              })}
              {!companies.length && (
                <p className="px-3 py-2.5 text-[12px]" style={{ color: "var(--medium-gray)" }}>No companies yet.</p>
              )}
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => { setCompanySwitcherOpen(false); onOpenCompanyCreate(); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold transition-opacity hover:opacity-80"
                  style={{ color: "var(--primary)" }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-base"
                    style={{ backgroundColor: "var(--primary-light)" }}
                  >
                    +
                  </span>
                  Add company
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-3">
        <NavGroup label="Workspace" items={workspaceNav} activePath={activePath} onNavigate={onNavigate} collapsed={collapsed} pillId="sidebar-active-pill" />
        <NavGroup label="Modules" items={modulesNav} activePath={activePath} onNavigate={onNavigate} className="mt-5" collapsed={collapsed} pillId="sidebar-active-pill" />
      </nav>

      {/* ── User section ─────────────────────────────────────────── */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div
          className={`flex items-center rounded-xl p-2.5 ${collapsed ? "flex-col gap-2" : "gap-2.5"}`}
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: "var(--primary-light)" }}
            title={collapsed ? (user.displayName ?? user.email) : undefined}
          >
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={userAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>{userInitials}</span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                {user.displayName ?? user.email}
              </p>
              <p className="truncate text-[11px] leading-tight" style={{ color: "var(--medium-gray)" }}>{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: "var(--medium-gray)" }}
            aria-label="Logout"
            title={collapsed ? "Logout" : undefined}
          >
            {loggingOut ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="animate-spin">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const SIDEBAR_COLLAPSE_KEY = "arvann-sidebar-collapsed";

// Desktop-only icon rail — the mobile equivalent is MobileTabRail's bottom
// rail plus its "More" sheet (full nav grid), which replaced the hamburger
// overlay this component used to render on small screens. Full nav content
// on mobile now has exactly one home instead of two (rail vs. drawer)
// drifting out of sync.
export type SidebarProps = Omit<SidebarContentProps, "onNavigate" | "collapsed" | "onExpand">;

// Lazy initializer (read on the client's first render), matching the
// established pattern in ThemeProvider's readStoredMode — avoids the
// setState-in-effect lint error and an extra render pass for something that
// never needs to match server-rendered markup exactly.
const readCollapsedState = (): boolean =>
  typeof window !== "undefined" && window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";

export const Sidebar = ({ activePath, onOpenCompanyCreate, onSwitchCompany, switchingCompanyId, onLogout, loggingOut }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(readCollapsedState);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside
      className="h-screen-safe relative hidden lg:flex lg:flex-col"
      style={{
        width: collapsed ? 76 : 260,
        transition: "width 0.2s ease",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        borderRight: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        overflowY: "auto",
      }}
    >
      <SidebarContent
        activePath={activePath}
        onNavigate={() => {}}
        onOpenCompanyCreate={onOpenCompanyCreate}
        onSwitchCompany={onSwitchCompany}
        switchingCompanyId={switchingCompanyId}
        onLogout={onLogout}
        loggingOut={loggingOut}
        collapsed={collapsed}
        onExpand={() => { setCollapsed(false); window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, "0"); }}
      />

      {/* Collapse toggle — floats on the border edge, matching common admin-shell patterns */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-transform hover:scale-110"
        style={{ right: -12, border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--medium-gray)", boxShadow: "var(--shadow-sm)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: collapsed ? "rotate(180deg)" : "none" }}>
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </aside>
  );
};

/**
 * Sidebar wired to the shared logout flow (confirm + clearCart + redirect).
 * A separate component (rather than calling useCart/useLogout in Sidebar
 * directly) so Sidebar itself stays a plain presentational component —
 * useCart() needs a CartProvider ancestor, which only exists on this
 * sub-tree, not in DashboardFrame's own render.
 */
export const SidebarWithLogout = (props: Omit<SidebarProps, "onLogout" | "loggingOut">) => {
  const { clearCart } = useCart();
  const { signOut, loggingOut } = useLogout({ onBeforeLogout: clearCart });
  return <Sidebar {...props} onLogout={signOut} loggingOut={loggingOut} />;
};
