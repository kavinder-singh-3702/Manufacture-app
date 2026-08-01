"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sheet } from "@/src/components/ui/Sheet";
import { buildInitials } from "../user-dashboard/helpers";
import { resolveActiveId } from "../user-dashboard/Navigation";

export type MobileNavRailTab = {
  id: string;
  label: string;
  href: string;
  /** Numeric badge (e.g. cart count) rendered on the tab icon. Omit or 0 to hide. */
  badge?: number;
};

export type MobileNavRailItem = {
  id: string;
  label: string;
  href: string;
};

export type MobileNavRailUser = {
  name: string;
  email?: string;
  avatarUrl?: string;
};

export type MobileNavRailProps = {
  /** Current pathname — every active-state computation in this component derives from it. */
  activePath: string;
  /**
   * The one destination (e.g. "/dashboard", "/admin") that must match
   * `activePath` exactly rather than as a path prefix — every other item's
   * href is nested under it, so without this it would prefix-match (and
   * steal the active pill from) every nested route.
   */
  rootHref: string;
  /** ~4 primary bottom-bar destinations. */
  tabs: ReadonlyArray<MobileNavRailTab>;
  /** Every nav destination, shown in the "More" sheet grid. */
  allItems: ReadonlyArray<MobileNavRailItem>;
  /**
   * Draws a single glyph for `id`. `color`, when passed, overrides the
   * default active/inactive coloring — the bare tab row has no colored pill
   * behind it, so the active tab passes an explicit tint instead of relying
   * on the white-on-active default that works for the colored sheet tiles.
   */
  renderIcon: (id: string, active: boolean, color?: string) => ReactNode;
  user: MobileNavRailUser;
  onSignOut: () => void;
  signingOut: boolean;
};

/**
 * Presentational fixed bottom tab rail shared by the user dashboard
 * (MobileTabRail) and the admin console (AdminMobileRail): the fixed bar
 * with the layoutId active-pill slide, the "More" button + Sheet containing
 * the full nav grid, and the account footer (avatar/name/email + sign out).
 * Everything role-specific — which destinations, which icons, which user —
 * is threaded in as props, so this file has zero knowledge of "user" vs
 * "admin".
 */
export const MobileNavRail = ({
  activePath,
  rootHref,
  tabs,
  allItems,
  renderIcon,
  user,
  onSignOut,
  signingOut,
}: MobileNavRailProps) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const userInitials = buildInitials(user.name || "U");

  const isTabActive = (tab: MobileNavRailTab) =>
    tab.href === rootHref ? activePath === tab.href : activePath.startsWith(tab.href);
  const isMoreActive = !tabs.some(isTabActive);
  const activeItemId = resolveActiveId(activePath, allItems, rootHref);

  return (
    <>
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-30 flex lg:hidden"
        style={{
          backgroundColor: "color-mix(in srgb, var(--surface) 96%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
        }}
        aria-label="Primary"
      >
        {tabs.map((tab) => {
          const isActive = isTabActive(tab);
          const badge = tab.badge ?? 0;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-tab-active"
                  className="absolute top-0 h-[3px] w-6 rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  aria-hidden
                />
              )}
              <motion.span whileTap={{ scale: 0.88 }} className="relative">
                {/* No colored pill behind this icon (unlike the sheet grid's
                    active tile), so the caller forces an explicit tint here
                    instead of relying on renderIcon's white-on-active
                    default, which would render invisible on this bare row. */}
                {renderIcon(tab.id, isActive, isActive ? "var(--primary)" : undefined)}
                {badge > 0 && (
                  <span
                    className="absolute -right-2 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8px] font-bold text-white"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </motion.span>
              <span
                className="text-[10px] font-semibold leading-tight"
                style={{ color: isActive ? "var(--primary)" : "var(--medium-gray)" }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* More — opens the full nav grid instead of a hamburger drawer */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-current={isMoreActive ? "page" : undefined}
          className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
        >
          {isMoreActive && (
            <motion.span
              layoutId="mobile-tab-active"
              className="absolute top-0 h-[3px] w-6 rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              aria-hidden
            />
          )}
          <motion.span whileTap={{ scale: 0.88 }} className="relative">
            <MoreIcon active={isMoreActive} />
          </motion.span>
          <span
            className="text-[10px] font-semibold leading-tight"
            style={{ color: isMoreActive ? "var(--primary)" : "var(--medium-gray)" }}
          >
            More
          </span>
        </button>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
        <div className="grid grid-cols-3 gap-2.5">
          {allItems.map((item) => {
            const isActive = item.id === activeItemId;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center"
                style={{
                  backgroundColor: isActive ? "var(--primary-light)" : "var(--background)",
                  border: isActive ? "1px solid rgba(20,141,178,0.2)" : "1px solid var(--border)",
                }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isActive ? "var(--primary)" : "var(--surface)", border: isActive ? "none" : "1px solid var(--border)" }}
                >
                  {renderIcon(item.id, isActive)}
                </span>
                <span className="text-[11px] font-semibold leading-tight" style={{ color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Account footer — mirrors Sidebar's "User section" (desktop has no
            equivalent gap since Sidebar is always visible there; on mobile
            this sheet is the only place a signed-in user can sign out). */}
        <div
          className="mt-4 flex items-center gap-2.5 rounded-2xl p-2.5"
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>{userInitials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{user.name}</p>
            {user.email && (
              <p className="truncate text-[11px] leading-tight" style={{ color: "var(--medium-gray)" }}>{user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setMoreOpen(false); onSignOut(); }}
            disabled={signingOut}
            className="flex-shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: "#DC2626" }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </Sheet>
    </>
  );
};

const MoreIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="5" cy="12" r="1.6" fill={active ? "var(--primary)" : "var(--medium-gray)"} />
    <circle cx="12" cy="12" r="1.6" fill={active ? "var(--primary)" : "var(--medium-gray)"} />
    <circle cx="19" cy="12" r="1.6" fill={active ? "var(--primary)" : "var(--medium-gray)"} />
  </svg>
);
