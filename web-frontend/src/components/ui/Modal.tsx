"use client";

/**
 * Centered-dialog shell — backdrop + panel with scroll lock, stack-aware
 * Escape handling, and a focus trap. Consolidates what used to be three
 * near-identical hand-rolled overlays (`fixed inset-0 z-[60] flex items-
 * center justify-center p-4` + a manual backdrop onClick): ConfirmDialog,
 * the Ad Studio UserPicker, and ProductPicker. Companion to `Sheet.tsx`,
 * which covers the responsive drawer/bottom-sheet shape instead of a
 * centered dialog.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from "@/src/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/src/hooks/useOverlayStack";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** "dialog" for pickers/lists, "alertdialog" for confirm-style prompts. */
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
  maxWidthClassName?: string;
  /** Closing via backdrop click/Escape can be disallowed while a save is in flight. */
  dismissible?: boolean;
};

export const Modal = ({
  open,
  onClose,
  children,
  role = "dialog",
  ariaLabel,
  maxWidthClassName = "max-w-md",
  dismissible = true,
}: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(open);
  useEscapeKey(open && dismissible, onClose);

  // Focus trap: keep Tab/Shift+Tab cycling within the panel, and move focus
  // into it on open (onto the first focusable element that isn't marked
  // data-modal-danger — callers put that on destructive actions so a stray
  // Enter right after open can't trigger them).
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const initial =
      panel.querySelector<HTMLElement>('[data-modal-initial-focus="true"]') ??
      focusables().find((el) => !el.hasAttribute("data-modal-danger")) ??
      focusables()[0];
    initial?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismissible && onClose()}
          />
          <motion.div
            ref={panelRef}
            role={role}
            aria-modal="true"
            aria-label={ariaLabel}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`relative flex max-h-[calc(100dvh-2rem)] w-full ${maxWidthClassName} flex-col overflow-hidden rounded-2xl shadow-2xl`}
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
