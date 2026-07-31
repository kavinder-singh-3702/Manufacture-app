"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook, built on `useSyncExternalStore` — the tool
 * React recommends for subscribing to an external source like `matchMedia`
 * (vs. a useState+useEffect combo, which has to call setState synchronously
 * inside the effect body just to do the initial sync). Returns `false` on
 * the server and until mounted, then tracks the live match. There was no
 * shared hook for this before — the 3 existing `matchMedia` call sites
 * (ThemeProvider, ProductGallery, the anti-FOUC script) each rolled their
 * own listener.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

/** Matches the dashboard shell's desktop breakpoint (Tailwind `lg`, 1024px). */
export const useIsDesktop = (): boolean => useMediaQuery("(min-width: 1024px)");
