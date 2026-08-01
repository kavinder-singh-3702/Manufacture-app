"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import type { Product } from "@/src/types/product";
import { ProductCarousel } from "@/src/features/product/components/pdp";
import { ProductListRow } from "@/src/features/product/components/listing";
import { InhouseProductsShowcase } from "@/src/features/inhouse";
import { PRODUCT_CATEGORIES, getCategoryHref } from "@/src/features/product/utils/categories";
import { Section } from "@/src/components/ui/Surface";
import { fadeUp } from "@/src/components/ui/motion";

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
      <Section title="Browse by industry" reveal>
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
                <Link href={getCategoryHref(cat.id)}
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
      </Section>

      {/* ── In-house / ARVANN Select (admin-listed) — premium, above buyer grid ─ */}
      <InhouseProductsShowcase />

      {/* ── Featured products ──────────────────────────────────────────────── */}
      <Section
        title="Products on the marketplace"
        action={
          <Link href="/products"
            className="hidden items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold transition-opacity hover:opacity-70 sm:flex"
            style={{ border: "1px solid var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
            View all <span>→</span>
          </Link>
        }
      >
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
      </Section>

      {/* ── Sell CTA ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}
        className="relative overflow-hidden rounded-3xl p-8 text-center md:p-12"
        style={{ background: "var(--gradient-brand-deep)" }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-[0.07]" style={{ backgroundColor: "#fff" }} />

        <div className="relative">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Reach verified buyers across India
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}>
              Start selling free →
            </Link>
            <Link href="/products"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
              Explore marketplace
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
