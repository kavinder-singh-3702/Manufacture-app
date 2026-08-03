"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ACCOUNTING_NAV = [
  { href: "/dashboard/accounting/quick-entry",         label: "Quick Entry",     icon: "⚡" },
  { href: "/dashboard/accounting/overview",            label: "Overview",        icon: "📊" },
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
  const scrollerRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Below `lg` the pill row scrolls but has no scrollbar (scrollbarWidth:
  // none), so there was zero signal that "Working Capital" through
  // "Outstanding" sit off-screen to the right. Edge fades + a chevron give a
  // minimal affordance without adding visible buttons; they track actual
  // scroll position so they disappear once there's nothing left to reveal.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative lg:overflow-visible">
        <nav
          ref={scrollerRef}
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
        {canScrollLeft && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 flex w-8 items-center justify-start rounded-l-2xl lg:hidden"
            style={{ background: "linear-gradient(to right, var(--card), transparent)" }}
          >
            <span className="pl-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>‹</span>
          </div>
        )}
        {canScrollRight && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 flex w-8 items-center justify-end rounded-r-2xl lg:hidden"
            style={{ background: "linear-gradient(to left, var(--card), transparent)" }}
          >
            <span className="pr-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>›</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
