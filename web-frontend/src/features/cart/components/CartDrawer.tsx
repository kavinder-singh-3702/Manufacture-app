"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/src/providers/CartProvider";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const EmptyCartState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
  >
    <div
      className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
      style={{ backgroundColor: "var(--primary-light)" }}
    >
      🛒
    </div>
    <div className="space-y-1">
      <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>
        Your cart is empty
      </p>
      <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
        Browse the marketplace and add products to get started.
      </p>
    </div>
  </motion.div>
);

export const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const router = useRouter();
  const { items, totalCount, totalValue, eligibleItems, clearCart } = useCart();

  const eligibleValue = eligibleItems.reduce(
    (s, i) => s + (i.variant?.price?.amount ?? i.product.price.amount) * i.quantity,
    0
  );

  const handleCheckout = () => {
    onClose();
    router.push("/dashboard/checkout");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col"
            style={{ backgroundColor: "var(--surface)", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            role="dialog" aria-modal="true" aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                >
                  🛒
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                    Cart
                  </p>
                  <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                    {totalCount > 0 ? `${totalCount} item${totalCount !== 1 ? "s" : ""}` : "Shopping cart"}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-60"
                    style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl font-bold transition-opacity hover:opacity-60"
                  style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
                  aria-label="Close cart"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <EmptyCartState />
              ) : (
                <AnimatePresence initial={false}>
                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <CartItemRow key={item.lineKey} item={item} />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Summary footer */}
            {items.length > 0 && (
              <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
                <CartSummary
                  items={items}
                  totalValue={totalValue}
                  eligibleValue={eligibleValue}
                  onCheckout={handleCheckout}
                  checkoutDisabled={eligibleItems.length === 0}
                  ctaLabel={
                    eligibleItems.length === 0
                      ? "No items available for checkout"
                      : `Checkout ${eligibleItems.length} item${eligibleItems.length !== 1 ? "s" : ""}`
                  }
                />
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
