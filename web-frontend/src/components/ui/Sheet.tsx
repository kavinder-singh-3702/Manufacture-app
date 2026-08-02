"use client";

/**
 * One responsive overlay component, replacing the four private drawer
 * implementations that had grown independently (AdStudioPanel's `Drawer`,
 * plus the cart/company/product-inquiry drawers): a bottom sheet with
 * drag-to-dismiss below `lg`, and a right-side panel at `lg` and above.
 *
 * Adds three things Ad Studio's private `Drawer` needed but this component
 * didn't yet have: a `subHeader` slot for content that should stay pinned
 * below the title (the wizard's step rail), a `footer` slot pinned above
 * `pb-safe` so primary actions never end up under the iOS Safari toolbar,
 * and body scroll lock + stack-aware Escape handling (shared with `Modal`).
 */

import { type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsDesktop } from "@/src/hooks/useMediaQuery";
import { useBodyScrollLock } from "@/src/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/src/hooks/useOverlayStack";
import { useMotionSafe } from "./motion";

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Pinned between the header and the scrollable body — e.g. a step rail. */
  subHeader?: ReactNode;
  /** Pinned below the scrollable body, above `pb-safe` — e.g. wizard nav buttons. */
  footer?: ReactNode;
  children: ReactNode;
  /** Right-panel width on desktop. Ignored on mobile (always full-width). */
  width?: number;
  /** Backdrop click / Escape / header ✕ all no-op while false (e.g. mid-save). */
  dismissible?: boolean;
  /** Ref to the scrollable body — lets a caller scroll it to top on step change. */
  bodyRef?: RefObject<HTMLDivElement | null>;
};

export const Sheet = ({ open, onClose, title, subHeader, footer, children, width = 480, dismissible = true, bodyRef }: SheetProps) => {
  const isDesktop = useIsDesktop();
  const motionSafe = useMotionSafe();

  useBodyScrollLock(open);
  useEscapeKey(open && dismissible, onClose);

  const requestClose = () => dismissible && onClose();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={requestClose}
          />

          {isDesktop ? (
            <motion.aside
              className="pt-safe fixed inset-y-0 right-0 z-50 flex flex-col"
              style={{ width, maxWidth: "100vw", backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
              initial={{ x: width, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: width, opacity: 0 }}
              transition={motionSafe ? { type: "spring", damping: 30, stiffness: 300 } : { duration: 0 }}
            >
              <SheetHeader title={title} onClose={requestClose} />
              {subHeader}
              <div ref={bodyRef} className="flex-1 overflow-y-auto p-5">{children}</div>
              {footer && <div className="pb-safe">{footer}</div>}
            </motion.aside>
          ) : (
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl"
              style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={motionSafe ? { type: "spring", damping: 32, stiffness: 300 } : { duration: 0 }}
              drag={motionSafe ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (dismissible && (info.offset.y > 120 || info.velocity.y > 500)) onClose();
              }}
            >
              <div className="flex justify-center pb-1 pt-2.5" aria-hidden>
                <span className="h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
              </div>
              <SheetHeader title={title} onClose={requestClose} />
              {subHeader}
              <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
              {footer && <div className="pb-safe">{footer}</div>}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

const SheetHeader = ({ title, onClose }: { title?: ReactNode; onClose: () => void }) => {
  if (!title) return null;
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="min-w-0 flex-1 text-base font-bold" style={{ color: "var(--foreground)" }}>{title}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{ touchAction: "manipulation", color: "var(--medium-gray)" }}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};
