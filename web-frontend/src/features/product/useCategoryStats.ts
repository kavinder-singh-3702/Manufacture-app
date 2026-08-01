"use client";

import { useCallback, useEffect, useState } from "react";
import { productService } from "@/src/services/product";
import type { ProductListScope } from "@/src/types/product";
import { PRODUCT_CATEGORIES, type CategoryMeta } from "./utils/categories";

export type CategoryWithStats = Omit<CategoryMeta, "subCategories"> & {
  count: number;
  totalQuantity?: number;
  // Overrides CategoryMeta's static, readonly list with the live one reported
  // by the backend (falls back to it below when the live one is missing).
  subCategories?: readonly string[];
};

/**
 * Single source of truth for "category tiles with live counts" — left-joins
 * `productService.getCategoryStats` onto the canonical `PRODUCT_CATEGORIES`
 * list so every tile always renders (even at count 0), mirroring the app's
 * `mapCategories` in DashboardScreenContent.tsx. Replaces the three ad-hoc
 * fetch-and-merge call sites that used to live in OverviewSection,
 * MarketplaceSection, and ProductSearchContainer.
 */
export const useCategoryStats = (scope: ProductListScope = "marketplace") => {
  const [categories, setCategories] = useState<CategoryWithStats[]>(
    PRODUCT_CATEGORIES.map((cat) => ({ ...cat, count: 0, totalQuantity: 0 }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getCategoryStats({ scope });
      const statsById = new Map(res.categories.map((c) => [c.id, c]));
      setCategories(
        PRODUCT_CATEGORIES.map((cat) => {
          const stat = statsById.get(cat.id);
          return {
            ...cat,
            count: stat?.count ?? 0,
            totalQuantity: stat?.totalQuantity ?? 0,
            subCategories: stat?.subCategories,
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, loading, error, reload };
};
