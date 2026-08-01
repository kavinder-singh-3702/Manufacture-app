"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "manufacture:recent-searches";
const MAX_RECENT = 8;

/** Stable empty reference — useSyncExternalStore requires snapshot identity. */
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedValue: string[] = EMPTY;

const readRaw = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const parse = (raw: string | null): string[] => {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const values = parsed.filter((v): v is string => typeof v === "string");
    return values.length ? values : EMPTY;
  } catch {
    return EMPTY;
  }
};

/**
 * Returns a cached array so repeated calls yield the same reference unless the
 * underlying storage actually changed — without this, useSyncExternalStore
 * would see a "new" value every render and loop forever.
 */
const getSnapshot = (): string[] => {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
};

const getServerSnapshot = (): string[] => EMPTY;

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  // `storage` only fires in *other* tabs, so same-tab writes notify via emit().
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

const persist = (values: string[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Private mode / quota — recents are a convenience, never a hard failure.
  }
  emit();
};

/**
 * Recent search queries, shared by every search entry point.
 *
 * Backed by an external store rather than local component state for two
 * reasons: several SearchBars can be mounted at once (topbar + page body), and
 * per-instance state would let them drift apart; and reading localStorage
 * through useSyncExternalStore keeps the server snapshot empty, so there's no
 * hydration mismatch and no setState-in-effect.
 */
export const useRecentSearches = () => {
  const recent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const push = useCallback((rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) return;
    const current = getSnapshot();
    const next = [query, ...current.filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, MAX_RECENT);
    persist(next);
  }, []);

  const remove = useCallback((rawQuery: string) => {
    persist(getSnapshot().filter((q) => q !== rawQuery));
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    emit();
  }, []);

  return { recent, push, remove, clear };
};
