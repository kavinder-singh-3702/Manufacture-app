"use client";

import Link from "next/link";
import { useCart } from "@/src/providers/CartProvider";
import { NavIcon } from "./Navigation";

type TabItem = {
  id: string;
  label: string;
  href: string;
};

// Mirrors the app's user-role bottom tab set (app-frontend/src/navigation/routes.ts):
// Home, Shop, Services, Accounts, Profile. Reuses NavIcon from Navigation.tsx
// so tab glyphs are defined exactly once for both the sidebar and this rail.
const TABS: TabItem[] = [
  { id: "overview",   label: "Home",     href: "/dashboard" },
  { id: "cart",       label: "Shop",     href: "/dashboard/cart" },
  { id: "services",   label: "Services", href: "/dashboard/services" },
  { id: "accounting", label: "Accounts", href: "/dashboard/accounting" },
  { id: "profile",    label: "Profile",  href: "/dashboard/profile" },
];

/**
 * Fixed bottom tab rail — the mobile-only counterpart to the desktop Sidebar,
 * giving web the same one-thumb navigation shape as the app instead of
 * requiring the hamburger drawer for every switch. Hidden at `lg` where the
 * sidebar takes over.
 */
export const MobileTabRail = ({ activePath }: { activePath: string }) => {
  const { totalCount } = useCart();

  return (
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
        const isActive = tab.href === "/dashboard" ? activePath === tab.href : activePath.startsWith(tab.href);
        const badge = tab.id === "cart" ? totalCount : 0;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
          >
            {isActive && (
              <span
                className="absolute top-0 h-[3px] w-6 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
                aria-hidden
              />
            )}
            <span className="relative">
              <NavIcon id={tab.id} active={isActive} />
              {badge > 0 && (
                <span
                  className="absolute -right-2 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8px] font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            <span
              className="text-[10px] font-semibold leading-tight"
              style={{ color: isActive ? "var(--primary)" : "var(--medium-gray)" }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
