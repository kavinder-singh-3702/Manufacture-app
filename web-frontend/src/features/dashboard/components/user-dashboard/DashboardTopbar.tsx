import { useState } from "react";
import { motion } from "framer-motion";
import { buildInitials, resolveCompanyLabel } from "./helpers";
import type { AuthUser } from "@/src/types/auth";
import type { Company } from "@/src/types/company";

export const DashboardTopbar = ({
  user,
  activeCompany,
  companies,
  switchingCompanyId,
  onToggleSidebar,
  notificationCount = 0,
  onOpenNotifications,
  onProfile,
  onSettings,
  onLogout,
  onOpenCompanyCreate,
  onSwitchCompany,
}: {
  user: AuthUser;
  activeCompany: Company | null;
  companies: Company[];
  switchingCompanyId: string | null;
  onToggleSidebar: () => void;
  notificationCount?: number;
  onOpenNotifications: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onOpenCompanyCreate: () => void;
  onSwitchCompany: (companyId: string) => Promise<void>;
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const companyLabel = activeCompany?.displayName ?? resolveCompanyLabel(user);
  const companyMeta = activeCompany?.type ?? "normal";
  const complianceLabel = activeCompany?.complianceStatus ?? user.status ?? "pending";
  const companyLogo = activeCompany?.logoUrl;
  const companyInitials = buildInitials(companyLabel);
  const userAvatar = typeof user.avatarUrl === "string" ? user.avatarUrl : undefined;
  const userInitials = buildInitials(user.displayName ?? user.email);

  const handleUserMenuSelect = async (action: () => void | Promise<void>) => {
    await action();
    setUserMenuOpen(false);
  };

  return (
    <motion.header
      className="relative flex flex-col gap-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-lg shadow-[#5a304212] lg:flex-row lg:items-center lg:justify-between"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] text-[#5a3042] lg:hidden"
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Dashboard
          </p>
          <p className="text-lg font-semibold text-[#2e1f2c]">{companyLabel}</p>
          <p className="text-xs text-[#7a5d6b]">Type: {companyMeta} • Compliance: {complianceLabel}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 7.5-7.5 7.5 7.5 0 0 1-7.5 7.5z"
              stroke="#b98b9e"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            placeholder="Search companies and workspace"
            className="w-full bg-transparent text-sm text-[#2e1f2c] placeholder:text-[#b98b9e] focus:outline-none"
          />
        </div>
        <motion.div
          className="relative flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] text-[#5c4451] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-plum)] hover:shadow-md"
              aria-label="Open notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M18 14v-3a6 6 0 1 0-12 0v3l-1.5 3H19.5L18 14z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {notificationCount > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-w-[24px] items-center justify-center rounded-full bg-[var(--color-plum)] px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
                  {notificationCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setCompanyMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-2 text-sm font-semibold text-[#2e1f2c] shadow-sm hover:shadow-md"
            >
              {companyLogo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companyLogo}
                    alt={companyLabel}
                    className="h-8 w-8 rounded-full border border-[var(--border-soft)] object-cover"
                  />
                </>
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-peach)] text-xs font-semibold text-[var(--color-plum)]">
                  {companyInitials}
                </span>
              )}
              <span className="text-left leading-tight">
                <span className="block text-[13px]">{companyLabel}</span>
                <span className="block text-[11px] text-[#7a5d6b] capitalize">
                  {companyMeta} • {complianceLabel}
                </span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#7a5d6b]">
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-peach)] text-sm font-semibold text-[var(--color-plum)]"
              aria-label="Open profile menu"
            >
              {userAvatar ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={userAvatar} alt={user.displayName ?? user.email ?? "User"} className="h-11 w-11 rounded-2xl object-cover" />
                </>
              ) : (
                userInitials
              )}
            </button>
          </div>
          {userMenuOpen ? (
            <div className="absolute right-0 top-14 z-10 w-48 rounded-2xl border border-[var(--border-soft)] bg-white p-2 shadow-lg shadow-[#5a304222]">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-plum)" }}>
                Workspace
              </p>
              <button
                onClick={() => handleUserMenuSelect(onProfile)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#2e1f2c] hover:bg-[var(--color-peach)]/60"
              >
                Profile
              </button>
              <button
                onClick={() => handleUserMenuSelect(onSettings)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#2e1f2c] hover:bg-[var(--color-peach)]/60"
              >
                Settings
              </button>
              <button
                onClick={() => handleUserMenuSelect(onLogout)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#b23a48] hover:bg-[#ffeef1]"
              >
                Logout
              </button>
            </div>
          ) : null}
        </motion.div>
      </div>
      {companyMenuOpen ? (
        <div className="absolute right-24 top-24 z-20 w-full max-w-md rounded-3xl border border-[var(--border-soft)] bg-white p-3 shadow-2xl shadow-[#5a304228]">
          <div className="flex items-center justify-between px-2 pb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                Switch company
              </p>
              <p className="text-[12px] text-[#7a5d6b]">Select or create a workspace linked to your login.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCompanyMenuOpen(false);
                  onOpenCompanyCreate();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-2xl border border-[var(--border-soft)] text-[#5c4451] hover:border-[var(--color-plum)]"
                aria-label="Create company"
              >
                +
              </button>
              <button
                onClick={() => setCompanyMenuOpen(false)}
                className="h-8 w-8 rounded-2xl border border-[var(--border-soft)] text-[#5c4451]"
                aria-label="Close company switcher"
              >
                ×
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {companies.map((company) => {
              const isActive = company.id === activeCompany?.id;
              return (
                <button
                  key={company.id}
                  onClick={async () => {
                    setCompanyMenuOpen(false);
                    await onSwitchCompany(company.id);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-soft)] px-3 py-2 text-left transition hover:border-[var(--color-plum)] hover:shadow-lg"
                  style={{
                    background: isActive ? "linear-gradient(135deg, #fff6ef, #ffe9f2)" : "white",
                  }}
                  disabled={switchingCompanyId === company.id}
                >
                  <div className="flex items-center gap-3">
                    {company.logoUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={company.logoUrl}
                          alt={company.displayName}
                          className="h-9 w-9 rounded-full border border-[var(--border-soft)] object-cover"
                        />
                      </>
                    ) : (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-peach)] text-xs font-semibold text-[var(--color-plum)]">
                        {buildInitials(company.displayName)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#2e1f2c]">{company.displayName}</p>
                      <p className="text-[11px] text-[#7a5d6b] capitalize">
                        {company.type ?? "normal"} • {company.complianceStatus ?? "pending"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      isActive ? "bg-[var(--color-peach)] text-[var(--color-plum)]" : "bg-[var(--surface-muted)] text-[#5c4451]"
                    }`}
                  >
                    {switchingCompanyId === company.id ? "Switching…" : isActive ? "Active" : "Switch"}
                  </span>
                </button>
              );
            })}
            {!companies.length ? (
              <p className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[#5c4451]">
                No companies linked yet. Create one in the workspace section below.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.header>
  );
};
