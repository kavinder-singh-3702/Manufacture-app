"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import type { Product } from "@/src/types/product";
import { ProductCarousel } from "@/src/features/product/components/pdp";
import { ProductListRow } from "@/src/features/product/components/listing";
import { InhouseProductsShowcase } from "@/src/features/inhouse";
import { PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";

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
  const [subCategoriesByCategory, setSubCategoriesByCategory] = useState<Record<string, string[]>>({});

  const loadFeatured = useCallback(async () => {
    try {
      const res = await productService.list({ scope: "marketplace", limit: 8, includeVariantSummary: true });
      setProducts(res.products ?? []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  // Subcategory previews under each tile — matches IndiaMART's category
  // module density. Falls back to no preview lines if the request fails.
  useEffect(() => {
    productService.getCategoryStats({ scope: "marketplace" })
      .then((res) => {
        const map: Record<string, string[]> = {};
        (res.categories ?? []).forEach((c) => { map[c.id] = c.subCategories ?? []; });
        setSubCategoriesByCategory(map);
      })
      .catch(() => {});
  }, []);

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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PRODUCT_CATEGORIES.map((cat, i) => {
            const subCategories = (subCategoriesByCategory[cat.id] ?? []).slice(0, 3);
            return (
              <motion.div key={cat.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.24, delay: Math.min(i * 0.025, 0.28) }}
                whileHover={{ y: -3 }}>
                <Link href={`/products/category/${cat.id}`}
                  className="flex flex-col gap-2 rounded-2xl p-4 transition-shadow hover:shadow-lg"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: cat.bg }}>
                      {cat.icon}
                    </span>
                    <span className="text-[13px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                      {cat.title}
                    </span>
                  </div>
                  {subCategories.length > 0 && (
                    <ul className="space-y-0.5 pl-0.5">
                      {subCategories.map((sub) => (
                        <li key={sub} className="truncate text-[11px]" style={{ color: "var(--medium-gray)" }}>· {sub}</li>
                      ))}
                    </ul>
                  )}
                </Link>
              </motion.div>
            );
          })}
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
            <ProductCarousel
              items={products}
              itemKey={(p) => p._id}
              ariaLabel="Featured products"
              renderItem={(p) => <ProductListRow product={p} href={`/products/${encodeURIComponent(p._id)}`} variant="compact" />}
            />
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
