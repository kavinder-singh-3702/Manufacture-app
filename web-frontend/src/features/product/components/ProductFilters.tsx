"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ProductSort, ProductStatus } from "@/src/types/product";
import { PRODUCT_CATEGORIES, getCategoryMeta } from "../utils/categories";

const STATUS_OPTIONS: { value: "" | ProductStatus | "in_stock" | "low_stock" | "out_of_stock"; label: string }[] = [
  { value: "", label: "All status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "inactive", label: "Inactive" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

const SORT_OPTIONS: { value: ProductSort | ""; label: string }[] = [
  { value: "", label: "Newest" },
  { value: "createdAt:asc", label: "Oldest" },
  { value: "priceAsc", label: "Price: low → high" },
  { value: "priceDesc", label: "Price: high → low" },
];

export type FiltersState = {
  search: string;
  category: string;
  status: string;
  sort: ProductSort | "";
  scope: "company" | "marketplace";
};

export const ProductFilters = ({
  value,
  onChange,
  totalResults,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  totalResults?: number;
}) => {
  const [searchDraft, setSearchDraft] = useState(value.search);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== value.search) onChange({ ...value, search: searchDraft });
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  // Sync search if reset externally
  useEffect(() => {
    if (value.search !== searchDraft) setSearchDraft(value.search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.search]);

  const activeCategory = getCategoryMeta(value.category);

  return (
    <div className="space-y-4">
      {/* Top bar — search + scope + sort */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div
          className="flex flex-1 items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search products by name, SKU, description…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--foreground)" }}
          />
          {searchDraft && (
            <button
              type="button"
              onClick={() => setSearchDraft("")}
              className="text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--medium-gray)" }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Scope toggle */}
        <div className="flex rounded-xl p-1" style={{ backgroundColor: "var(--light-gray)" }}>
          {(["company", "marketplace"] as const).map((scope) => {
            const isActive = value.scope === scope;
            return (
              <button
                key={scope}
                type="button"
                onClick={() => onChange({ ...value, scope })}
                className="relative rounded-lg px-4 py-2 text-xs font-semibold transition-colors duration-200"
                style={{ color: isActive ? "var(--primary)" : "var(--medium-gray)" }}
              >
                {isActive && (
                  <motion.span
                    layoutId="scope-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: "var(--surface)", boxShadow: "0 1px 4px rgba(20,141,178,0.12)" }}
                    transition={{ type: "spring", stiffness: 600, damping: 38 }}
                  />
                )}
                <span className="relative z-10">{scope === "company" ? "My Catalog" : "Marketplace"}</span>
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={value.sort}
            onChange={(e) => onChange({ ...value, sort: e.target.value as ProductSort | "" })}
            className="appearance-none rounded-xl py-2.5 pl-3.5 pr-9 text-sm font-medium focus:outline-none"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--medium-gray)" }}>
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value })}
            className="appearance-none rounded-xl py-2.5 pl-3.5 pr-9 text-sm font-medium focus:outline-none"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--medium-gray)" }}>
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Category chips — horizontal scroll */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
          <button
            type="button"
            onClick={() => onChange({ ...value, category: "" })}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
            style={
              !value.category
                ? { backgroundColor: "var(--primary)", color: "#fff", border: "1px solid var(--primary)" }
                : { backgroundColor: "var(--surface)", color: "var(--medium-gray)", border: "1px solid var(--border)" }
            }
          >
            All
          </button>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isActive = value.category === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                onClick={() => onChange({ ...value, category: isActive ? "" : cat.id })}
                whileTap={{ scale: 0.97 }}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={
                  isActive
                    ? { backgroundColor: cat.text, color: "#fff", border: `1px solid ${cat.text}` }
                    : { backgroundColor: cat.bg, color: cat.text, border: `1px solid ${cat.bg}` }
                }
              >
                <span>{cat.icon}</span>
                {cat.title}
              </motion.button>
            );
          })}
        </div>

        {totalResults !== undefined && (
          <p className="hidden flex-shrink-0 text-xs sm:block" style={{ color: "var(--medium-gray)" }}>
            {totalResults} {totalResults === 1 ? "product" : "products"}{activeCategory ? ` in ${activeCategory.title}` : ""}
          </p>
        )}
      </div>
    </div>
  );
};
