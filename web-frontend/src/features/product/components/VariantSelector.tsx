"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productVariantService } from "@/src/services/productVariant";
import { ApiError } from "@/src/lib/api-error";
import type { ProductVariant } from "@/src/types/product";
import { formatCurrency, STOCK_STATUS_COLORS } from "../utils/categories";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SelectedVariant = {
  variant: ProductVariant;
  price: { amount: number; currency: string; unit?: string } | undefined;
};

type Props = {
  productId: string;
  /** Called whenever selection changes (or is cleared with null) */
  onSelect: (selection: SelectedVariant | null) => void;
  /** Whether to show add-to-cart / inquiry CTA inside the selector */
  showCTA?: boolean;
  /** Compact mode: just show the chips, no extra labels */
  compact?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract unique option keys in consistent order from all variants */
function extractOptionKeys(variants: ProductVariant[]): string[] {
  const keys = new Set<string>();
  variants.forEach((v) => { if (v.options) Object.keys(v.options).forEach((k) => keys.add(k)); });
  return Array.from(keys);
}

/** Given a set of selected options, find the matching variant */
function findMatch(variants: ProductVariant[], selected: Record<string, string>): ProductVariant | null {
  const keys = Object.keys(selected);
  if (keys.length === 0) return null;
  return (
    variants.find((v) => {
      if (!v.options) return false;
      return keys.every((k) => v.options![k] === selected[k]);
    }) ?? null
  );
}

/** For a given option key+value, is this combo still reachable given current selections? */
function isReachable(
  variants: ProductVariant[],
  optionKey: string,
  optionValue: string,
  currentSelected: Record<string, string>
): boolean {
  return variants.some((v) => {
    if (!v.options) return false;
    if (v.options[optionKey] !== optionValue) return false;
    // Check all other already-selected options match
    return Object.entries(currentSelected).every(([k, val]) => {
      if (k === optionKey) return true;
      return v.options![k] === val;
    });
  });
}

// ── VariantSelector ───────────────────────────────────────────────────────────

export const VariantSelector = ({ productId, onSelect, compact = false }: Props) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await productVariantService.list(productId, { limit: 100 });
      setVariants(res.variants ?? []);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load variants");
    } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  // Derive matched variant + notify parent whenever selection changes
  useEffect(() => {
    const match = findMatch(variants, selected);
    if (match) {
      onSelect({ variant: match, price: match.price });
    } else if (Object.keys(selected).length > 0) {
      onSelect(null);
    }
  }, [selected, variants, onSelect]);

  const optionKeys = extractOptionKeys(variants);
  const match = findMatch(variants, selected);
  const stock = match?.stockStatus ? STOCK_STATUS_COLORS[match.stockStatus] : null;

  const toggleOption = (key: string, value: string) => {
    setSelected((prev) => {
      if (prev[key] === value) {
        // Deselect
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-8 w-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--light-gray)" }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs" style={{ color: "var(--accent)" }}>
        Couldn't load variants — <button type="button" onClick={load} className="underline">retry</button>
      </p>
    );
  }

  if (variants.length === 0) return null;

  // If variants have no options (just base variants by name only)
  const hasOptions = optionKeys.length > 0;

  return (
    <div className="space-y-4">
      {!compact && (
        <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
          Options
        </p>
      )}

      {hasOptions ? (
        // ── Option-based selector (Color, Size, etc.) ─────────────────────────
        <div className="space-y-3">
          {optionKeys.map((key) => {
            // Collect all unique values for this key
            const values = Array.from(
              new Set(variants.filter((v) => v.options?.[key]).map((v) => v.options![key]))
            );

            return (
              <div key={key}>
                <p className="mb-1.5 text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                  {key}
                  {selected[key] && (
                    <span className="ml-2 font-bold" style={{ color: "var(--primary)" }}>: {selected[key]}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {values.map((val) => {
                    const isSelected = selected[key] === val;
                    const reachable = isReachable(variants, key, val, selected);
                    return (
                      <motion.button
                        key={val}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => reachable && toggleOption(key, val)}
                        disabled={!reachable}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: isSelected ? "var(--primary)" : reachable ? "var(--surface)" : "var(--light-gray)",
                          color: isSelected ? "#fff" : reachable ? "var(--foreground)" : "var(--medium-gray)",
                          opacity: reachable ? 1 : 0.45,
                          cursor: reachable ? "pointer" : "not-allowed",
                          textDecoration: !reachable ? "line-through" : "none",
                        }}>
                        {val}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ── Name-based selector (just variant titles) ─────────────────────────
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const isSelected = match?._id === v._id;
            return (
              <motion.button
                key={v._id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (isSelected) {
                    setSelected({});
                  } else {
                    // Select this variant by its ID via synthetic option
                    onSelect({ variant: v, price: v.price });
                  }
                }}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                  backgroundColor: isSelected ? "var(--primary)" : "var(--surface)",
                  color: isSelected ? "#fff" : "var(--foreground)",
                }}>
                {v.name}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Matched variant details */}
      <AnimatePresence>
        {match && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="rounded-2xl p-4 space-y-2"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                  Selected variant
                </p>
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{match.name}</p>
                {match.sku && (
                  <p className="text-[11px] font-mono" style={{ color: "var(--medium-gray)" }}>SKU · {match.sku}</p>
                )}
              </div>
              {stock && (
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ backgroundColor: stock.bg, color: stock.text }}>
                  {stock.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {match.price && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Price</p>
                  <p className="text-base font-bold" style={{ color: "var(--primary)" }}>
                    {formatCurrency(match.price.amount, match.price.currency)}
                    {match.price.unit && <span className="text-xs font-normal" style={{ color: "var(--medium-gray)" }}> / {match.price.unit}</span>}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Available</p>
                <p className="text-sm font-bold" style={{ color: match.availableQuantity > 0 ? "#15803D" : "#DC2626" }}>
                  {match.availableQuantity > 0 ? `${match.availableQuantity.toLocaleString("en-IN")} ${match.price?.unit ?? "units"}` : "Out of stock"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incomplete selection hint */}
      {Object.keys(selected).length > 0 && !match && hasOptions && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-xs" style={{ color: "var(--medium-gray)" }}>
          Select all options to see pricing and availability for this combination.
        </motion.p>
      )}
    </div>
  );
};
