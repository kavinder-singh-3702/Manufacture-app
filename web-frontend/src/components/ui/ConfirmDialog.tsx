"use client";

/**
 * App-wide "confirm" / "choose one of several actions" dialog, built on the
 * shared `Modal` shell. `useConfirm()` (a plain yes/no prompt) is the
 * original API and every existing caller (product delete, tally voucher
 * delete, admin product delete, logout, the Ad Studio discard prompt) keeps
 * using it unchanged — it's now a thin wrapper over the more general
 * `useChoose()`, which supports N labeled actions (used by the Ad Studio
 * close flow: Keep editing / Save as draft / Discard).
 *
 * `choose()` used to be a single-slot `resolverRef` that a second call would
 * silently overwrite — if a caller (or a double-tap on mobile, or two
 * overlays both reacting to one Escape press) invoked `confirm()` again
 * before the first had resolved, the first `await confirm(...)` never
 * settled. Any caller awaiting it (e.g. the Ad Studio drawer's requestClose)
 * would hang forever behind a dialog that visually looked closed. Fixed by
 * settling any in-flight promise with its `dismissValue` before opening the
 * next one, so a resolver can never be orphaned.
 */

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "./Modal";

export type ChooseActionVariant = "primary" | "danger" | "ghost";

export type ChooseAction<T> = {
  value: T;
  label: string;
  variant?: ChooseActionVariant;
};

export type ChooseOptions<T> = {
  title: string;
  message?: ReactNode;
  actions: ChooseAction<T>[];
  /** Resolved value when dismissed via backdrop click or Escape. */
  dismissValue: T;
};

type ChooseFn = <T>(options: ChooseOptions<T>) => Promise<T>;

export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as a destructive action. */
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

type PendingChoice = {
  options: ChooseOptions<unknown>;
  resolve: (value: unknown) => void;
};

const ChooseContext = createContext<ChooseFn | null>(null);

const buttonStyle: Record<ChooseActionVariant, React.CSSProperties> = {
  primary: { backgroundColor: "var(--primary)", color: "#fff" },
  danger: { backgroundColor: "#DC2626", color: "#fff" },
  ghost: { border: "1px solid var(--border)", color: "var(--foreground)" },
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<PendingChoice | null>(null);
  // Settling happens via this ref (not `pending.resolve` from closed-over
  // state) so a dismiss racing a fresh `choose()` call always resolves the
  // promise it was actually created for, never a stale one.
  const pendingRef = useRef<PendingChoice | null>(null);

  const settle = useCallback((value: unknown) => {
    pendingRef.current?.resolve(value);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const choose = useCallback<ChooseFn>(
    (options) => {
      // A prior choice that never got an explicit answer (replaced by a new
      // one before the admin picked anything) resolves to its own
      // dismissValue instead of hanging forever — the fix for the freeze.
      if (pendingRef.current) settle(pendingRef.current.options.dismissValue);
      return new Promise((resolve) => {
        const next = { options: options as ChooseOptions<unknown>, resolve: resolve as (value: unknown) => void };
        pendingRef.current = next;
        setPending(next);
      });
    },
    [settle],
  );

  return (
    <ChooseContext.Provider value={choose}>
      {children}
      <Modal open={!!pending} onClose={() => settle(pending?.options.dismissValue)} role="alertdialog" ariaLabel={pending?.options.title}>
        <AnimatePresence mode="wait">
          {pending && (
            <motion.div key={pending.options.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col overflow-y-auto p-6">
              <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                {pending.options.title}
              </h2>
              {pending.options.message && (
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>
                  {pending.options.message}
                </p>
              )}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {pending.options.actions.map((action) => (
                  <button
                    key={String(action.value)}
                    type="button"
                    // First non-destructive action gets initial focus via
                    // Modal's data-modal-initial-focus / data-modal-danger
                    // convention, never the destructive one by default.
                    data-modal-danger={action.variant === "danger" ? "true" : undefined}
                    onClick={() => settle(action.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-85 sm:w-auto"
                    style={buttonStyle[action.variant ?? "ghost"]}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </ChooseContext.Provider>
  );
};

export const useChoose = (): ChooseFn => {
  const ctx = useContext(ChooseContext);
  if (!ctx) throw new Error("useChoose must be used within ConfirmProvider");
  return ctx;
};

/** Plain yes/no prompt — thin wrapper over `useChoose()`. */
export const useConfirm = (): ConfirmFn => {
  const choose = useChoose();
  return useCallback(
    (options) =>
      choose<boolean>({
        title: options.title,
        message: options.message,
        dismissValue: false,
        actions: [
          { value: false, label: options.cancelLabel ?? "Cancel", variant: "ghost" },
          { value: true, label: options.confirmLabel ?? "Confirm", variant: options.destructive ? "danger" : "primary" },
        ],
      }),
    [choose],
  );
};
