"use client";

import Link from "next/link";
import { tintBg } from "@/src/lib/color";
import { PageHeader } from "@/src/components/ui/Surface";
import { AccountingGuard } from "./AccountingGuard";
import { ReportSection } from "./MetricCard";

const QUICK_ENTRIES = [
  { label: "Sales Invoice", desc: "Bill a customer", icon: "🧾", href: "/dashboard/accounting/tally/sales", accent: "var(--success)" },
  { label: "Purchase Bill", desc: "Record a supplier bill", icon: "📋", href: "/dashboard/accounting/tally/purchase", accent: "var(--primary)" },
  { label: "Receipt", desc: "Log money received", icon: "💰", href: "/dashboard/accounting/tally/receipt", accent: "var(--warning)" },
  { label: "Payment", desc: "Log money paid out", icon: "💸", href: "/dashboard/accounting/tally/payment", accent: "var(--accent)" },
];

/**
 * Single purpose: shortcuts to create a voucher. No data fetching — the
 * destinations are static routes, so there's no loading/empty state here.
 */
export const QuickEntryView = () => (
  <AccountingGuard>
    <div className="space-y-6">
      <PageHeader
        title="Quick Entry"
        actions={
          <Link href="/dashboard/internal-inventory?action=add-stock"
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
            + Add stock
          </Link>
        }
      />

      <ReportSection title="Create a voucher" subtitle="Choose a voucher type to get started">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ENTRIES.map((q) => (
            <Link key={q.label} href={q.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-5 text-center transition-all hover:-translate-y-1 hover:shadow-md"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: tintBg(q.accent), color: q.accent }}>{q.icon}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{q.label}</span>
              <span className="text-xs" style={{ color: "var(--medium-gray)" }}>{q.desc}</span>
            </Link>
          ))}
        </div>
      </ReportSection>
    </div>
  </AccountingGuard>
);
