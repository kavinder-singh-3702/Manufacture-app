"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardContext } from "./context";
import { buildInitials, resolveCompanyLabel } from "./helpers";

export const navItems = [
  { id: "overview",      label: "Overview",      description: "Workspace snapshot",  href: "/dashboard" },
  { id: "company",       label: "Company",        description: "Profile & details",   href: "/dashboard/company" },
  { id: "activity",      label: "Activity",       description: "Recent timeline",     href: "/dashboard/activity" },
  { id: "notifications", label: "Notifications",  description: "Alerts & updates",    href: "/dashboard/notifications" },
  { id: "settings",      label: "Settings",       description: "Account settings",    href: "/dashboard/settings" },
] as const;

type NavId = (typeof navItems)[number]["id"];

const NavIcon = ({ id, active }: { id: NavId; active: boolean }) => {
  const color = active ? "#fff" : "var(--medium-gray)";
  switch (id) {
    case "overview":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
        </svg>
      );
    case "company":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4M7 17h1M16 17h1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "activity":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12h3l2-6 4 12 2-6h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 14v-3a6 6 0 1 0-12 0v3l-1.5 3H19.5L18 14z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
};

type SidebarContentProps = {
  activePath: string;
  onNavigate: () => void;
  onOpenCompanyCreate: () => void;
  onSwitchCompany: (id: string) => Promise<void>;
  switchingCompanyId: string | null;
  onLogout: () => void;
};

const SidebarContent = ({
  activePath,
  onNavigate,
  onOpenCompanyCreate,
  onSwitchCompany,
  switchingCompanyId,
  onLogout,
}: SidebarContentProps) => {
  const [companySwitcherOpen, setCompanySwitcherOpen] = useState(false);
  const { user, activeCompany, companies } = useDashboardContext();

  const companyLabel = activeCompany?.displayName ?? resolveCompanyLabel(user);
  const companyInitials = buildInitials(companyLabel);
  const userInitials = buildInitials(user.displayName ?? user.email ?? "U");
  const userAvatar = typeof user.avatarUrl === "string" ? user.avatarUrl : undefined;
  const companyLogo = activeCompany?.logoUrl;

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg, #148DB2 0%, #0F6E8C 100%)", boxShadow: "0 3px 10px rgba(20,141,178,0.35)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>Manufacture</p>
          <p className="text-[11px] leading-tight" style={{ color: "var(--medium-gray)" }}>Command Center</p>
        </div>
      </div>

      {/* ── Company switcher ──────────────────────────────────────── */}
      <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <button
          type="button"
          onClick={() => setCompanySwitcherOpen((p) => !p)}
          className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--primary-light)", border: "1px solid rgba(20,141,178,0.15)" }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold"
            style={{ backgroundColor: "var(--primary)", color: "#fff" }}
          >
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={companyLogo} alt={companyLabel} className="h-full w-full object-cover" />
            ) : (
              companyInitials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{companyLabel}</p>
            <p className="text-[11px] capitalize" style={{ color: "var(--medium-gray)" }}>
              {activeCompany?.complianceStatus ?? "pending"}
            </p>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            className="flex-shrink-0 transition-transform"
            style={{ color: "var(--medium-gray)", transform: companySwitcherOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <AnimatePresence>
          {companySwitcherOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-2 overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
            >
              {companies.map((company) => {
                const isActive = company.id === activeCompany?.id;
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={async () => {
                      setCompanySwitcherOpen(false);
                      await onSwitchCompany(company.id);
                    }}
                    disabled={switchingCompanyId === company.id}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: isActive ? "var(--primary-light)" : "transparent" }}
                  >
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                      style={{
                        backgroundColor: isActive ? "var(--primary)" : "var(--background)",
                        color: isActive ? "#fff" : "var(--medium-gray)",
                        border: isActive ? "none" : "1px solid var(--border)",
                      }}
                    >
                      {buildInitials(company.displayName)}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                      {switchingCompanyId === company.id ? "Switching…" : company.displayName}
                    </p>
                    {isActive && (
                      <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                    )}
                  </button>
                );
              })}
              {!companies.length && (
                <p className="px-3 py-2.5 text-[12px]" style={{ color: "var(--medium-gray)" }}>No companies yet.</p>
              )}
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => { setCompanySwitcherOpen(false); onOpenCompanyCreate(); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold transition-opacity hover:opacity-80"
                  style={{ color: "var(--primary)" }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-base"
                    style={{ backgroundColor: "var(--primary-light)" }}
                  >
                    +
                  </span>
                  Add company
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--medium-gray)" }}>
          Workspace
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = activePath === item.href || (item.href !== "/dashboard" && activePath.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--primary)" : "transparent",
                  textDecoration: "none",
                }}
              >
                <span
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all"
                  style={{
                    backgroundColor: isActive ? "rgba(255,255,255,0.18)" : "var(--background)",
                    border: isActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--border)",
                  }}
                >
                  <NavIcon id={item.id} active={isActive} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[13px] font-semibold leading-tight"
                    style={{ color: isActive ? "#fff" : "var(--foreground)" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-[11px] leading-tight"
                    style={{ color: isActive ? "rgba(255,255,255,0.65)" : "var(--medium-gray)" }}
                  >
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── User section ─────────────────────────────────────────── */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div
          className="flex items-center gap-2.5 rounded-xl p-2.5"
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: "var(--primary-light)" }}
          >
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[13px] font-bold" style={{ color: "var(--primary)" }}>{userInitials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
              {user.displayName ?? user.email}
            </p>
            <p className="truncate text-[11px] leading-tight" style={{ color: "var(--medium-gray)" }}>{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
            style={{ color: "var(--medium-gray)" }}
            aria-label="Logout"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export type SidebarProps = Omit<SidebarContentProps, "onNavigate"> & { isOpen: boolean; onClose: () => void };

export const Sidebar = ({ activePath, isOpen, onClose, onOpenCompanyCreate, onSwitchCompany, switchingCompanyId, onLogout }: SidebarProps) => (
  <>
    {/* Mobile overlay */}
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-40 w-64 lg:hidden"
            style={{ backgroundColor: "var(--surface)", borderRight: "1px solid var(--border)" }}
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            <SidebarContent
              activePath={activePath}
              onNavigate={onClose}
              onOpenCompanyCreate={onOpenCompanyCreate}
              onSwitchCompany={onSwitchCompany}
              switchingCompanyId={switchingCompanyId}
              onLogout={onLogout}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>

    {/* Desktop sidebar */}
    <aside
      className="hidden lg:flex lg:flex-col"
      style={{
        width: 260,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        borderRight: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        overflowY: "auto",
      }}
    >
      <SidebarContent
        activePath={activePath}
        onNavigate={() => {}}
        onOpenCompanyCreate={onOpenCompanyCreate}
        onSwitchCompany={onSwitchCompany}
        switchingCompanyId={switchingCompanyId}
        onLogout={onLogout}
      />
    </aside>
  </>
);
