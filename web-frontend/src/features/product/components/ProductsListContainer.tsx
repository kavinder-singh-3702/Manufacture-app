"use client";

import { useCallback, useEffect, useState } from "react";
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
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products";
        setError(message);
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
