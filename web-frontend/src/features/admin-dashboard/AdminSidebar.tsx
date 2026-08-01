"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandWordmark, BrandLogo } from "@/src/components/BrandLogo";
import { buildInitials } from "@/src/features/dashboard/components/user-dashboard/helpers";
import { resolveActiveId } from "@/src/features/dashboard/components/user-dashboard/Navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { useLogout } from "@/src/hooks/useLogout";
import { AdminNavIcon } from "./AdminNavIcon";
import { adminNavItems } from "./adminNavItems";
import { useCollapsibleSidebar } from "./useCollapsibleSidebar";

// Own key — deliberately distinct from the user dashboard's
// SIDEBAR_COLLAPSE_KEY ("arvann-sidebar-collapsed") so the two shells'
// collapsed state don't collide for an account that uses both.
const ADMIN_SIDEBAR_COLLAPSE_KEY = "arvann-admin-sidebar-collapsed";

const AdminNavList = ({ activePath, collapsed }: { activePath: string; collapsed: boolean }) => {
  const activeId = resolveActiveId(activePath, adminNavItems, "/admin");
  return (
    <nav className="flex-1 overflow-y-auto p-3">
      {!collapsed && (
        <p
          className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--medium-gray)" }}
        >
          Console
        </p>
      )}
      <div className="space-y-0.5">
        {adminNavItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${collapsed ? "justify-center" : ""}`}
              style={{ textDecoration: "none" }}
            >
              {isActive && (
                <motion.span
                  layoutId="admin-sidebar-active-pill"
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
                <AdminNavIcon id={item.id} active={isActive} />
              </span>
              {!collapsed && (
                <span
                  className="relative min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight"
                  style={{ color: isActive ? "#fff" : "var(--foreground)" }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

type AdminSidebarContentProps = {
  activePath: string;
  collapsed: boolean;
  onExpand: () => void;
};

const AdminSidebarContent = ({ activePath, collapsed, onExpand }: AdminSidebarContentProps) => {
  const { user } = useAuth();
  const { signOut, loggingOut } = useLogout();

  const label = user?.displayName ?? user?.email ?? "Admin";
  const initials = buildInitials(label);
  const avatarUrl = typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand ─────────────────────────────────────────────────── */}
      <div
        className={`flex items-center px-5 py-4 ${collapsed ? "justify-center px-3" : "gap-2.5"}`}
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {collapsed ? (
          <button type="button" onClick={onExpand} aria-label="Expand sidebar">
            <BrandLogo height={26} priority />
          </button>
        ) : (
          <BrandWordmark height={26} priority />
        )}
      </div>

      {/* ── Nav items ─────────────────────────────────────────────── */}
      <AdminNavList activePath={activePath} collapsed={collapsed} />

      {/* ── Account section ──────────────────────────────────────── */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        {!collapsed && (
          <Link
            href="/dashboard"
            className="mb-2 flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4M7 17h1M16 17h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            User dashboard
          </Link>
        )}
        <div
          className={`flex items-center rounded-xl p-2.5 ${collapsed ? "flex-col gap-2" : "gap-2.5"}`}
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: "var(--primary-light)" }}
            title={collapsed ? label : undefined}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>{initials}</span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>Admin</p>
              <p className="truncate text-[11px] leading-tight" style={{ color: "var(--medium-gray)" }}>{user?.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => { void signOut(); }}
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

/**
 * Admin console's desktop sidebar — real sticky collapsible `<aside>`
 * (260↔76px), modeled directly on the user dashboard's Sidebar
 * (Navigation.tsx). No company switcher (admin has no equivalent concept);
 * otherwise the same bands: brand, scrollable nav, bottom account/logout.
 * This replaces the old account-menu-in-topbar-dropdown pattern — the
 * account/logout band here is the one true owner of "signed in as" / "sign
 * out" now that AdminTopbar no longer renders them.
 *
 * Desktop-only — the mobile equivalent is AdminMobileRail's fixed bottom
 * rail + "More" sheet.
 */
export const AdminSidebar = ({ activePath }: { activePath: string }) => {
  const { collapsed, toggleCollapsed, expand } = useCollapsibleSidebar(ADMIN_SIDEBAR_COLLAPSE_KEY);

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
      <AdminSidebarContent activePath={activePath} collapsed={collapsed} onExpand={expand} />

      {/* Collapse toggle — floats on the border edge, matching the user
          dashboard Sidebar's toggle exactly. */}
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
