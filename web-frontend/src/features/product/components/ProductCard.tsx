"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/src/types/product";
import { formatCurrency, getCategoryMeta, STATUS_COLORS, STOCK_STATUS_COLORS } from "../utils/categories";

const StockBar = ({ available, min }: { available: number; min: number }) => {
  const ratio = min > 0 ? Math.min(available / Math.max(min * 2, 1), 1) : Math.min(available / 50, 1);
  const color = available === 0 ? "#EF4444" : available <= min ? "#F59E0B" : "#22C55E";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--light-gray)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${ratio * 100}%` }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

export const ProductCard = ({ product, index = 0 }: { product: Product; index?: number }) => {
  const cat = getCategoryMeta(product.category);
  const status = STATUS_COLORS[product.status] ?? STATUS_COLORS.draft;
  const stockStatus = product.stockStatus ? STOCK_STATUS_COLORS[product.stockStatus] : null;
  const cover = product.images?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/dashboard/products/${product._id}`}
        className="group relative block overflow-hidden rounded-2xl transition-shadow duration-200"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
      >
        {/* Image / Cover */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden"
          style={{ background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--background)" }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              {cat?.icon ?? "📦"}
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md"
              style={{ backgroundColor: status.bg, color: status.text }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
              {status.label}
            </span>
            {product.visibility === "private" && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md"
                style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#475569" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
                </svg>
                Private
              </span>
            )}
          </div>

          {/* Top-right favorite */}
          {product.isFavorite && (
            <div className="absolute right-3 top-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#D5616D" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z" />
                </svg>
              </span>
            </div>
          )}

          {/* Bottom stock badge */}
          {stockStatus && (
            <div className="absolute bottom-3 right-3">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md"
                style={{ backgroundColor: stockStatus.bg, color: stockStatus.text }}
              >
                {stockStatus.label}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          {/* Category */}
          {cat && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: cat.text }}>
              {cat.title}
            </p>
          )}

          {/* Name */}
          <div>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              {product.name}
            </h3>
            {product.sku && (
              <p className="mt-0.5 text-[11px] font-mono" style={{ color: "var(--medium-gray)" }}>
                SKU · {product.sku}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              {formatCurrency(product.price.amount, product.price.currency)}
            </span>
            {product.price.unit && (
              <span className="text-xs" style={{ color: "var(--medium-gray)" }}>
                / {product.price.unit}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: "var(--medium-gray)" }}>Available</span>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                {product.availableQuantity.toLocaleString("en-IN")}{product.unit ? ` ${product.unit}` : ""}
              </span>
            </div>
            <StockBar available={product.availableQuantity} min={product.minStockQuantity} />
          </div>

          {/* Footer — company */}
          {product.company?.displayName && (
            <div
              className="flex items-center justify-between border-t pt-3"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="truncate text-xs" style={{ color: "var(--medium-gray)" }}>
                {product.company.displayName}
              </p>
              {product.purchaseOptions?.checkoutEligible && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                >
                  Buy now
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};
