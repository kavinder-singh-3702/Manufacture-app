"use client";

/**
 * Fetch-one-product state (loading / error / not-found / reload), shared by
 * the owner detail page and the edit page so neither re-implements the same
 * try-catch-finally block.
 */

import { useCallback, useEffect, useState } from "react";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";

export const useProductResource = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus(null);
      // "marketplace" scope mirrors ProductDetailContainer: it returns every
      // product owned by the viewer's company (any status/visibility) — a
      // missing scope means "active company only" server-side, which 404s
      // right after a company switch.
      const next = await productService.get(productId, { scope: "marketplace", includeVariantSummary: true });
      setProduct(next);
    } catch (err) {
      setStatus(err instanceof ApiError ? err.status : null);
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { reload(); }, [reload]);

  return {
    product,
    loading,
    error,
    /** A deleted/private product reads as "not found" rather than a hard error. */
    notFound: status === 404 || (!loading && !error && !product),
    reload,
    setProduct,
  };
};
