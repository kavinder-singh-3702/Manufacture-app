"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { productService } from "@/src/services/product";
import { ApiError, isAbortError } from "@/src/lib/api-error";
import type { Product, ProductCategory, ProductSort } from "@/src/types/product";
import { INHOUSE_PAGE_SIZE, INHOUSE_QUERY } from "./constants";

export type InhouseFilters = {
  search?: string;
  category?: string;
  sort?: ProductSort | "";
  minPrice?: number;
  maxPrice?: number;
};

export type UseInhouseProductsOptions = InhouseFilters & {
  /** Page size / preview limit. Defaults to the full-page size. */
  limit?: number;
};

export type UseInhouseProductsResult = {
  products: Product[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
};

const messageFrom = (err: unknown) =>
  err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products";

/**
 * Shared data hook for the in-house (admin-listed) catalog. Wraps
 * `productService.list` with the canonical {@link INHOUSE_QUERY}, adding
 * offset pagination and cancel-in-flight so superseded filter changes never
 * overwrite newer results. Reused by the home showcase (limit 8) and the full
 * /shop page. Modelled on `PublicMarketplace.load`.
 */
export const useInhouseProducts = (
  options: UseInhouseProductsOptions = {}
): UseInhouseProductsResult => {
  const { limit = INHOUSE_PAGE_SIZE, search, category, sort, minPrice, maxPrice } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (nextOffset: number, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        setError(null);
        if (append) setLoadingMore(true);
        else setLoading(true);
        const res = await productService.list(
          {
            ...INHOUSE_QUERY,
            limit,
            offset: nextOffset,
            search: search || undefined,
            category: category || undefined,
            sort: sort || undefined,
            minPrice,
            maxPrice,
            includeVariantSummary: true,
          },
          controller.signal
        );
        setProducts((prev) => (append ? [...prev, ...(res.products ?? [])] : res.products ?? []));
        setTotal(res.pagination?.total ?? 0);
        setHasMore(res.pagination?.hasMore ?? false);
        setOffset(nextOffset);
      } catch (err) {
        if (isAbortError(err)) return; // superseded / unmounted
        setError(messageFrom(err));
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [limit, search, category, sort, minPrice, maxPrice]
  );

  // Reload from the top whenever the filters (via `load`) change.
  useEffect(() => {
    load(0, false);
    return () => abortRef.current?.abort();
  }, [load]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    load(offset + limit, true);
  }, [load, loading, loadingMore, hasMore, offset, limit]);

  const reload = useCallback(() => load(0, false), [load]);

  return { products, total, loading, loadingMore, error, hasMore, loadMore, reload };
};

const ALL_CATEGORY_ID = "all";

export type UseInhouseCategoriesResult = {
  categories: ProductCategory[];
  loading: boolean;
};

/**
 * Category stats scoped to the in-house catalog, with a synthetic "All" chip
 * prepended (count = sum of the rest). Powers the Shop page category chips.
 */
export const useInhouseCategories = (): UseInhouseCategoriesResult => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await productService.getCategoryStats({
          scope: INHOUSE_QUERY.scope,
          createdByRole: INHOUSE_QUERY.createdByRole,
        });
        if (!active) return;
        const list = (res.categories ?? []).filter((c) => c.id !== ALL_CATEGORY_ID);
        const allCount = list.reduce((sum, c) => sum + (c.count || 0), 0);
        setCategories([{ id: ALL_CATEGORY_ID, title: "All", count: allCount }, ...list]);
      } catch {
        if (active) setCategories([{ id: ALL_CATEGORY_ID, title: "All", count: 0 }]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
};

export { ALL_CATEGORY_ID };
