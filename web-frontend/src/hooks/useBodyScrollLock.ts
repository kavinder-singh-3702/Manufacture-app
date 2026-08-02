"use client";

/**
 * Locks page scroll while `active` is true, restoring the previous
 * `document.body.style.overflow` on release. Reference-counted at module
 * scope so nested overlays (a confirm dialog opened from inside a sheet)
 * don't unlock the body when the *inner* one closes while the outer is
 * still open — only when the lock count returns to zero.
 *
 * There was no scroll lock anywhere in the app before this; every drawer/
 * modal let the page scroll behind it, which is especially bad on mobile
 * where the background visibly jumps around behind an open sheet.
 */

import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

const lock = () => {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
};

const unlock = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = previousOverflow;
};

export const useBodyScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => unlock();
  }, [active]);
};
