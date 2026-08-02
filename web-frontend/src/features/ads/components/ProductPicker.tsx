"use client";

/**
 * Marketplace product search/select modal — shared by the admin Ad Studio
 * (AdStudioPanel) and the seller-facing "Promote a product" advertisement
 * request flow (ServiceRequestForm), so there is exactly one implementation
 * of "search my marketplace products and pick one" instead of two drifting
 * copies. Previously lived only inside AdStudioPanel.tsx.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { productService } from "@/src/services/product";
import { isAbortError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import { Modal } from "@/src/components/ui/Modal";

export type ProductPickerProps = {
  onSelect: (p: Product) => void;
  onClose: () => void;
  /** Restrict results to products owned by the current user/company (e.g. the seller ad-request flow). Defaults to the full marketplace, matching the admin studio. */
  scope?: "marketplace" | "company";
};

export const ProductPicker = ({ onSelect, onClose, scope = "marketplace" }: ProductPickerProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (q: string) => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    setLoading(true);
    try {
      const res = await productService.list({ scope, search: q || undefined, limit: 40 }, controller.signal);
      setResults(res.products ?? []);
    } catch (err) {
      if (isAbortError(err)) return; // superseded/unmounted — ignore
      setResults([]);
    } finally {
      if (loadAbortRef.current === controller) setLoading(false);
    }
  }, [scope]);

  useEffect(() => { load(""); }, [load]);
  useEffect(() => { const t = setTimeout(() => load(search), 250); return () => clearTimeout(t); }, [load, search]);

  return (
    <Modal open onClose={onClose} ariaLabel="Select product">
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Select product</p>
        <button type="button" onClick={onClose} style={{ touchAction: "manipulation", color: "var(--medium-gray)" }}
          className="text-lg font-bold leading-none hover:opacity-60">✕</button>
      </div>
      <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus placeholder="Search marketplace products…"
          data-modal-initial-focus="true"
          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
          </div>
        ) : !results.length ? (
          <p className="py-8 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No products found.</p>
        ) : results.map((p) => (
          <button key={p._id} type="button" onClick={() => onSelect(p)}
            style={{ borderBottom: "1px solid var(--border)", touchAction: "manipulation" }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--background)]">
            {p.images?.[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={p.images[0].url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--background)" }}>📦</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.name}</p>
              <p className="text-xs" style={{ color: "var(--medium-gray)" }}>₹{p.price.amount.toLocaleString("en-IN")} · {p.category}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};
