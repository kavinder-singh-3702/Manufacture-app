"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import type { Product } from "@/src/types/product";
import { getBuyerStock, getCategoryMeta } from "@/src/features/product/utils/categories";
import { InhouseProductsShowcase } from "@/src/features/inhouse";

// ── Categories data ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "food-beverage-manufacturing",          title: "Food & Beverage",   icon: "🍚", bg: "#FEF3C7", text: "#92400E" },
  { id: "textile-apparel-manufacturing",        title: "Textile & Apparel", icon: "👕", bg: "#F3E8FF", text: "#6D28D9" },
  { id: "paper-packaging-industry",             title: "Paper & Pack",      icon: "📦", bg: "#E0F2FE", text: "#0369A1" },
  { id: "chemical-manufacturing",               title: "Chemicals",         icon: "⚗️", bg: "#FFE4E6", text: "#9F1239" },
  { id: "pharmaceutical-medical",               title: "Pharma",            icon: "💊", bg: "#E0E7FF", text: "#3730A3" },
  { id: "plastic-polymer-industry",             title: "Plastics",          icon: "🧴", bg: "#DCFCE7", text: "#166534" },
  { id: "metal-steel-industry",                 title: "Metal & Steel",     icon: "🏗️", bg: "#F1F5F9", text: "#334155" },
  { id: "automobile-auto-components",           title: "Automobile",        icon: "🚗", bg: "#FEE2E2", text: "#B91C1C" },
  { id: "electrical-electronics-manufacturing", title: "Electronics",       icon: "🔌", bg: "#DBEAFE", text: "#1D4ED8" },
  { id: "machinery-heavy-engineering",          title: "Machinery",         icon: "⚙️", bg: "#EDE9FE", text: "#6D28D9" },
  { id: "construction-material-industry",       title: "Construction",      icon: "🧱", bg: "#FFEDD5", text: "#9A3412" },
  { id: "consumer-goods-fmcg",                  title: "Consumer Goods",    icon: "🧼", bg: "#ECFDF5", text: "#065F46" },
] as const;

// ── Mini product card (for homepage preview) ──────────────────────────────────

const MiniProductCard = ({ product, index }: { product: Product; index: number }) => {
  const cat = getCategoryMeta(product.category);
  const img = product.images?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/products/${encodeURIComponent(product._id)}`}
        className="group flex flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-xl"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden"
          style={{ background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--light-gray)" }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={img} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">{cat?.icon ?? "📦"}</div>
          )}
        </div>
        {/* Info */}
        <div className="flex flex-col gap-1.5 p-3">
          <p className="line-clamp-2 text-sm font-bold leading-snug" style={{ color: "var(--foreground)" }}>{product.name}</p>
          {product.company?.displayName && (
            <p className="text-[11px] font-medium truncate" style={{ color: "var(--medium-gray)" }}>
              {product.company.displayName}
            </p>
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              ₹{product.price.amount.toLocaleString("en-IN")}
              {product.price.unit && <span className="text-xs font-normal" style={{ color: "var(--medium-gray)" }}>/{product.price.unit}</span>}
            </span>
            {(() => {
              const s = getBuyerStock(product.stockStatus, product.availableQuantity);
              return (
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ backgroundColor: s.bg, color: s.fg }}>
                  {s.label}
                </span>
              );
            })()}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProductSkeleton = () => (
  <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
    <div className="aspect-[4/3] animate-pulse" style={{ backgroundColor: "var(--light-gray)" }} />
    <div className="space-y-2 p-3">
      <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
    </div>
  </div>
);

// ── MarketplaceSection ────────────────────────────────────────────────────────

export const MarketplaceSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeatured = useCallback(async () => {
    try {
      const res = await productService.list({ scope: "marketplace", limit: 8, includeVariantSummary: true });
      setProducts(res.products ?? []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  return (
    <div className="space-y-16">
      {/* ── Browse by Industry ─────────────────────────────────────────────── */}
      <section id="marketplace">
        <div className="mb-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.3 }}
            className="text-xs font-bold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Marketplace
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.06 }}
            className="mt-2 text-3xl font-bold md:text-4xl" style={{ color: "var(--foreground)" }}>
            Browse by industry
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-2 text-base" style={{ color: "var(--medium-gray)" }}>
            Source directly from India's verified manufacturers across every sector.
          </motion.p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.24, delay: Math.min(i * 0.025, 0.28) }}
              whileHover={{ y: -4, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}>
              <Link href={`/products/category/${cat.id}`}
                className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-shadow hover:shadow-lg"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: cat.bg }}>
                  {cat.icon}
                </span>
                <span className="text-[11px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                  {cat.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── In-house / ARVANN Select (admin-listed) — premium, above buyer grid ─ */}
      <InhouseProductsShowcase />

      {/* ── Featured products ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.28 }}
              className="text-xs font-bold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
              Live listings
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.28, delay: 0.05 }}
              className="mt-1 text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
              Products on the marketplace
            </motion.h2>
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Link href="/products"
              className="hidden items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold transition-opacity hover:opacity-70 sm:flex"
              style={{ border: "1px solid var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
              View all <span>→</span>
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3"
            style={{ border: "1px dashed var(--border)", borderRadius: "1.5rem" }}>
            <p className="text-4xl">📦</p>
            <p className="text-sm font-semibold" style={{ color: "var(--medium-gray)" }}>No products listed yet — be the first!</p>
            <Link href="/signup" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white mt-1"
              style={{ backgroundColor: "var(--primary)" }}>
              List your products →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p, i) => <MiniProductCard key={p._id} product={p} index={i} />)}
            </div>
            <div className="mt-8 flex justify-center">
              <Link href="/products"
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: "var(--primary)", boxShadow: "0 8px 24px rgba(20,141,178,0.3)" }}>
                Browse all products →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── Sell CTA ──────────────────────────────────────────────────────── */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl p-8 text-center md:p-12"
          style={{ background: "var(--gradient-brand-deep)" }}>
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-[0.07]" style={{ backgroundColor: "#fff" }} />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-white/60">Sell on ARVANN</p>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
              Reach thousands of verified buyers
            </h2>
            <p className="mt-2 text-base text-white/70 max-w-xl mx-auto">
              List your products, get verified, and start receiving quote requests from enterprise manufacturers across India.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "#D5616D", boxShadow: "0 8px 24px rgba(213,97,109,0.40)" }}>
                Start selling free →
              </Link>
              <Link href="/products"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                Explore marketplace
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
              {[
                { icon: "🆓", label: "Free to list" },
                { icon: "🛡️", label: "Verified sellers" },
                { icon: "📋", label: "Direct RFQs" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm text-white/70">
                  <span>{f.icon}</span> {f.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
