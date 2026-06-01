"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { CreateProductInput, Product, ProductVisibility } from "@/src/types/product";
import { useDashboardContext } from "@/src/features/dashboard/components/user-dashboard/context";
import { ProductGrid } from "./ProductGrid";
import { ProductFormDrawer } from "./ProductFormDrawer";

const PAGE_SIZE = 24;

type VisibilityFilter = "all" | ProductVisibility;

const VISIBILITY_CHIPS: { label: string; value: VisibilityFilter }[] = [
  { label: "All", value: "all" },
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

export const MyProductsContainer = () => {
  const { activeCompany } = useDashboardContext();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const load = useCallback(async (mode: "fresh" | "more" = "fresh") => {
    const isFresh = mode === "fresh";
    try {
      if (isFresh) setLoading(true); else setLoadingMore(true);
      setError(null);
      const nextOffset = isFresh ? 0 : offset + PAGE_SIZE;
      const res = await productService.list({
        limit: PAGE_SIZE,
        offset: nextOffset,
        scope: "company",
        search: debouncedSearch || undefined,
        visibility: visibility !== "all" ? visibility : undefined,
        includeVariantSummary: true,
      });
      setProducts((prev) => isFresh ? res.products : [...prev, ...res.products]);
      setTotal(res.pagination.total);
      setHasMore(res.pagination.hasMore);
      setOffset(nextOffset);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, visibility, offset]);

  useEffect(() => {
    setOffset(0);
    load("fresh");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, visibility]);

  const handleCreate = async (data: CreateProductInput) => {
    await productService.create(data);
    setDrawerOpen(false);
    setOffset(0);
    await load("fresh");
  };

  const noCompany = !activeCompany;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
            My Catalog
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            My Products
            {!loading && total > 0 && (
              <span
                className="ml-2.5 rounded-full px-2.5 py-0.5 text-sm font-semibold align-middle"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
              >{total}</span>
            )}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>
            {activeCompany ? `Products listed under ${activeCompany.displayName}` : "Select a company to see your catalog"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            Browse Marketplace →
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            disabled={noCompany}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New product
          </button>
        </div>
      </motion.div>

      {/* No company banner */}
      {noCompany && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.04) 100%)",
            border: "1px solid rgba(20,141,178,0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No active company selected</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
                Pick a company from the sidebar to view and manage your product catalog.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters: Search + Visibility chips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            style={{ color: "var(--medium-gray)" }}
          >
            <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search your products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-opacity hover:opacity-70"
              style={{ color: "var(--medium-gray)" }}
              aria-label="Clear search"
            >✕</button>
          )}
        </div>

        {/* Visibility chips */}
        <div className="flex items-center gap-1.5">
          {VISIBILITY_CHIPS.map((chip) => {
            const active = visibility === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setVisibility(chip.value)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: active ? "var(--primary)" : "var(--surface)",
                  color: active ? "#fff" : "var(--foreground)",
                  border: active ? "none" : "1px solid var(--border)",
                  boxShadow: active ? "var(--shadow-primary)" : "none",
                }}
              >{chip.label}</button>
            );
          })}
        </div>
      </motion.div>

      {/* Results */}
      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        onCreate={() => setDrawerOpen(true)}
        onRetry={() => load("fresh")}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => load("more")}
        scope="company"
        hasFilters={Boolean(debouncedSearch || visibility !== "all")}
        onClearFilters={() => { setSearch(""); setVisibility("all"); }}
        companyName={activeCompany?.displayName}
      />

      <ProductFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
