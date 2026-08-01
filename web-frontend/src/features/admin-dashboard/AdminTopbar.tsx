"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { resolveActiveId } from "@/src/features/dashboard/components/user-dashboard/Navigation";
import { adminNavItems } from "./adminNavItems";

// Mirrors DashboardTopbar's getPageTitle pattern, but resolved via the same
// longest-prefix `resolveActiveId` the sidebar and mobile rail already use —
// so all three surfaces agree on which nav item is "active" for a given
// path instead of each re-deriving it slightly differently.
const getPageTitle = (pathname: string) => {
  const activeId = resolveActiveId(pathname, adminNavItems, "/admin");
  return adminNavItems.find((item) => item.id === activeId)?.label ?? "Admin console";
};

/**
 * Admin console's desktop topbar — sticky, title derived from the active
 * nav item. Account/logout moved to AdminSidebar's bottom band, so this is
 * just title + the quick-search that used to share the old topbar with the
 * account menu dropdown.
 */
export const AdminTopbar = ({ activePath }: { activePath: string }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const label = getPageTitle(activePath);
  const q = query.trim().toLowerCase();
  const matches = q ? adminNavItems.filter((i) => i.label.toLowerCase().includes(q)) : [];

  const go = (href: string) => {
    setQuery("");
    setSearchFocused(false);
    router.push(href);
  };

  return (
    <motion.header
      className="dashboard-topbar sticky top-0 z-20 flex flex-shrink-0 items-center justify-between gap-4 px-4 sm:px-6"
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
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-bold leading-tight sm:text-[16px]" style={{ color: "var(--foreground)" }}>
          {label}
        </h1>
      </div>

      {/* Quick-search — jump to a section by label. */}
      <div className="relative w-40 flex-shrink-0 sm:w-56 lg:w-64">
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-1.5"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0">
            <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 7.5-7.5 7.5 7.5 0 0 1-7.5 7.5z" stroke="var(--medium-gray)" strokeWidth="1.6" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) go(matches[0].href); }}
            placeholder="Jump to a section…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--medium-gray)]"
            style={{ color: "var(--foreground)" }}
          />
        </div>
        <AnimatePresence>
          {searchFocused && matches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl shadow-2xl"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
            >
              {matches.map((m) => (
                <button
                  key={m.id}
                  onMouseDown={() => go(m.href)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-[var(--background)]"
                  style={{ color: "var(--foreground)" }}
                >
                  {m.label}
                  <span className="text-xs" style={{ color: "var(--medium-gray)" }}>↵</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
