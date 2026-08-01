"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 320;

export type UseUrlSearchQueryOptions = {
  paramKey?: string;
  debounceMs?: number;
  /** Set false to keep the query purely local (e.g. a seller's embedded catalog). */
  syncToUrl?: boolean;
};

/**
 * Two-way binding between a search input and the `?q=` URL param.
 *
 * The bug this exists to kill: listing pages used to seed their search state
 * from the URL *once*, via `useState(initialSearch)`. Submitting a search from
 * the global topbar while already on that page changed the URL but left the
 * component's state untouched, so nothing happened — and browser back/forward
 * over search results did nothing either.
 *
 * Here the URL is the source of truth. External changes (topbar submit,
 * back/forward, a shared link) flow *into* the input, and typing flows back
 * out to the URL after a debounce, so results stay shareable and bookmarkable.
 */
export const useUrlSearchQuery = ({
  paramKey = "q",
  debounceMs = DEBOUNCE_MS,
  syncToUrl = true,
}: UseUrlSearchQueryOptions = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get(paramKey)?.trim() ?? "";

  // `input` is what the user sees; `query` is the committed value that drives
  // fetching. They differ only during the debounce window.
  const [input, setInput] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery);

  // Tracks the last value we ourselves wrote to the URL, so we can tell our
  // own debounced write apart from a genuine external navigation.
  const selfWriteRef = useRef<string | null>(null);

  useEffect(() => {
    if (selfWriteRef.current === urlQuery) {
      selfWriteRef.current = null;
      return;
    }
    // External navigation wins over whatever is in the box.
    setInput(urlQuery);
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === query && trimmed === urlQuery) return;

    const timer = setTimeout(() => {
      setQuery(trimmed);

      if (!syncToUrl || trimmed === urlQuery) return;

      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set(paramKey, trimmed);
      else params.delete(paramKey);

      selfWriteRef.current = trimmed;
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, debounceMs);

    return () => clearTimeout(timer);
    // `query` is intentionally omitted: including it would re-arm the timer on
    // every commit and re-run the URL write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, urlQuery, syncToUrl, paramKey, debounceMs, pathname, router, searchParams]);

  /** Commit immediately, bypassing the debounce (Enter / suggestion click). */
  const submit = useCallback(
    (raw?: string) => {
      const trimmed = (raw ?? input).trim();
      setInput(trimmed);
      setQuery(trimmed);

      if (!syncToUrl || trimmed === urlQuery) return;

      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set(paramKey, trimmed);
      else params.delete(paramKey);

      selfWriteRef.current = trimmed;
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [input, syncToUrl, urlQuery, searchParams, paramKey, router, pathname]
  );

  const clear = useCallback(() => submit(""), [submit]);

  return { input, setInput, query, submit, clear };
};
