"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/src/providers/CartProvider";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";
import { useRouter } from "next/navigation";
import { AdCrossSell } from "@/src/features/ads/components/AdCrossSell";

export const CartPageContent = () => {
  const router = useRouter();
  const { items, eligibleItems, totalValue, clearCart } = useCart();

  const eligibleValue = eligibleItems.reduce(
    (s, i) => s + (i.variant?.price?.amount ?? i.product.price.amount) * i.quantity,
    0
  );

  const shortlistItems = items.filter((i) => !i.product.purchaseOptions?.checkoutEligible);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
            My cart
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Shopping Cart
            {items.length > 0 && (
              <span className="ml-2.5 rounded-full px-2.5 py-0.5 text-sm font-semibold align-middle"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                {items.length}
              </span>
            )}
          </h1>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={clearCart}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}>
            Clear cart
          </button>
        )}
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-5 rounded-3xl py-20 text-center"
          style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl text-5xl"
            style={{ backgroundColor: "var(--primary-light)" }}>🛒</div>
          <div className="space-y-1">
            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Your cart is empty</p>
            <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
              Browse the marketplace and add products to get started.
            </p>
          </div>
          <Link href="/dashboard/products"
            className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
            Browse products →
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: Cart items */}
          <div className="space-y-6">
            {/* Checkout-eligible items */}
            {eligibleItems.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                    Ready to checkout ({eligibleItems.length})
                  </p>
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                </div>
                <AnimatePresence initial={false}>
                  {eligibleItems.map((item) => (
                    <CartItemRow key={item.lineKey} item={item} />
                  ))}
                </AnimatePresence>
              </section>
            )}

            {/* Shortlist items (contact seller) */}
            {shortlistItems.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
                    Contact seller to buy ({shortlistItems.length})
                  </p>
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                </div>
                <div
                  className="rounded-2xl p-3.5 text-sm"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
                >
                  <p style={{ color: "var(--medium-gray)" }}>
                    These items are shortlisted — checkout isn&apos;t enabled. Contact the seller via the product page.
                  </p>
                </div>
                <AnimatePresence initial={false}>
                  {shortlistItems.map((item) => (
                    <CartItemRow key={item.lineKey} item={item} />
                  ))}
                </AnimatePresence>
              </section>
            )}

            <AdCrossSell />
          </div>

          {/* Right: summary */}
          <div className="space-y-4">
            <CartSummary
              items={items}
              totalValue={totalValue}
              eligibleValue={eligibleValue}
              onCheckout={() => router.push("/dashboard/checkout")}
              checkoutDisabled={eligibleItems.length === 0}
              ctaLabel={eligibleItems.length > 0 ? `Checkout ${eligibleItems.length} item${eligibleItems.length !== 1 ? "s" : ""}` : "No items to checkout"}
            />
            <Link href="/dashboard/products"
              className="block rounded-2xl py-3 text-center text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
              ← Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
