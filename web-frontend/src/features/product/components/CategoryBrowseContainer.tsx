"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import { ApiError, isAbortError } from "@/src/lib/api-error";
import type { Product, ProductSort } from "@/src/types/product";
import { getCategoryMeta, formatCurrency } from "../utils/categories";
import { ProductCard } from "./ProductCard";

const PAGE_SIZE = 24;

type SortOption = { label: string; value: ProductSort | "" };
const SORT_OPTIONS: SortOption[] = [
  { label: "Featured", value: "" },
  { label: "Price: Low to High", value: "priceAsc" },
  { label: "Price: High to Low", value: "priceDesc" },
  { label: "Newest", value: "createdAt:desc" },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay },
});

export const CategoryBrowseContainer = ({ categoryId }: { categoryId: string }) => {
  const cat = getCategoryMeta(categoryId);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<ProductSort | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedMin, setAppliedMin] = useState<number | undefined>();
  const [appliedMax, setAppliedMax] = useState<number | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (mode: "fresh" | "more" = "fresh") => {
    const isFresh = mode === "fresh";
    // Cancel any in-flight load so a superseded sort/filter change doesn't
    // waste backend work or overwrite newer results.
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    try {
      if (isFresh) { setLoading(true); setError(null); }
      else setLoadingMore(true);
      const nextOffset = isFresh ? 0 : offset + PAGE_SIZE;
      const res = await productService.getProductsByCategory(categoryId, {
        limit: PAGE_SIZE,
        offset: nextOffset,
        sort: sort || undefined,
        minPrice: appliedMin,
        maxPrice: appliedMax,
        scope: "marketplace",
        includeVariantSummary: true,
      }, controller.signal);
      setProducts((prev) => isFresh ? res.products : [...prev, ...res.products]);
      setTotal(res.pagination.total);
      setHasMore(res.pagination.hasMore);
      setOffset(nextOffset);
    } catch (err) {
      if (isAbortError(err)) return; // superseded/unmounted — ignore
      if (isFresh) setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products");
    } finally {
      if (loadAbortRef.current === controller) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [categoryId, sort, appliedMin, appliedMax, offset]);

  useEffect(() => {
    setOffset(0);
    void load("fresh");
    return () => loadAbortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, appliedMin, appliedMax, categoryId]);

  const applyPriceFilter = () => {
    const min = minPrice ? parseFloat(minPrice) : undefined;
    const max = maxPrice ? parseFloat(maxPrice) : undefined;
    setAppliedMin(min);
    setAppliedMax(max);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setSort("");
    setMinPrice("");
    setMaxPrice("");
    setAppliedMin(undefined);
    setAppliedMax(undefined);
    setFilterOpen(false);
  };

  const hasFilters = Boolean(sort || appliedMin !== undefined || appliedMax !== undefined);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <motion.div {...fade(0)} className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/products/search" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
          Search
        </Link>
        <span style={{ color: "var(--medium-gray)" }}>/</span>
        <span style={{ color: "var(--foreground)" }}>{cat?.title ?? categoryId}</span>
      </motion.div>

      {/* Category hero */}
      <motion.div
        {...fade(0.05)}
        className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{
          background: cat
            ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}aa 100%)`
            : "linear-gradient(135deg, var(--primary-light), var(--background))",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-5">
          <span
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-4xl"
            style={{ backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)" }}
          >
            {cat?.icon ?? "📦"}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: cat?.text ?? "var(--primary)" }}>
              Industry category
            </p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
              {cat?.title ?? categoryId}
            </h1>
            {!loading && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>
                {total.toLocaleString("en-IN")} product{total !== 1 ? "s" : ""} listed
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filter + Sort bar */}
      <motion.div {...fade(0.1)} className="flex flex-wrap items-center gap-3">
        {/* Sort chips */}
        <div className="flex items-center gap-1.5">
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.value;
            return (
              <button
                key={opt.value || "featured"}
                type="button"
                onClick={() => setSort(opt.value)}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: active ? "var(--primary)" : "var(--surface)",
                  color: active ? "#fff" : "var(--foreground)",
                  border: active ? "none" : "1px solid var(--border)",
                }}
              >{opt.label}</button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Price filter button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{
              border: hasFilters && appliedMin !== undefined || appliedMax !== undefined
                ? "1.5px solid var(--primary)"
                : "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Price filter
            {(appliedMin !== undefined || appliedMax !== undefined) && (
              <span
                className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: "var(--primary)", color: "#fff" }}
              >•</span>
            )}
          </button>

          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl p-4 shadow-lg"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>Price range (₹)</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium" style={{ color: "var(--foreground)" }}>Min</label>
                  <input
                    type="number" min="0" placeholder="0"
                    value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium" style={{ color: "var(--foreground)" }}>Max</label>
                  <input
                    type="number" min="0" placeholder="Any"
                    value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button" onClick={clearFilters}
                  className="flex-1 rounded-xl py-2 text-xs font-semibold"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                >Clear</button>
                <button
                  type="button" onClick={applyPriceFilter}
                  className="flex-1 rounded-xl py-2 text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--primary)" }}
                >Apply</button>
              </div>
            </motion.div>
          )}
        </div>

        {hasFilters && (
          <button
            type="button" onClick={clearFilters}
            className="text-xs font-semibold transition-opacity hover:opacity-60"
            style={{ color: "var(--accent)" }}
          >Clear filters</button>
        )}
      </motion.div>

      {/* Results count */}
      {!loading && (
        <motion.p {...fade(0.12)} className="text-sm" style={{ color: "var(--medium-gray)" }}>
          Showing {products.length} of {total.toLocaleString("en-IN")} products
          {hasFilters && <span style={{ color: "var(--primary)" }}> (filtered)</span>}
        </motion.p>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          <span>{error}</span>
          <button type="button" onClick={() => load("fresh")} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* Products grid */}
      {!loading && products.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <ProductCard product={p} buyerView />
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => load("more")}
                disabled={loadingMore}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
              >{loadingMore ? "Loading…" : `Load more (${total - products.length} remaining)`}</button>
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">{cat?.icon ?? "📦"}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              No products in {cat?.title ?? "this category"} yet
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
              {hasFilters ? "Try adjusting your filters." : "Be the first to list in this category."}
            </p>
          </div>
          {hasFilters ? (
            <button type="button" onClick={clearFilters}
              className="mt-1 rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >Clear filters</button>
          ) : (
            <Link href="/dashboard/products/mine"
              className="mt-1 rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >List a product</Link>
          )}
        </div>
      )}
    </div>
  );
};
