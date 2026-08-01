"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ACCOUNTING_NAV = [
  { href: "/dashboard/accounting",                    label: "Overview",        icon: "📊" },
  { href: "/dashboard/accounting/quick-entry",         label: "Quick Entry",     icon: "⚡" },
  { href: "/dashboard/accounting/working-capital",     label: "Working Capital", icon: "⚖️" },
  { href: "/dashboard/accounting/stock",               label: "Stock",           icon: "📦" },
  { href: "/dashboard/accounting/internal-stock",      label: "Internal Stock",  icon: "🏷️" },
  { href: "/dashboard/accounting/tally",               label: "Tally",           icon: "📒" },
  { href: "/dashboard/accounting/tally/transactions",  label: "Transactions",    icon: "📋" },
  { href: "/dashboard/accounting/pnl",                 label: "P&L",             icon: "📈" },
  { href: "/dashboard/accounting/gst",                 label: "GST",             icon: "🧮" },
  { href: "/dashboard/accounting/outstanding",         label: "Outstanding",     icon: "⏳" },
] as const;

/** Is `pathname` on `item`, accounting for the Tally/Transactions overlap
 *  (Tally's voucher-creation sub-routes like /tally/sales should highlight
 *  "Tally", but /tally/transactions has its own nav entry). */
const isActive = (pathname: string | null, item: (typeof ACCOUNTING_NAV)[number]): boolean => {
  if (!pathname) return false;
  if (pathname === item.href) return true;
  if (item.href === "/dashboard/accounting") return false;
  if (item.href === "/dashboard/accounting/tally") {
    return pathname.startsWith(`${item.href}/`) && !pathname.startsWith("/dashboard/accounting/tally/transactions");
  }
  return pathname.startsWith(`${item.href}/`);
};

/**
 * Persistent accounting sub-nav. Now that the overview page has been split
 * into single-purpose routes (quick entry, working capital, stock signals,
 * internal stock — see AccountingDashboard.tsx), this bar is the primary way
 * to move between them, so it has to work on mobile too — it's a
 * horizontally scrollable pill row below `lg` (same pattern as
 * `SectionNav.tsx`) and wraps into a full row at `lg`+.
 */
export default function AccountingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav
        aria-label="Accounting sub-navigation"
        className="flex gap-1 overflow-x-auto rounded-2xl p-1.5 lg:flex-wrap"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", scrollbarWidth: "none" }}
      >
        {ACCOUNTING_NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
              style={{
                backgroundColor: active ? "var(--primary)" : "transparent",
                color: active ? "#fff" : "var(--foreground)",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
