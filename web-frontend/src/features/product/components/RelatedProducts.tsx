"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import type { Product } from "@/src/types/product";
import { getCategoryMeta } from "../utils/categories";

// ── Mini card shared between both sections ────────────────────────────────────

const MiniCard = ({ product, href, delay }: { product: Product; href: string; delay: number }) => {
  const cat = getCategoryMeta(product.category);
  const img = product.images?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ y: -3 }}
      className="flex-shrink-0 w-52">
      <Link href={href}
        className="group flex flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        {/* Thumb */}
        <div className="relative aspect-[4/3] overflow-hidden"
          style={{ background: cat ? `linear-gradient(135deg, ${cat.bg}, ${cat.bg}cc)` : "var(--light-gray)" }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.name}
              className="h-full w-full object-cover transition-transform duration-400 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">{cat?.icon ?? "📦"}</div>
          )}
        </div>
        {/* Info */}
        <div className="space-y-1 p-3">
          <p className="line-clamp-2 text-xs font-bold leading-snug" style={{ color: "var(--foreground)" }}>
            {product.name}
          </p>
          {product.company?.displayName && (
            <p className="truncate text-[10px]" style={{ color: "var(--medium-gray)" }}>{product.company.displayName}</p>
          )}
          <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
            ₹{product.price.amount.toLocaleString("en-IN")}
            {product.price.unit && <span className="text-[10px] font-normal" style={{ color: "var(--medium-gray)" }}> /{product.price.unit}</span>}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

const RowSkeleton = () => (
  <div className="flex gap-3 overflow-x-hidden">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex-shrink-0 w-52">
        <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          <div className="aspect-[4/3] animate-pulse" style={{ backgroundColor: "var(--light-gray)" }} />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
            <div className="h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ── Section wrapper ───────────────────────────────────────────────────────────

const Section = ({
  title,
  subtitle,
  icon,
  products,
  loading,
  getHref,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  products: Product[];
  loading: boolean;
  getHref: (p: Product) => string;
}) => {
  if (!loading && products.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
            {icon} {title}
          </p>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{subtitle}</p>}
        </div>
      </div>

      {loading ? <RowSkeleton /> : (
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
          {products.map((p, i) => (
            <MiniCard key={p._id} product={p} href={getHref(p)} delay={i * 0.04} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── RelatedProducts ───────────────────────────────────────────────────────────

type Props = {
  productId: string;
  companyId?: string;
  companyName?: string;
  category: string;
  /** Route prefix for product links. Default "/products" (public). Use "/dashboard/products" for dashboard. */
  routePrefix?: string;
};

export const RelatedProducts = ({
  productId,
  companyId,
  companyName,
  category,
  routePrefix = "/products",
}: Props) => {
  const [fromSeller, setFromSeller] = useState<Product[]>([]);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loadingSeller, setLoadingSeller] = useState(!!companyId);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  const makeHref = useCallback(
    (p: Product) =>
      routePrefix === "/products"
        ? `/products/detail/?productId=${encodeURIComponent(p._id)}`
        : `/dashboard/products/detail?productId=${encodeURIComponent(p._id)}`,
    [routePrefix]
  );

  useEffect(() => {
    if (!companyId) return;
    productService
      .list({ scope: "marketplace", companyId, limit: 8, includeVariantSummary: false })
      .then((res) => {
        setFromSeller((res.products ?? []).filter((p) => p._id !== productId).slice(0, 6));
      })
      .catch(() => setFromSeller([]))
      .finally(() => setLoadingSeller(false));
  }, [companyId, productId]);

  useEffect(() => {
    productService
      .list({ scope: "marketplace", category, limit: 10, includeVariantSummary: false })
      .then((res) => {
        setSimilar(
          (res.products ?? [])
            .filter((p) => p._id !== productId && p.company?._id !== companyId)
            .slice(0, 6)
        );
      })
      .catch(() => setSimilar([]))
      .finally(() => setLoadingSimilar(false));
  }, [category, productId, companyId]);

  const bothEmpty = !loadingSeller && !loadingSimilar && fromSeller.length === 0 && similar.length === 0;
  if (bothEmpty) return null;

  return (
    <div className="space-y-8">
      {/* Divider */}
      <div className="border-t" style={{ borderColor: "var(--border)" }} />

      {companyId && (
        <Section
          title="More from this seller"
          subtitle={companyName}
          icon="🏭"
          products={fromSeller}
          loading={loadingSeller}
          getHref={makeHref}
        />
      )}

      <Section
        title="Similar products"
        subtitle="From other verified manufacturers"
        icon="🔗"
        products={similar}
        loading={loadingSimilar}
        getHref={makeHref}
      />
    </div>
  );
};
