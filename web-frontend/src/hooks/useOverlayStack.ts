"use client";

/**
 * Tracks which stacked overlays (modals, sheets, confirm dialogs, ...) are
 * currently mounted, and gives each one an Escape-key handler that only
 * fires for the *topmost* overlay.
 *
 * Without this, two overlays that each add their own `window` "keydown"
 * listener both react to a single Escape press — e.g. the Ad Studio drawer
 * and a confirm dialog opened from within it both closing at once, which is
 * what let ConfirmDialog's single `resolverRef` get clobbered by a second
 * `confirm()` call before the first had settled (see ConfirmDialog.tsx).
 * A module-level stack (not React state) is enough here — overlay mount
 * order only matters for *this* keydown routing, not for rendering.
 */

import { useEffect, useId } from "react";

let stack: string[] = [];

const push = (id: string) => {
  stack = stack.filter((x) => x !== id);
  stack.push(id);
};

const pop = (id: string) => {
  stack = stack.filter((x) => x !== id);
};

const isTop = (id: string) => stack.length > 0 && stack[stack.length - 1] === id;

/**
 * Registers `active` as an overlay while true, and invokes `onEscape` on
 * Escape — but only when this overlay is the topmost one currently open.
 */
export const useEscapeKey = (active: boolean, onEscape: () => void) => {
  const id = useId();

  useEffect(() => {
    if (!active) return;
    push(id);
    return () => pop(id);
  }, [active, id]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTop(id)) onEscape();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, id, onEscape]);
};
