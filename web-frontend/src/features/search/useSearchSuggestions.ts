"use client";

import { useEffect, useRef, useState } from "react";
import { productService } from "@/src/services/product";
import { isAbortError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";

/** Below this length a query is too noisy to be worth a round-trip. */
export const MIN_SUGGEST_LENGTH = 2;
const DEBOUNCE_MS = 220;

export type UseSearchSuggestionsOptions = {
  /** Skip fetching entirely — e.g. while the dropdown is closed. */
  enabled?: boolean;
  limit?: number;
  /** Restrict suggestions to admin-listed products (the in-house catalog). */
  createdByRole?: "admin" | "user";
};

/**
 * Debounced, abortable product suggestions for the search typeahead.
 *
 * Every in-flight request is aborted when the query changes, so a slow early
 * keystroke can never land after a faster later one and overwrite the list
 * with stale results. `loading` is only cleared by the request that is still
 * current, for the same reason.
 */
export const useSearchSuggestions = (
  query: string,
  { enabled = true, limit = 6, createdByRole }: UseSearchSuggestionsOptions = {}
) => {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!enabled || trimmed.length < MIN_SUGGEST_LENGTH) {
      abortRef.current?.abort();
      abortRef.current = null;
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await productService.list(
          {
            scope: "marketplace",
            search: trimmed,
            limit,
            includeVariantSummary: false,
            ...(createdByRole ? { createdByRole } : {}),
          },
          controller.signal
        );
        if (!controller.signal.aborted) setSuggestions(res.products ?? []);
      } catch (err) {
        if (!isAbortError(err)) setSuggestions([]);
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, enabled, limit, createdByRole]);

  // Abort whatever is in flight when the consumer unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  return { suggestions, loading };
};
