"use client";

/**
 * Shared labeled-input primitive for the app-parity surfaces (signup wizard,
 * profile editor sheet). Extracted from SignupCard's local Field/inputClass/
 * inputStyle so both places render the identical input — rounded-xl bordered
 * box, label above, error below — instead of two near-identical copies.
 */

import { type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";

export const fieldInputClass =
  "w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(20,141,178,0.25)]";

export const fieldInputStyle = (error?: string): React.CSSProperties => ({
  border: `1px solid ${error ? "var(--accent)" : "var(--border)"}`,
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
});

export const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
      {label}
    </label>
    {children}
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-semibold"
        style={{ color: "var(--accent)" }}
      >
        {error}
      </motion.p>
    )}
  </div>
);

/** Plain `<input>` pre-wired with the shared field style — for the common case of a single-line text/email/tel/date input inside `<Field>`. */
export const FieldInput = ({ error, className = "", style, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) => (
  <input className={`${fieldInputClass} ${className}`} style={{ ...fieldInputStyle(error), ...style }} {...props} />
);

/** Plain `<textarea>` pre-wired with the shared field style. */
export const FieldTextarea = ({ error, className = "", style, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) => (
  <textarea className={`${fieldInputClass} ${className}`} style={{ ...fieldInputStyle(error), ...style }} {...props} />
);
