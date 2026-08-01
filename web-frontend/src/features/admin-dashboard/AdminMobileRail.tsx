"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useLogout } from "@/src/hooks/useLogout";
import { MobileNavRail, type MobileNavRailTab } from "../dashboard/components/shared/MobileNavRail";
import { AdminNavIcon } from "./AdminNavIcon";
import { adminNavItems } from "./adminNavItems";

// The 4 most-used admin destinations for the bottom bar: Overview (landing
// page), Verification queue and Users are the daily-driver moderation
// screens, and Orders pipeline is the other high-traffic queue. Everything
// else (Companies, In-house products, Ops console, Product inquiries,
// Notification studio, Ad studio) is one tap away via "More" — same split
// the user dashboard's MobileTabRail makes (4 primary tabs + full grid).
const PRIMARY_TAB_IDS = new Set(["overview", "verification", "users", "orders"]);

/**
 * Admin console's mobile-only counterpart to the desktop topbar + static
 * sidebar box, giving the admin console the same one-thumb bottom-rail
 * navigation as the user dashboard (MobileTabRail) instead of a hamburger
 * drawer. Hidden at `lg`, where AdminFrame's desktop shell takes over.
 *
 * Thin role-specific wrapper around the shared MobileNavRail, mirroring how
 * MobileTabRail wraps it for the user dashboard.
 */
export const AdminMobileRail = ({ activePath }: { activePath: string }) => {
  const { user } = useAuth();
  const { signOut, loggingOut } = useLogout();

  const tabs: MobileNavRailTab[] = adminNavItems.filter((item) => PRIMARY_TAB_IDS.has(item.id));

  return (
    <MobileNavRail
      activePath={activePath}
      rootHref="/admin"
      tabs={tabs}
      allItems={adminNavItems}
      renderIcon={(id, active, color) => <AdminNavIcon id={id} active={active} color={color} />}
      user={{
        name: user?.displayName ?? user?.email ?? "Admin",
        email: user?.email,
        avatarUrl: typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined,
      }}
      onSignOut={() => { void signOut(); }}
      signingOut={loggingOut}
    />
  );
};
