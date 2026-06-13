"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useDashboardContext } from "./context";
import { buildInitials, resolveCompanyLabel } from "./helpers";
import { BrandWordmark } from "@/src/components/BrandLogo";

type NavItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  soon?: boolean;
};

const workspaceNav: NavItem[] = [
  { id: "overview",      label: "Overview",      description: "Workspace snapshot",  href: "/dashboard" },
  { id: "products",      label: "Products",      description: "Catalog & stock",     href: "/dashboard/products" },
  { id: "company",       label: "Company",       description: "Profile & details",   href: "/dashboard/company" },
  { id: "profile",       label: "Profile",       description: "Your account",        href: "/dashboard/profile" },
  { id: "activity",      label: "Activity",      description: "Recent timeline",     href: "/dashboard/activity" },
  { id: "notifications", label: "Notifications", description: "Alerts & updates",    href: "/dashboard/notifications" },
  { id: "settings",      label: "Settings",      description: "Account settings",    href: "/dashboard/settings" },
];

const modulesNav: NavItem[] = [
  { id: "orders",             label: "My Orders",         description: "Order history",         href: "/dashboard/orders" },
  { id: "cart",               label: "Cart",              description: "Items & checkout",       href: "/dashboard/cart" },
  { id: "accounting",         label: "Accounting",        description: "P&L, GST & reports",    href: "/dashboard/accounting" },
  { id: "services",           label: "Services",          description: "Job-work marketplace",  href: "/dashboard/services" },
  { id: "inventory",          label: "Inventory",         description: "Stock & warehouses",    href: "/dashboard/inventory" },
  { id: "internal-inventory", label: "Internal Stock",    description: "Internal ops tracking", href: "/dashboard/internal-inventory" },
  { id: "quotes",             label: "Quotes",            description: "RFQs & negotiation",    href: "/dashboard/quotes" },
  { id: "chat",               label: "Chat",              description: "Messages & threads",    href: "/dashboard/chat" },
];

export const navItems: ReadonlyArray<NavItem> = [...workspaceNav, ...modulesNav];

type NavId = string;

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
    case "products":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 8 12 3 3 8m18 0v8l-9 5m9-13L12 13m0 0L3 8m9 5v8m0 0L3 16V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
    case "orders":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 8h6m-6 4h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "inventory":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "quotes":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "services":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14.7 6.3a4 4 0 0 1 4.5 5.4l-1.3-1.3a2 2 0 0 0-2.8 2.8l1.3 1.3a4 4 0 0 1-5.4-4.5l-7.3 7.3a1.5 1.5 0 0 0 2.1 2.1l7.3-7.3" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chat":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-8 8 8.6 8.6 0 0 1-3.5-.7L4 21l1.7-5.5A8 8 0 1 1 21 12z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "accounting":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "cart":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "internal-inventory":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth="1.8" />
          <path d="M9 12h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke={color} strokeWidth="1.8" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

const NavGroup = ({
  label,
  items,
  activePath,
  onNavigate,
  className = "",
}: {
  label: string;
  items: NavItem[];
  activePath: string;
  onNavigate: () => void;
  className?: string;
}) => (
  <div className={className}>
    <p
      className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: "var(--medium-gray)" }}
    >
      {label}
    </p>
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive =
          activePath === item.href ||
          (item.href !== "/dashboard" && activePath.startsWith(item.href));
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
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
            {item.soon ? (
              <span
                className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.22)" : "var(--primary-light)",
                  color: isActive ? "#fff" : "var(--primary)",
                  letterSpacing: "0.08em",
                }}
              >
                Soon
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  </div>
);

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
      <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <BrandWordmark height={26} priority />
        <span className="text-[11px] leading-tight" style={{ color: "var(--medium-gray)" }}>Command Center</span>
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
        <NavGroup label="Workspace" items={workspaceNav} activePath={activePath} onNavigate={onNavigate} />
        <NavGroup label="Modules" items={modulesNav} activePath={activePath} onNavigate={onNavigate} className="mt-5" />
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
