"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/src/types/product";
import { useRecentSearches } from "./useRecentSearches";
import { useSearchSuggestions, MIN_SUGGEST_LENGTH } from "./useSearchSuggestions";

export type SearchBarSize = "sm" | "md" | "lg";

export type SearchBarProps = {
  /** Controlled input value. */
  value: string;
  onChange: (value: string) => void;
  /** Fired on Enter, on the search icon, or when a suggestion is chosen. */
  onSubmit: (query: string) => void;
  placeholder?: string;
  size?: SearchBarSize;
  /** Show the typeahead dropdown (products + recent searches). */
  suggestions?: boolean;
  /** Scope suggestions to the in-house (admin-listed) catalog. */
  createdByRole?: "admin" | "user";
  autoFocus?: boolean;
  className?: string;
  "aria-label"?: string;
};

const sizeStyles: Record<SearchBarSize, { wrap: string; input: string; icon: number }> = {
  sm: { wrap: "gap-2 rounded-xl px-3 py-2", input: "text-[13px]", icon: 14 },
  md: { wrap: "gap-2.5 rounded-xl px-3.5 py-2.5", input: "text-sm", icon: 16 },
  lg: { wrap: "gap-3 rounded-2xl px-4 py-3.5", input: "text-base", icon: 20 },
};

type Row = {
  kind: "recent" | "product";
  key: string;
  label: string;
  sublabel?: string;
};

/**
 * The single search input for the whole app — dashboard topbar, marketing
 * topbar, marketplace, and the dashboard search page all render this rather
 * than hand-rolling an input, a debounce, and a recents list each.
 *
 * Behaves like a real combobox: ↑/↓ move through suggestions, Enter submits
 * the highlighted row (or the raw text), Escape closes, and the listbox is
 * wired up with aria-activedescendant for screen readers.
 */
export const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Search products…",
  size = "md",
  suggestions = true,
  createdByRole,
  autoFocus = false,
  className = "",
  "aria-label": ariaLabel = "Search products",
}: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  // The highlight is tracked by row *key*, not index: suggestions stream in
  // asynchronously, and an index would silently point at a different product
  // once the list changes. Deriving the index also means no reset effect.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const { recent, push: pushRecent } = useRecentSearches();
  const { suggestions: products, loading } = useSearchSuggestions(value, {
    enabled: suggestions && open,
    createdByRole,
  });

  const s = sizeStyles[size];
  const trimmed = value.trim();

  const rows = useMemo<Row[]>(() => {
    if (!suggestions) return [];
    if (trimmed.length >= MIN_SUGGEST_LENGTH) {
      return products.map((p: Product) => ({
        kind: "product" as const,
        key: p._id,
        label: p.name,
        sublabel: p.category?.replace(/-/g, " "),
      }));
    }
    return recent.map((q) => ({ kind: "recent" as const, key: `recent:${q}`, label: q }));
  }, [suggestions, trimmed, products, recent]);

  const activeIndex = activeKey ? rows.findIndex((r) => r.key === activeKey) : -1;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const commit = (query: string) => {
    const q = query.trim();
    onChange(q);
    if (q) pushRecent(q);
    setOpen(false);
    setActiveKey(null);
    inputRef.current?.blur();
    onSubmit(q);
  };

  const moveHighlight = (delta: 1 | -1) => {
    if (!rows.length) return;
    const next = activeIndex < 0
      ? (delta === 1 ? 0 : rows.length - 1)
      : (activeIndex + delta + rows.length) % rows.length;
    setActiveKey(rows[next].key);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveKey(null);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const row = activeIndex >= 0 ? rows[activeIndex] : undefined;
      commit(row ? row.label : value);
      return;
    }
    if (!rows.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      moveHighlight(-1);
    }
  };

  const showDropdown = open && suggestions && (rows.length > 0 || loading);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div
        className={`flex items-center ${s.wrap}`}
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <button
          type="button"
          onClick={() => commit(value)}
          aria-label="Submit search"
          className="flex flex-shrink-0 items-center justify-center transition-opacity hover:opacity-70"
          style={{ color: "var(--medium-gray)" }}
        >
          <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`min-w-0 flex-1 bg-transparent focus:outline-none ${s.input}`}
          style={{ color: "var(--foreground)" }}
        />

        {loading && (
          <span
            className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--border)", borderTopColor: "transparent" }}
            aria-hidden
          />
        )}

        {value && !loading && (
          <button
            type="button"
            onClick={() => { onChange(""); onSubmit(""); inputRef.current?.focus(); }}
            aria-label="Clear search"
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold transition-opacity hover:opacity-60"
            style={{ color: "var(--medium-gray)" }}
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.ul
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl py-1 shadow-lg"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {trimmed.length < MIN_SUGGEST_LENGTH && rows.length > 0 && (
              <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                Recent
              </li>
            )}

            {rows.length === 0 && loading && (
              <li className="px-3 py-3 text-center text-xs" style={{ color: "var(--medium-gray)" }}>
                Searching…
              </li>
            )}

            {rows.map((row, i) => (
              <li key={row.key} id={`${listboxId}-${i}`} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  // mousedown fires before the input's blur, so the click isn't
                  // swallowed by the dropdown closing first.
                  onMouseDown={(e) => { e.preventDefault(); commit(row.label); }}
                  onMouseEnter={() => setActiveKey(row.key)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors"
                  style={{ backgroundColor: i === activeIndex ? "var(--primary-light)" : "transparent" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--medium-gray)", flexShrink: 0 }}>
                    {row.kind === "recent" ? (
                      <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    )}
                  </svg>
                  <span className="min-w-0 flex-1 truncate text-sm" style={{ color: "var(--foreground)" }}>
                    {row.label}
                  </span>
                  {row.sublabel && (
                    <span className="flex-shrink-0 truncate text-[11px] capitalize" style={{ color: "var(--medium-gray)", maxWidth: 120 }}>
                      {row.sublabel}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
