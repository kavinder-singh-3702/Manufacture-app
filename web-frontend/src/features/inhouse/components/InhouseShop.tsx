"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductSort } from "@/src/types/product";
import { getCategoryMeta } from "@/src/features/product/utils/categories";
import { INHOUSE_COPY, INHOUSE_PAGE_SIZE } from "../constants";
import { ALL_CATEGORY_ID, useInhouseCategories, useInhouseProducts } from "../useInhouseProducts";
import { InhouseProductCard } from "./InhouseProductCard";

const SORT_OPTIONS: { value: ProductSort | ""; label: string }[] = [
  { value: "", label: "Newest first" },
  { value: "priceAsc", label: "Price: low → high" },
  { value: "priceDesc", label: "Price: high → low" },
  { value: "ratingDesc", label: "Top rated" },
];

const Skeleton = () => (
  <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
    <div className="h-[3px] w-full" style={{ background: "var(--light-gray)" }} />
    <div className="aspect-[4/3] animate-pulse" style={{ backgroundColor: "var(--light-gray)" }} />
    <div className="space-y-3 p-4">
      <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-6 w-1/3 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
    </div>
  </div>
);

const parsePrice = (v: string): number | undefined => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Full in-house / ARVANN Select catalog page (`/shop`). Web parity for the
 * mobile "Shop" tab (`AdminProductsScreen`): search, sort, price filter,
 * category chips and load-more — all scoped to admin-listed products via the
 * shared {@link useInhouseProducts} hook.
 */
export const InhouseShop = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY_ID);
  const [sort, setSort] = useState<ProductSort | "">("");
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  // Debounce search + price so typing doesn't spam the API.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 320);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => {
    const t = setTimeout(() => {
      setMinPrice(parsePrice(minInput));
      setMaxPrice(parsePrice(maxInput));
    }, 400);
    return () => clearTimeout(t);
  }, [minInput, maxInput]);

  const { categories } = useInhouseCategories();
  const { products, total, loading, loadingMore, error, hasMore, loadMore, reload } = useInhouseProducts({
    limit: INHOUSE_PAGE_SIZE,
    search,
    category: category === ALL_CATEGORY_ID ? "" : category,
    sort,
    minPrice,
    maxPrice,
  });

  const hasFilters = Boolean(search || category !== ALL_CATEGORY_ID || sort || minPrice || maxPrice);
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory(ALL_CATEGORY_ID);
    setSort("");
    setMinInput("");
    setMaxInput("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
  };

  const activeCat = useMemo(() => (category !== ALL_CATEGORY_ID ? getCategoryMeta(category) : undefined), [category]);

  return (
    <div>
      {/* Hero */}
      <div
        className="border-b px-6 py-9 lg:px-10"
        style={{ borderColor: "var(--border)", background: "var(--gradient-brand-deep)" }}
      >
        <div className="mx-auto max-w-[1400px]">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            ✦ {INHOUSE_COPY.eyebrow}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">{INHOUSE_COPY.heading}</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/75">{INHOUSE_COPY.subheading}</p>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
        {/* Search + sort + price */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search the in-house catalog…"
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ProductSort | "")}
            className="rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value || "newest"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <input
              value={minInput}
              onChange={(e) => setMinInput(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="Min ₹"
              className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            />
            <span className="text-xs" style={{ color: "var(--medium-gray)" }}>–</span>
            <input
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="Max ₹"
              className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {categories.map((c) => {
              const active = category === c.id;
              const meta = c.id !== ALL_CATEGORY_ID ? getCategoryMeta(c.id) : undefined;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                  style={{
                    backgroundColor: active ? "var(--primary)" : meta ? meta.bg : "var(--surface)",
                    color: active ? "#fff" : meta ? meta.text : "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {meta?.icon} {c.title}
                  {typeof c.count === "number" && (
                    <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : "var(--light-gray)", color: active ? "#fff" : "var(--medium-gray)" }}>
                      {c.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
            >
              <span>{error}</span>
              <button type="button" onClick={reload} className="text-xs font-bold underline">
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="text-5xl">🛍️</div>
            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              No in-house products found
            </p>
            <p className="text-center text-sm" style={{ color: "var(--medium-gray)" }}>
              {hasFilters ? "Try adjusting your filters." : "Check back soon — new products are added regularly."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: "var(--primary)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>
              {total.toLocaleString("en-IN")} product{total !== 1 ? "s" : ""}
              {activeCat ? ` in ${activeCat.title}` : ""}
              {search ? ` matching "${search}"` : ""}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => (
                <InhouseProductCard key={p._id} product={p} index={i} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                >
                  {loadingMore ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" /> Loading…
                    </>
                  ) : (
                    "Load more products"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
