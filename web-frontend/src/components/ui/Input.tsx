"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef, useState, type ReactNode } from "react";

// ============================================
// ANIMATED INPUT COMPONENT
// ============================================

interface AnimatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      icon,
      iconPosition = "left",
      disabled,
      className = "",
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const borderColor = error
      ? "var(--color-error)"
      : success
      ? "var(--color-success)"
      : isFocused
      ? "var(--color-plum)"
      : "var(--border-soft)";

    return (
      <div className={`space-y-2 ${className}`}>
        {/* Label */}
        {label && (
          <motion.label
            animate={{ color: isFocused ? "var(--color-plum)" : "var(--color-charcoal)" }}
            className="block text-sm font-semibold"
          >
            {label}
          </motion.label>
        )}

        {/* Input container */}
        <motion.div
          animate={{
            borderColor,
            boxShadow: isFocused ? "0 0 0 3px rgba(90, 48, 66, 0.1)" : "none",
          }}
          transition={{ duration: 0.2 }}
          className={`
            relative flex items-center rounded-2xl border px-4
            ${disabled ? "bg-white/70" : "bg-white"}
          `}
          style={{ borderWidth: 1.5 }}
        >
          {/* Left icon */}
          {icon && iconPosition === "left" && (
            <motion.span
              animate={{ color: isFocused ? "var(--color-plum)" : "var(--color-text-muted)" }}
              className="mr-3"
            >
              {icon}
            </motion.span>
          )}

          {/* Input */}
          <input
            ref={ref}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="flex-1 bg-transparent py-3 text-sm text-[#2e1f2c] placeholder:text-[#7a5d6b] focus:outline-none disabled:cursor-not-allowed"
            {...props}
          />

          {/* Right icon or validation icon */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.span
                key="error-icon"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="ml-2 text-[var(--color-error)]"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx={12} cy={12} r={10} />
                  <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                </svg>
              </motion.span>
            )}
            {success && !error && (
              <motion.span
                key="success-icon"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="ml-2 text-[var(--color-success)]"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            )}
            {icon && iconPosition === "right" && !error && !success && (
              <motion.span
                key="right-icon"
                animate={{ color: isFocused ? "var(--color-plum)" : "var(--color-text-muted)" }}
                className="ml-2"
              >
                {icon}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error or helper text */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="text-xs font-medium text-[var(--color-error)]"
            >
              {error}
            </motion.p>
          )}
          {helperText && !error && (
            <motion.p
              key="helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[var(--color-text-muted)]"
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

// ============================================
// ANIMATED TEXTAREA
// ============================================

interface AnimatedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  className?: string;
}

export const AnimatedTextarea = forwardRef<HTMLTextAreaElement, AnimatedTextareaProps>(
  ({ label, error, success, helperText, disabled, className = "", onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const borderColor = error
      ? "var(--color-error)"
      : success
      ? "var(--color-success)"
      : isFocused
      ? "var(--color-plum)"
      : "var(--border-soft)";

    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <motion.label
            animate={{ color: isFocused ? "var(--color-plum)" : "var(--color-charcoal)" }}
            className="block text-sm font-semibold"
          >
            {label}
          </motion.label>
        )}

        <motion.textarea
          ref={ref}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          animate={{
            borderColor,
            boxShadow: isFocused ? "0 0 0 3px rgba(90, 48, 66, 0.1)" : "none",
          }}
          transition={{ duration: 0.2 }}
          className={`
            w-full rounded-2xl border px-4 py-3 text-sm text-[#2e1f2c]
            placeholder:text-[#7a5d6b] focus:outline-none resize-none
            ${disabled ? "bg-white/70 cursor-not-allowed" : "bg-white"}
          `}
          style={{ borderWidth: 1.5 }}
          {...props}
        />

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs font-medium text-[var(--color-error)]"
            >
              {error}
            </motion.p>
          )}
          {helperText && !error && (
            <motion.p
              key="helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[var(--color-text-muted)]"
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedTextarea.displayName = "AnimatedTextarea";

// ============================================
// FLOATING LABEL INPUT
// ============================================

interface FloatingLabelInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "placeholder"> {
  label: string;
  error?: string;
  className?: string;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, disabled, value, className = "", onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== "";
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={`relative ${className}`}>
        <motion.div
          animate={{
            borderColor: error
              ? "var(--color-error)"
              : isFocused
              ? "var(--color-plum)"
              : "var(--border-soft)",
            boxShadow: isFocused ? "0 0 0 3px rgba(90, 48, 66, 0.1)" : "none",
          }}
          className="relative rounded-2xl border bg-white"
          style={{ borderWidth: 1.5 }}
        >
          <input
            ref={ref}
            value={value}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full bg-transparent px-4 pt-6 pb-2 text-sm text-[#2e1f2c] focus:outline-none"
            {...props}
          />
          <motion.label
            animate={{
              y: isFloating ? -10 : 0,
              scale: isFloating ? 0.85 : 1,
              color: isFocused ? "var(--color-plum)" : "var(--color-text-muted)",
            }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 top-4 origin-left pointer-events-none"
          >
            {label}
          </motion.label>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-1 text-xs font-medium text-[var(--color-error)]"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

// ============================================
// SEARCH INPUT
// ============================================

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> {
  onSearch?: (value: string) => void;
  loading?: boolean;
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, loading, value, onChange, className = "", ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <motion.div
        animate={{
          boxShadow: isFocused ? "0 4px 20px rgba(90, 48, 66, 0.15)" : "0 2px 8px rgba(90, 48, 66, 0.08)",
        }}
        className={`flex items-center gap-3 rounded-full bg-white px-4 py-2.5 ${className}`}
        style={{ border: "1px solid var(--border-soft)" }}
      >
        {/* Search icon */}
        <motion.svg
          animate={{ color: isFocused ? "var(--color-plum)" : "var(--color-text-muted)" }}
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx={11} cy={11} r={8} />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </motion.svg>

        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSearch && typeof value === "string") {
              onSearch(value);
            }
          }}
          className="flex-1 bg-transparent text-sm text-[#2e1f2c] placeholder:text-[#7a5d6b] focus:outline-none"
          {...props}
        />

        {/* Loading spinner or clear button */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-plum)"
                strokeWidth={2}
              >
                <circle cx={12} cy={12} r={10} strokeDasharray="32" strokeDashoffset="16" />
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

SearchInput.displayName = "SearchInput";
