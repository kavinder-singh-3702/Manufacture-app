import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const iconStroke = (active: boolean) => (active ? "var(--color-plum)" : "rgba(67,52,61,0.6)");

export const navItems = [
  { id: "overview", label: "Overview", description: "Workspace snapshot", href: "/dashboard" },
  { id: "company", label: "Company", description: "Profile & details", href: "/dashboard/company" },
  { id: "activity", label: "Activity", description: "Recent timeline", href: "/dashboard/activity" },
  { id: "notifications", label: "Notifications", description: "Alerts & updates", href: "/dashboard/notifications" },
  { id: "settings", label: "Preferences", description: "Notifications & sharing", href: "/dashboard/settings" },
] as const;

export const NavIcon = ({ id, active }: { id: (typeof navItems)[number]["id"]; active: boolean }) => {
  const stroke = iconStroke(active);
  switch (id) {
    case "overview":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 13h4v7H4zM10 4h4v16h-4zM16 9h4v11h-4z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "activity":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 12h3l2-6 4 12 2-6h5"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "company":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4M7 17h1M16 17h1"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "notifications":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 14v-3a6 6 0 1 0-12 0v3l-1.5 3H19.5L18 14z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10 18a2 2 0 0 0 4 0" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6h12v12H6zM10 6V4M14 6V4M10 20v-2M14 20v-2M20 10h2M20 14h-2M4 10H2M4 14h2"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

export const Sidebar = ({
  activePath,
  isOpen,
  onClose,
}: {
  activePath: string;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <>
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-black/35 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-6 left-4 z-40 w-72 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-2xl lg:hidden"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
          >
            <SidebarContent activePath={activePath} onNavigate={onClose} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
    <div className="hidden w-full max-w-xs flex-shrink-0 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-lg shadow-[#5a304218] lg:block">
      <SidebarContent activePath={activePath} onNavigate={onClose} />
    </div>
  </>
);

export const SidebarContent = ({ activePath, onNavigate }: { activePath: string; onNavigate: () => void }) => (
  <div className="space-y-4">
    <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
        Navigate
      </p>
      <p className="mt-1 text-sm text-[#5c4451]">Switch between your workspace tools</p>
    </div>
    <div className="space-y-2">
      {navItems.map((item) => {
        const isActive = activePath === item.href || (item.href === "/dashboard" && activePath === "/dashboard");
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left"
          >
            <span
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                isActive
                  ? "border-[var(--color-plum)] bg-[var(--color-peach)] text-[var(--color-plum)]"
                  : "border-[var(--border-soft)] bg-white/70"
              }`}
            >
              <NavIcon id={item.id} active={isActive} />
            </span>
            <span className="relative z-10">
              <p className={`text-sm font-semibold ${isActive ? "text-[var(--color-plum)]" : "text-[#5c4451]"}`}>
                {item.label}
              </p>
              <p className={`text-xs ${isActive ? "text-[var(--color-plum)]/70" : "text-[#b98b9e]"}`}>{item.description}</p>
            </span>
          </Link>
        );
      })}
    </div>
  </div>
);
