"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media query hook. Returns `false` until mounted (matching the
 * server-rendered markup) then syncs to the live match and updates on
 * viewport changes. There was no shared hook for this before — the 3
 * existing `matchMedia` call sites (ThemeProvider, ProductGallery, the
 * anti-FOUC script) each rolled their own listener.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
};

/** Matches the dashboard shell's desktop breakpoint (Tailwind `lg`, 1024px). */
export const useIsDesktop = (): boolean => useMediaQuery("(min-width: 1024px)");
