import { ReactNode } from "react";
import Link from "next/link";

const ACCOUNTING_NAV = [
  { href: "/dashboard/accounting",                     label: "Dashboard",     icon: "📊" },
  { href: "/dashboard/accounting/tally",               label: "Tally",         icon: "📒" },
  { href: "/dashboard/accounting/tally/transactions",  label: "Transactions",  icon: "📋" },
  { href: "/dashboard/accounting/pnl",                 label: "P&L",           icon: "📈" },
  { href: "/dashboard/accounting/gst",                 label: "GST",           icon: "🧮" },
  { href: "/dashboard/accounting/outstanding",         label: "Outstanding",   icon: "⏳" },
] as const;

// The app has no persistent accounting sub-nav — it navigates from cards on
// the Accounts tab instead. This bar is a desktop-only enhancement on top of
// that same mobile navigation pattern, so it's hidden below `lg`.
export default function AccountingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      {/* Sub-navigation — desktop only */}
      <nav
        className="hidden flex-wrap gap-1 rounded-2xl p-1.5 lg:flex"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        aria-label="Accounting sub-navigation"
      >
        {ACCOUNTING_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
            style={{ color: "var(--foreground)" }}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
