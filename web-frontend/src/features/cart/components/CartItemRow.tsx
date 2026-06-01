"use client";

import { motion } from "framer-motion";
import { useCart } from "@/src/providers/CartProvider";
import type { CartItem } from "@/src/types/cart";
import { formatCurrency, getCategoryMeta } from "@/src/features/product/utils/categories";

export const CartItemRow = ({ item }: { item: CartItem }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, variant, quantity, lineKey } = item;
  const cat = getCategoryMeta(product.category);
  const price = variant?.price?.amount ?? product.price.amount;
  const currency = variant?.price?.currency ?? product.price.currency;
  const unit = variant?.price?.unit ?? product.price.unit;
  const cover = product.images?.[0]?.url;
  const lineTotal = price * quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.22 }}
      className="flex gap-3 rounded-2xl p-3"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
    >
      {/* Thumbnail */}
      <div
        className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl"
        style={{ backgroundColor: cat ? cat.bg : "var(--background)", border: "1px solid var(--border)" }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          cat?.icon ?? "📦"
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {product.name}
            </p>
            {variant && (
              <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{variant.name}</p>
            )}
            {product.company?.displayName && (
              <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>
                {product.company.displayName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeFromCart(lineKey)}
            className="flex-shrink-0 rounded-lg p-1 transition-opacity hover:opacity-60"
            style={{ color: "var(--medium-gray)" }}
            aria-label="Remove"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Qty controls */}
          <div
            className="flex items-center gap-0 overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--border)" }}
          >
            <button
              type="button"
              onClick={() => updateQuantity(lineKey, quantity - 1)}
              className="flex h-7 w-7 items-center justify-center text-base font-bold transition-colors hover:bg-[var(--primary-light)]"
              style={{ color: "var(--foreground)" }}
              aria-label="Decrease"
            >
              −
            </button>
            <span
              className="flex h-7 min-w-[2rem] items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "var(--background)", color: "var(--foreground)", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(lineKey, quantity + 1)}
              disabled={quantity >= product.availableQuantity}
              className="flex h-7 w-7 items-center justify-center text-base font-bold transition-colors hover:bg-[var(--primary-light)] disabled:opacity-40"
              style={{ color: "var(--foreground)" }}
              aria-label="Increase"
            >
              +
            </button>
          </div>

          {/* Line total */}
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {formatCurrency(lineTotal, currency)}
            </p>
            {quantity > 1 && (
              <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>
                {formatCurrency(price, currency)}{unit ? `/${unit}` : ""} × {quantity}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
