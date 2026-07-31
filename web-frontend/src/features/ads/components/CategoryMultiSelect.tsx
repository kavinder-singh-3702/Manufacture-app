"use client";

/**
 * Multi-select category chip picker for ad targeting (shopper/buy-intent
 * category arrays) — shared by the admin Ad Studio wizard and the seller
 * "Promote a product" advertisement request form. Previously a private
 * component inside AdStudioPanel.tsx.
 */

import { PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";

export type CategoryMultiSelectProps = {
  label: string;
  selected: string[];
  onToggle: (id: string) => void;
};

export const CategoryMultiSelect = ({ label, selected, onToggle }: CategoryMultiSelectProps) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
      {label}
    </label>
    <div className="flex flex-wrap gap-1.5">
      {PRODUCT_CATEGORIES.map((c) => {
        const active = selected.includes(c.id);
        return (
          <button key={c.id} type="button" onClick={() => onToggle(c.id)}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all"
            style={{
              backgroundColor: active ? "var(--primary)" : "var(--surface)",
              color: active ? "#fff" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}>
            {c.icon} {c.title}
          </button>
        );
      })}
    </div>
  </div>
);
