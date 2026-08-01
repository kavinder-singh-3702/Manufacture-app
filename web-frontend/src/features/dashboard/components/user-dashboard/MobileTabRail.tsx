"use client";

import { useCart } from "@/src/providers/CartProvider";
import { useLogout } from "@/src/hooks/useLogout";
import { useDashboardContext } from "./context";
import { navItems, NavIcon } from "./Navigation";
import { MobileNavRail, type MobileNavRailTab } from "../shared/MobileNavRail";

/**
 * Fixed bottom tab rail — the mobile-only counterpart to the desktop Sidebar,
 * giving web the same one-thumb navigation shape as the app instead of
 * requiring the hamburger drawer for every switch. Hidden at `lg` where the
 * sidebar takes over.
 *
 * Thin role-specific wrapper around the shared MobileNavRail: supplies the
 * user's tabs/icons/nav list/account, all the fixed-bar markup and "More"
 * sheet logic lives in MobileNavRail so the admin console can reuse it
 * (AdminMobileRail) without duplicating any of it.
 */
export const MobileTabRail = ({ activePath }: { activePath: string }) => {
  const { totalCount, clearCart } = useCart();
  const { user } = useDashboardContext();
  const { signOut, loggingOut } = useLogout({ onBeforeLogout: clearCart });

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
  const tabs: MobileNavRailTab[] = [
    { id: "overview",   label: "Home",     href: "/dashboard" },
    { id: "products",   label: "Shop",     href: "/dashboard/shop", badge: totalCount },
    { id: "services",   label: "Services", href: "/dashboard/services" },
    { id: "accounting", label: "Accounts", href: "/dashboard/accounting" },
  ];

  const userLabel = user.displayName ?? user.email;

  return (
    <MobileNavRail
      activePath={activePath}
      rootHref="/dashboard"
      tabs={tabs}
      allItems={navItems}
      renderIcon={(id, active, color) => <NavIcon id={id} active={active} color={color} />}
      user={{
        name: userLabel,
        email: user.email,
        avatarUrl: typeof user.avatarUrl === "string" ? user.avatarUrl : undefined,
      }}
      onSignOut={() => { void signOut(); }}
      signingOut={loggingOut}
    />
  );
};
