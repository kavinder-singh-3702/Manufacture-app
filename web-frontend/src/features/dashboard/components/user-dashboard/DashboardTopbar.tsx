"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navItems } from "./Navigation";
import { useDashboardContext } from "./context";
import { buildInitials } from "./helpers";

const getPageTitle = (pathname: string) => {
  const item = navItems.find(
    (n) => n.href === pathname || (n.href !== "/dashboard" && pathname.startsWith(n.href))
  );
  return { label: item?.label ?? "Dashboard", description: item?.description ?? "Workspace" };
};

export const DashboardTopbar = ({
  onToggleSidebar,
  notificationCount = 0,
  onOpenNotifications,
  onProfile,
}: {
  onToggleSidebar: () => void;
  notificationCount?: number;
  onOpenNotifications: () => void;
  onProfile: () => void;
}) => {
  const pathname = usePathname();
  const { user } = useDashboardContext();

  const { label, description } = getPageTitle(pathname ?? "");
  const userInitials = buildInitials(user.displayName ?? user.email ?? "U");
  const userAvatar = typeof user.avatarUrl === "string" ? user.avatarUrl : undefined;

  return (
    <motion.header
      className="flex h-16 flex-shrink-0 items-center justify-between px-6"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "0 1px 0 var(--border)",
      }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Left: mobile toggle + page title ─────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl lg:hidden"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--background)" }}
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div>
          <h1 className="text-[16px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            {label}
          </h1>
          <p className="text-[11px] leading-tight" style={{ color: "var(--medium-gray)" }}>
            {description}
          </p>
        </div>
      </div>

      {/* ── Right: search + notifications + avatar ────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search pill — decorative, full search can be added later */}
        <button
          type="button"
          className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm transition-opacity hover:opacity-80 sm:flex"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--background)",
            color: "var(--medium-gray)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="text-[13px]">Search…</span>
          <kbd
            className="ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: "var(--border)", color: "var(--medium-gray)" }}
          >
            ⌘K
          </kbd>
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
            <img src={userAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[12px] font-bold" style={{ color: "var(--primary)" }}>
              {userInitials}
            </span>
          )}
        </button>
      </div>
    </motion.header>
  );
};
