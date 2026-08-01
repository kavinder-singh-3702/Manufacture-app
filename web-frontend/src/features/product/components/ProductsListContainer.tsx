"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import { ApiError, isAbortError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import { useAuth } from "@/src/hooks/useAuth";
import { PageHeader } from "@/src/components/ui/Surface";
import { ProductFilters, type FiltersState } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";

const PAGE_SIZE = 24;

const initialFilters: FiltersState = { search: "", category: "", status: "", sort: "" };

/**
 * Buyer-facing marketplace catalog — browse and buy, nothing else.
 *
 * Catalog *management* (stats, create/edit, visibility, stock levels) lives
 * on /dashboard/products/mine. This page used to host both behind a
 * "My Catalog ↔ Marketplace" scope toggle, which meant a buyer landed on a
 * screen dominated by seller KPIs they had no use for.
 */
export const ProductsListContainer = () => {
  const { user } = useAuth();
  const isGuest = !user;

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  const loadProducts = useCallback(
    async (mode: "fresh" | "more" = "fresh") => {
      const isFresh = mode === "fresh";
      // Cancel any in-flight load so a superseded filter change doesn't waste
      // backend work or overwrite newer results.
      loadAbortRef.current?.abort();
      const controller = new AbortController();
      loadAbortRef.current = controller;
      try {
        if (isFresh) setLoading(true);
        else setLoadingMore(true);
        setError(null);
        const nextOffset = isFresh ? 0 : offset + PAGE_SIZE;
        const res = await productService.list(
          {
            limit: PAGE_SIZE,
            offset: nextOffset,
            search: filters.search || undefined,
            category: filters.category || undefined,
            status: filters.status || undefined,
            sort: filters.sort || undefined,
            scope: "marketplace",
            includeVariantSummary: true,
          },
          controller.signal
        );
        setProducts((prev) => (isFresh ? res.products : [...prev, ...res.products]));
        setTotal(res.pagination.total);
        setHasMore(res.pagination.hasMore);
        setOffset(nextOffset);
      } catch (err) {
        if (isAbortError(err)) return; // superseded/unmounted — ignore
        setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products");
      } finally {
        if (loadAbortRef.current === controller) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.search, filters.category, filters.status, filters.sort]
  );

  useEffect(() => {
    setOffset(0);
    loadProducts("fresh");
    return () => loadAbortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.status, filters.sort]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={<span>Marketplace</span>}
        title="Browse products"
        actions={
          isGuest ? (
            <Link
              href="/signin"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
            >
              Sign in
            </Link>
          ) : (
            <Link
              href="/dashboard/products/mine"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              Manage my catalog →
            </Link>
          )
        }
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <ProductFilters value={filters} onChange={setFilters} totalResults={total} />
      </motion.div>

      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        onRetry={() => loadProducts("fresh")}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => loadProducts("more")}
        scope="marketplace"
        hasFilters={Boolean(filters.search || filters.category || filters.status)}
        onClearFilters={() => setFilters(initialFilters)}
        buyerView
      />
    </div>
  );
};
