"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/src/providers/CartProvider";
import { useLogout } from "@/src/hooks/useLogout";
import { Sheet } from "@/src/components/ui/Sheet";
import { useDashboardContext } from "./context";
import { buildInitials } from "./helpers";
import { navItems, NavIcon } from "./Navigation";

type TabItem = {
  id: string;
  label: string;
  href: string;
};

// Mirrors the app's user-role bottom tab set (app-frontend/src/navigation/routes.ts),
// with "More" standing in for the hamburger drawer this rail used to require
// for anything outside these 4 destinations. Reuses NavIcon from Navigation.tsx
// so tab glyphs are defined exactly once for both the sidebar and this rail.
// "Profile" isn't a tab here — the topbar avatar (visible at every breakpoint)
// already reaches it, so the 5th slot goes to the full nav grid instead.
//
// "Shop" goes to the in-house catalog (ARVANN-admin-listed products via
// createdByRole: "admin", see src/features/inhouse/constants.ts), not the
// full marketplace — matching the app's Shop tab, which is scoped the same
// way in AdminProductsScreen.
const TABS: TabItem[] = [
  { id: "overview",   label: "Home",     href: "/dashboard" },
  { id: "products",   label: "Shop",     href: "/dashboard/shop" },
  { id: "services",   label: "Services", href: "/dashboard/services" },
  { id: "accounting", label: "Accounts", href: "/dashboard/accounting" },
];

/**
 * Fixed bottom tab rail — the mobile-only counterpart to the desktop Sidebar,
 * giving web the same one-thumb navigation shape as the app instead of
 * requiring the hamburger drawer for every switch. Hidden at `lg` where the
 * sidebar takes over.
 */
export const MobileTabRail = ({ activePath }: { activePath: string }) => {
  const { totalCount, clearCart } = useCart();
  const { user } = useDashboardContext();
  const { signOut, loggingOut } = useLogout({ onBeforeLogout: clearCart });
  const [moreOpen, setMoreOpen] = useState(false);

  const userLabel = user.displayName ?? user.email;
  const userInitials = buildInitials(userLabel ?? "U");
  const userAvatar = typeof user.avatarUrl === "string" ? user.avatarUrl : undefined;

  const isTabActive = (tab: TabItem) => (tab.href === "/dashboard" ? activePath === tab.href : activePath.startsWith(tab.href));
  const isMoreActive = !TABS.some(isTabActive);

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
        {TABS.map((tab) => {
          const isActive = isTabActive(tab);
          const badge = tab.id === "products" ? totalCount : 0;

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
                {/* No colored pill behind this icon (unlike Sidebar's active row),
                    so force the primary tint directly instead of NavIcon's
                    white-on-active default, which would render invisible here. */}
                <NavIcon id={tab.id} active={isActive} color={isActive ? "var(--primary)" : undefined} />
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

        {/* More — opens the full nav grid instead of the old hamburger drawer */}
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
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard" ? activePath === item.href : activePath.startsWith(item.href);
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
                  <NavIcon id={item.id} active={isActive} />
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
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={userAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>{userInitials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{userLabel}</p>
            <p className="truncate text-[11px] leading-tight" style={{ color: "var(--medium-gray)" }}>{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => { setMoreOpen(false); void signOut(); }}
            disabled={loggingOut}
            className="flex-shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: "#DC2626" }}
          >
            {loggingOut ? "Signing out…" : "Sign out"}
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
