"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/src/providers/CartProvider";
import { Sheet } from "@/src/components/ui/Sheet";
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
const TABS: TabItem[] = [
  { id: "overview",   label: "Home",     href: "/dashboard" },
  { id: "products",   label: "Shop",     href: "/dashboard/products" },
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
  const { totalCount } = useCart();
  const [moreOpen, setMoreOpen] = useState(false);

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
