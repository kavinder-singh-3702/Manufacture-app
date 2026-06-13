"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "arvann-theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const systemPrefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolve = (mode: ThemeMode): ResolvedTheme =>
  mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;

const applyTheme = (resolved: ResolvedTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
  root.style.colorScheme = resolved;
};

/**
 * ThemeProvider — mirrors the app's appearance system (system / light / dark).
 *
 * Persists the choice in localStorage and toggles `data-theme="dark"` on
 * <html>, which the dark-token block in globals.css keys off. An inline script
 * in the root layout applies the stored theme pre-hydration to avoid a flash.
 */
const readStoredMode = (): ThemeMode => {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Lazy initializers read storage on the client's first render. Only the
  // auth-gated topbar/settings consume this context, so there is no SSR
  // consumer to mismatch — and the FOUC script has already painted the DOM.
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [resolvedMode, setResolvedMode] = useState<ResolvedTheme>(() => resolve(readStoredMode()));

  // Keep the DOM attribute in sync with the resolved theme (side-effect only).
  useEffect(() => {
    applyTheme(resolvedMode);
  }, [resolvedMode]);

  // Follow the OS when in "system" mode.
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    // setState inside a subscription callback is the sanctioned pattern; the
    // DOM-sync effect applies the change.
    const handler = () => setResolvedMode(resolve("system"));
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
    setResolvedMode(resolve(next));
  }, []);

  const value = useMemo(
    () => ({ mode, resolvedMode, setMode }),
    [mode, resolvedMode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return context;
};
