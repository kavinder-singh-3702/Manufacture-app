"use client";

import { motion } from "framer-motion";
import type { ProductStats } from "@/src/types/product";
import { formatCurrency } from "../utils/categories";

const item = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay, ease: [0.22, 1, 0.36, 1] },
});

const STAT_ICON = {
  inventory: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 8 12 3 3 8m18 0v8l-9 5m9-13L12 13m0 0L3 8m9 5v8m0 0L3 16V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 3 9 16H3l9-16zm0 6v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  empty: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m6 6 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  cash: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 9v.01M18 15v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

export const ProductsStatsHero = ({
  stats,
  loading,
  onCreate,
}: {
  stats: ProductStats | null;
  loading: boolean;
  onCreate: () => void;
}) => {
  const cards = [
    {
      key: "items",
      label: "Total products",
      value: stats?.totalItems ?? 0,
      detail: `${stats?.totalQuantity ?? 0} units across catalog`,
      icon: STAT_ICON.inventory,
      colors: { bg: "#E8F6FB", text: "#0F6E8C", accent: "#148DB2" },
    },
    {
      key: "low",
      label: "Low stock",
      value: stats?.lowStockCount ?? 0,
      detail: "Items needing replenishment",
      icon: STAT_ICON.warning,
      colors: { bg: "#FEF3C7", text: "#92400E", accent: "#F59E0B" },
    },
    {
      key: "out",
      label: "Out of stock",
      value: stats?.outOfStockCount ?? 0,
      detail: "Hidden from buyers",
      icon: STAT_ICON.empty,
      colors: { bg: "#FEE2E2", text: "#991B1B", accent: "#EF4444" },
    },
    {
      key: "value",
      label: "Catalog value",
      value: formatCurrency(stats?.totalSellingValue ?? 0),
      detail: `Cost: ${formatCurrency(stats?.totalCostValue ?? 0)}`,
      icon: STAT_ICON.cash,
      colors: { bg: "#EDE9FE", text: "#5B21B6", accent: "#7C3AED" },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        {...item(0)}
        className="relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6 md:flex-row md:items-center md:justify-between md:p-8"
        style={{ background: "linear-gradient(135deg, #148DB2 0%, #0F6E8C 50%, #0D5A74 100%)" }}
      >
        {/* Decorative */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-[0.10]" style={{ backgroundColor: "#fff" }} />
        <div className="pointer-events-none absolute -bottom-12 right-32 h-32 w-32 rounded-full opacity-[0.06]" style={{ backgroundColor: "#fff" }} />

        <div className="relative space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Catalog</p>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Products</h1>
          <p className="text-sm text-white/70">Manage your full product catalog and stock levels.</p>
        </div>

        <motion.button
          type="button"
          onClick={onCreate}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-opacity"
          style={{ backgroundColor: "#D5616D", color: "#fff", boxShadow: "0 6px 20px rgba(213,97,109,0.40)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          New product
        </motion.button>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.key}
            {...item(0.05 + i * 0.05)}
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: card.colors.accent }}
            />
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: card.colors.text }}>
                {card.label}
              </p>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: card.colors.bg, color: card.colors.text }}
              >
                {card.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded-md" style={{ backgroundColor: "var(--border)" }} /> : card.value}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>{card.detail}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
