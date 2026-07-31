"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productService } from "@/src/services/product";
import { ApiError, isAbortError } from "@/src/lib/api-error";
import type { Product, ProductSort } from "@/src/types/product";
import { formatCompanyLocation } from "../../utils/seller";
import { ProductListRow } from "./ProductListRow";

const PAGE_SIZE = 20;

const RowSkeleton = () => (
  <div className="flex gap-4 rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
    <div className="h-28 w-28 flex-shrink-0 animate-pulse rounded-xl sm:h-32 sm:w-32" style={{ backgroundColor: "var(--light-gray)" }} />
    <div className="flex-1 space-y-2.5 py-1">
      <div className="h-3 w-1/3 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-4 w-2/3 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-5 w-1/4 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
    </div>
  </div>
);

type Props = {
  category?: string;
  search?: string;
  sort?: ProductSort | "";
  stockFilter?: "" | "in_stock" | "low_stock";
  priceMin?: number;
  priceMax?: number;
  companyId?: string;
  /** Client-side post-filters — no server-side facet exists yet for either. */
  location?: string;
  verifiedOnly?: boolean;
  routePrefix?: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Reports distinct locations from the currently-loaded page, for FilterSidebar's location facet. */
  onLocationsChange?: (locations: string[]) => void;
  onTotalChange?: (total: number) => void;
};

/**
 * The shared listing shell — loading skeletons, empty state, IndiaMART-style
 * row list, "Load more" pagination. One data-fetching implementation reused
 * by the marketplace search page, category browse, and a seller's storefront
 * catalog (via `companyId`) instead of three separate fetch/render loops.
 */
export const ListingResults = ({
  category, search, sort, stockFilter, priceMin, priceMax, companyId,
  location, verifiedOnly,
  routePrefix = "/products",
  emptyIcon = "🔍", emptyTitle = "No products found", emptySubtitle,
  onLocationsChange, onTotalChange,
}: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (off: number, append: boolean) => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    try {
      setError(null);
      if (append) setLoadingMore(true); else setLoading(true);
      const res = await productService.list({
        scope: "marketplace",
        limit: PAGE_SIZE,
        offset: off,
        search: search || undefined,
        category: category || undefined,
        status: stockFilter || undefined,
        sort: (sort as ProductSort) || undefined,
        minPrice: priceMin,
        maxPrice: priceMax,
        companyId: companyId || undefined,
        includeVariantSummary: false,
      }, controller.signal);
      setProducts((p) => (append ? [...p, ...(res.products ?? [])] : (res.products ?? [])));
      setTotal(res.pagination?.total ?? 0);
      setHasMore(res.pagination?.hasMore ?? false);
      setOffset(off);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products");
    } finally {
      if (loadAbortRef.current === controller) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [search, category, sort, stockFilter, priceMin, priceMax, companyId]);

  useEffect(() => {
    load(0, false);
    return () => loadAbortRef.current?.abort();
  }, [load]);

  // Report the loaded page's distinct locations up to the parent so
  // FilterSidebar's location dropdown reflects real, current data.
  useEffect(() => {
    if (!onLocationsChange) return;
    const locations = Array.from(new Set(products.map((p) => formatCompanyLocation(p.company)).filter((l): l is string => !!l))).sort();
    onLocationsChange(locations);
  }, [products, onLocationsChange]);

  useEffect(() => { onTotalChange?.(total); }, [total, onTotalChange]);

  // Client-side post-filters (location, verified-only) — applied to the
  // already-loaded page only; see plan open decisions re: a server facet.
  const visibleProducts = useMemo(() => products.filter((p) => {
    if (location && formatCompanyLocation(p.company) !== location) return false;
    if (verifiedOnly && p.company?.complianceStatus !== "approved") return false;
    return true;
  }), [products, location, verifiedOnly]);

  const makeHref = (p: Product) =>
    routePrefix === "/products" ? `/products/${encodeURIComponent(p._id)}` : `${routePrefix}/${encodeURIComponent(p._id)}`;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
        <span>{error}</span>
        <button type="button" onClick={() => load(0, false)} className="text-xs font-bold underline">Retry</button>
      </div>
    );
  }

  if (visibleProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="text-5xl">{emptyIcon}</div>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{emptyTitle}</p>
        {emptySubtitle && <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{emptySubtitle}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleProducts.map((p) => <ProductListRow key={p._id} product={p} href={makeHref(p)} variant="row" />)}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button type="button" onClick={() => load(offset + PAGE_SIZE, true)} disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
            {loadingMore ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" /> Loading…</>) : "Load more products"}
          </button>
        </div>
      )}
    </div>
  );
};
