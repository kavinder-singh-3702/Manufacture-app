"use client";

import { useState } from "react";

// Lazy initializer (read on the client's first render only, regardless of
// how many times this module-level function is re-created across renders —
// useState only ever calls it once), matching the established pattern in
// ThemeProvider's readStoredMode and the user dashboard's Sidebar
// (readCollapsedState in Navigation.tsx). Avoids the setState-in-effect lint
// error and an extra render pass for something that never needs to match
// server-rendered markup exactly.
const readCollapsedState = (storageKey: string): boolean =>
  typeof window !== "undefined" && window.localStorage.getItem(storageKey) === "1";

/**
 * Collapsible-sidebar width state, persisted to localStorage under a
 * caller-supplied key. Factored out of the user dashboard's Sidebar
 * (Navigation.tsx collapse mechanics) so the admin console's own sidebar can
 * reuse the exact same collapse/expand/persist behavior without copy-pasting
 * the `useState` + `localStorage.setItem` pairing — each caller passes its
 * own storage key so the two shells' collapsed state never collides.
 */
export const useCollapsibleSidebar = (storageKey: string) => {
  const [collapsed, setCollapsed] = useState(() => readCollapsedState(storageKey));

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(storageKey, next ? "1" : "0");
      return next;
    });
  };

  const expand = () => {
    setCollapsed(false);
    window.localStorage.setItem(storageKey, "0");
  };

  return { collapsed, toggleCollapsed, expand };
};
