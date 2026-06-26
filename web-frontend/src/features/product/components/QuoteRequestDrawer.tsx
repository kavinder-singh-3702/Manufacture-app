"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/src/types/product";
import type { AuthUser } from "@/src/types/auth";
import type { SelectedVariant } from "./VariantSelector";
import { QuoteRequestForm } from "./QuoteRequestForm";
import { useToast } from "@/src/components/ui/Toast";

export const QuoteRequestDrawer = ({
  open,
  product,
  user,
  selectedVariant,
  onClose,
  onSuccess,
}: {
  open: boolean;
  product: Product;
  user?: AuthUser;
  selectedVariant?: SelectedVariant | null;
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const toast = useToast();

  // Unlike the inquiry drawer we don't auto-close: the form's success state
  // offers a "View my quotes" link the buyer may want to follow.
  const handleSuccess = () => {
    toast.success("Quote requested", `The seller of "${product.name}" will respond with pricing.`);
    onSuccess?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col"
            style={{ backgroundColor: "var(--surface)", boxShadow: "-8px 0 30px rgba(0,0,0,0.10)" }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            role="dialog" aria-modal="true">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                  Request a quote
                </p>
                <h2 className="text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                  {product.name}
                </h2>
                {product.company?.displayName && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>
                    by {product.company.displayName}
                  </p>
                )}
              </div>
              <button type="button" onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
                aria-label="Close">
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6" style={{ overscrollBehavior: "none" }}>
              <QuoteRequestForm
                product={product}
                selectedVariant={selectedVariant}
                user={user}
                onSuccess={handleSuccess}
                onCancel={onClose}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
