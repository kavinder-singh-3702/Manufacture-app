"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { navItems } from "./Navigation";
import { useDashboardContext } from "./context";
import { buildInitials } from "./helpers";
import { useCart } from "@/src/providers/CartProvider";
import { CartDrawer } from "@/src/features/cart/components/CartDrawer";
import { useThemeMode } from "@/src/providers/ThemeProvider";
import { SearchBar, buildSearchHref } from "@/src/features/search";

const getPageTitle = (pathname: string) => {
  const item = navItems.find(
    (n) => n.href === pathname || (n.href !== "/dashboard" && pathname.startsWith(n.href))
  );
  return item?.label ?? "Dashboard";
};

export const DashboardTopbar = ({
  notificationCount = 0,
  onOpenNotifications,
  onProfile,
}: {
  notificationCount?: number;
  onOpenNotifications: () => void;
  onProfile: () => void;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useDashboardContext();

  const label = getPageTitle(pathname ?? "");
  const userInitials = buildInitials(user.displayName ?? user.email ?? "U");
  const userAvatar = typeof user.avatarUrl === "string" ? user.avatarUrl : undefined;
  const { totalCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const { resolvedMode, setMode } = useThemeMode();

  // Real product search — mirrors the app's HomeToolbar SearchBar
  // (topBarMode: "two_row"), which submits to ProductSearch{initialQuery}.
  const [searchQuery, setSearchQuery] = useState("");
  const submitSearch = (q: string) => {
    router.push(buildSearchHref("dashboard", q));
    setSearchQuery("");
  };

  return (
    <>
    <motion.header
      className="dashboard-topbar sticky top-0 z-30 flex flex-shrink-0 items-center justify-between px-4 sm:px-6"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "color-mix(in srgb, var(--surface) 92%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 1px 0 var(--border)",
      }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Left: page title ──────────────────────────────────────── */}
      {/* No hamburger here anymore — mobile reaches the full nav via
          MobileTabRail's "More" tab, so the drawer this used to open is gone. */}
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-bold leading-tight sm:text-[16px]" style={{ color: "var(--foreground)" }}>
          {label}
        </h1>
      </div>

      {/* ── Right: search + notifications + avatar ────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search — real product search from sm+; collapses onto a second
            row below the header on mobile (see the block after the header). */}
        <SearchBar
          size="sm"
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={submitSearch}
          placeholder="Search products or SKUs"
          aria-label="Search products or SKUs"
          className="hidden w-44 sm:block lg:w-60"
        />

        {/* Theme toggle — reachable from the drawer on mobile, so it's hidden
            below sm to keep the compact bar from crowding at 390px. */}
        <button
          type="button"
          onClick={() => setMode(resolvedMode === "dark" ? "light" : "dark")}
          className="hidden h-9 w-9 items-center justify-center rounded-xl transition-opacity hover:opacity-80 sm:flex"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
          aria-label={resolvedMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {resolvedMode === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Cart — the mobile "Shop" tab now goes to the product catalog, not
            the cart (see MobileTabRail), so this needs to stay visible at
            every breakpoint instead of hiding below sm. */}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-opacity hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
          aria-label="Shopping cart"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {totalCount > 0 && (
            <motion.span
              key={totalCount}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {totalCount > 99 ? "99+" : totalCount}
            </motion.span>
          )}
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-opacity hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
          aria-label="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 14v-3a6 6 0 1 0-12 0v3l-1.5 3H19.5L18 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {notificationCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {notificationCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px" style={{ backgroundColor: "var(--border)" }} />

        {/* User avatar */}
        <button
          type="button"
          onClick={onProfile}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--primary-light)",
            border: "1.5px solid rgba(20,141,178,0.25)",
          }}
          aria-label="My profile"
        >
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={userAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[12px] font-bold" style={{ color: "var(--primary)" }}>
              {userInitials}
            </span>
          )}
        </button>
      </div>
    </motion.header>

    {/* Second row on mobile — mirrors the app's topBarMode: "two_row"
        (HomeToolbar's SearchBar sits under the title row below `sm`; from
        `sm` the inline pill in the row above takes over instead). */}
    <div
      className="sticky z-20 flex items-center gap-2 border-b px-4 py-2 sm:hidden"
      style={{
        top: "calc(var(--topbar-h) + var(--safe-top))",
        borderColor: "var(--border)",
        backgroundColor: "color-mix(in srgb, var(--surface) 92%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <SearchBar
        size="sm"
        value={searchQuery}
        onChange={setSearchQuery}
        onSubmit={submitSearch}
        placeholder="Search products or SKUs"
        aria-label="Search products or SKUs"
        className="flex-1"
      />
    </div>

    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
  </>
  );
};
