"use client";

/**
 * Slide-over wrapper around the shared product form. All state, validation
 * and payload building live in `useProductForm`; all field JSX lives in
 * `ProductFormFields` — this file is only the drawer chrome, so it can never
 * drift from the full-page create/edit routes.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/src/types/product";
import { useProductForm, type ProductFormSubmit } from "../hooks/useProductForm";
import { ProductFormError, ProductFormFields } from "./ProductFormFields";

export const ProductFormDrawer = ({
  open,
  product,
  onClose,
  onSubmit,
}: {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSubmit: ProductFormSubmit;
}) => {
  const api = useProductForm(product);
  const { error, saving, reset } = api;

  // The drawer stays mounted between openings, so the form has to be re-seeded
  // each time it opens (and whenever the product being edited changes).
  useEffect(() => {
    if (open) reset(product);
  }, [open, product, reset]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col"
            style={{ backgroundColor: "var(--surface)", boxShadow: "-8px 0 30px rgba(0,0,0,0.10)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                  {product ? "Edit product" : "New product"}
                </p>
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  {product ? product.name : "Create a product"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <form onSubmit={api.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6" style={{ overscrollBehavior: "none" }}>
                <ProductFormFields api={api} existingImages={product?.images} />
                {error && <ProductFormError message={error} />}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-2 px-6 py-4"
                style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
                >
                  {saving ? "Saving…" : product ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
