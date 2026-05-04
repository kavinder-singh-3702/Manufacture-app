"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { CreateProductInput, Product, ProductStats } from "@/src/types/product";
import { ProductsStatsHero } from "./ProductsStatsHero";
import { ProductFilters, type FiltersState } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import { ProductFormDrawer } from "./ProductFormDrawer";

const PAGE_SIZE = 24;

const initialFilters: FiltersState = {
  search: "",
  category: "",
  status: "",
  sort: "",
  scope: "company",
};

const isActiveCompanyRequired = (err: unknown) => {
  if (!(err instanceof ApiError)) return false;
  if (err.status !== 400) return false;
  const data = err.data as { code?: string; error?: string } | undefined;
  if (data?.code === "ACTIVE_COMPANY_REQUIRED") return true;
  return /no active company/i.test(err.message);
};

const NoCompanyBanner = ({ onBrowseMarketplace }: { onBrowseMarketplace: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
    style={{
      background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.04) 100%)",
      border: "1px solid rgba(20,141,178,0.2)",
    }}
  >
    <div className="flex items-start gap-3">
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--primary)", color: "#fff" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
          Pick a company to see your catalog
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
          Use the company switcher in the sidebar — or browse the marketplace below.
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onBrowseMarketplace}
      className="flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "var(--primary)" }}
    >
      Browse marketplace →
    </button>
  </motion.div>
);

export const ProductsListContainer = () => {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<ProductStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [needsCompany, setNeedsCompany] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const s = await productService.stats();
      setStats(s);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadProducts = useCallback(
    async (mode: "fresh" | "more" = "fresh") => {
      const isFresh = mode === "fresh";
      try {
        if (isFresh) setLoading(true);
        else setLoadingMore(true);
        setError(null);
        setNeedsCompany(false);
        const nextOffset = isFresh ? 0 : offset + PAGE_SIZE;
        const res = await productService.list({
          limit: PAGE_SIZE,
          offset: nextOffset,
          search: filters.search || undefined,
          category: filters.category || undefined,
          status: filters.status || undefined,
          sort: filters.sort || undefined,
          scope: filters.scope,
          includeVariantSummary: true,
        });
        setProducts((prev) => (isFresh ? res.products : [...prev, ...res.products]));
        setTotal(res.pagination.total);
        setHasMore(res.pagination.hasMore);
        setOffset(nextOffset);
      } catch (err) {
        if (isActiveCompanyRequired(err) && filters.scope === "company") {
          setNeedsCompany(true);
          setProducts([]);
          setTotal(0);
          setHasMore(false);
        } else {
          const message = err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products";
          setError(message);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, offset]
  );

  // Load on mount + when filters change (reset)
  useEffect(() => {
    setOffset(0);
    loadProducts("fresh");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.status, filters.sort, filters.scope]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleCreate = async (data: CreateProductInput) => {
    await productService.create(data);
    setDrawerOpen(false);
    setOffset(0);
    await Promise.all([loadProducts("fresh"), loadStats()]);
  };

  return (
    <div className="space-y-8">
      <ProductsStatsHero stats={stats} loading={statsLoading} onCreate={() => setDrawerOpen(true)} />

      <div className="space-y-5">
        <ProductFilters value={filters} onChange={setFilters} totalResults={total} />
        {needsCompany && (
          <NoCompanyBanner onBrowseMarketplace={() => setFilters((f) => ({ ...f, scope: "marketplace" }))} />
        )}
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          onCreate={() => setDrawerOpen(true)}
          onRetry={() => loadProducts("fresh")}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => loadProducts("more")}
        />
      </div>

      <ProductFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
