"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/src/types/product";
import { formatCurrency, getBuyerStock, getCategoryMeta } from "@/src/features/product/utils/categories";
import { getProductRating } from "../constants";

// ── Rating stars ────────────────────────────────────────────────────────────
const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`Rated ${rating.toFixed(1)} of 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className="text-[13px] leading-none" style={{ color: "#F5B301", opacity: rating >= i + 1 ? 1 : 0.25 }}>
        ★
      </span>
    ))}
    <span className="ml-1 text-[11px] font-semibold" style={{ color: "var(--medium-gray)" }}>
      {rating.toFixed(1)}
    </span>
  </div>
);

export type InhouseProductCardProps = {
  product: Product;
  index?: number;
  /**
   * Optional add-to-cart handler. When provided the card shows an "Add to cart"
   * button in place of "View details" — kept for future authenticated surfaces
   * (the card itself stays context-agnostic). Defaults to a "View details" link.
   */
  onAddToCart?: (product: Product) => void;
};

/**
 * Premium product card for the in-house / ARVANN Select catalog. Visually
 * elevated vs. the plain marketplace card: gilded "Select" ribbon, verified
 * badge, rating, category tag, brand accent line + hover lift. Theme-aware via
 * semantic CSS vars. Mirrors the visual language of the mobile
 * `AmazonStyleProductCard` used on the mobile Shop tab.
 */
export const InhouseProductCard = ({ product, index = 0, onAddToCart }: InhouseProductCardProps) => {
  const cat = getCategoryMeta(product.category);
  const img = product.images?.[0]?.url;
  const stock = getBuyerStock(product.stockStatus, product.availableQuantity);
  const rating = getProductRating(product);
  const verified = product.company?.complianceStatus === "approved";
  const seller = product.company?.displayName || "ARVANN";
  const detailHref = `/products/${encodeURIComponent(product._id)}`;

  const CardShell = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Premium gilded top hairline */}
      <div
        className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, #E0B357 0%, #F5D98B 50%, #C9922F 100%)" }}
      />

      {/* Image */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--light-gray)" }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            decoding="async"
            src={img}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">{cat?.icon ?? "📦"}</div>
        )}

        {/* ARVANN Select ribbon */}
        <div className="absolute left-3 top-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #148DB2 0%, #0F6E8C 100%)" }}
          >
            ✦ Select
          </span>
        </div>

        {/* Verified badge */}
        {verified && (
          <div className="absolute right-3 top-3">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold backdrop-blur-sm"
              style={{ backgroundColor: "color-mix(in srgb, var(--success) 16%, white)", color: "var(--success)" }}
            >
              ✓ Verified
            </span>
          </div>
        )}

        {/* Out-of-stock scrim */}
        {!stock.available && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: "rgba(220,38,38,0.9)" }}>
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {cat && (
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: cat.text }}>
            {cat.title}
          </span>
        )}

        <h3 className="line-clamp-2 text-[15px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
          {product.name}
        </h3>

        <p className="truncate text-xs font-medium" style={{ color: "var(--medium-gray)" }}>
          by {seller}
        </p>

        {rating !== null && <RatingStars rating={rating} />}

        <div className="mt-auto space-y-2.5 pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold" style={{ color: "var(--foreground)" }}>
              {formatCurrency(product.price.amount, product.price.currency)}
            </span>
            {product.price.unit && (
              <span className="text-xs" style={{ color: "var(--medium-gray)" }}>
                / {product.price.unit}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
              style={{ backgroundColor: stock.bg, color: stock.fg, border: `1px solid ${stock.border}` }}
            >
              {stock.icon} {stock.label}
            </span>
            {(product.variantSummary?.totalVariants ?? 0) > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
              >
                {product.variantSummary!.totalVariants} variants
              </span>
            )}
          </div>

          {/* Primary action */}
          {onAddToCart ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={!stock.available}
              className="w-full rounded-xl px-3 py-2.5 text-center text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--gradient-brand)" }}
            >
              Add to cart
            </button>
          ) : (
            <span
              className="block w-full rounded-xl px-3 py-2.5 text-center text-xs font-bold text-white transition-opacity group-hover:opacity-90"
              style={{ backgroundColor: "var(--primary)" }}
            >
              View details
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  // When there's no cart handler the whole card is a link to the detail page.
  if (onAddToCart) return CardShell;
  return (
    <Link href={detailHref} className="block h-full">
      {CardShell}
    </Link>
  );
};
