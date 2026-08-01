"use client";

/**
 * Owner's read-only view of one of their own products. Read-only on purpose:
 * every mutation lives on its own page (`/edit`) or in its own section
 * (variants), so this page only has to answer "what is currently published?".
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Product } from "@/src/types/product";
import { PageHeader, Card } from "@/src/components/ui/Surface";
import { useProductResource } from "../../hooks/useProductResource";
import { useDeleteProduct } from "../../hooks/useDeleteProduct";
import { formatCurrency, getCategoryMeta, STATUS_COLORS, STOCK_STATUS_COLORS } from "../../utils/categories";
import { buildAdditionalInfoRows, buildSpecRows } from "../../utils/specs";
import { MY_PRODUCTS_HREF, myProductEditHref } from "../../utils/links";
import { SpecTable } from "../pdp";
import { ProductVariantsContainer } from "../ProductVariantsContainer";
import { MyProductLoadError, MyProductSkeleton, MyProductsCrumb } from "./shared";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, delay },
});

// ── Gallery ───────────────────────────────────────────────────────────────────

const Gallery = ({ product }: { product: Product }) => {
  const [active, setActive] = useState(0);
  const images = product.images?.filter((img) => Boolean(img.url)) ?? [];
  const cat = getCategoryMeta(product.category);
  const cover = images[active]?.url;

  return (
    <div className="space-y-2.5">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl"
        style={{
          border: "1px solid var(--border)",
          background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--background)",
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <span className="text-5xl">{cat?.icon ?? "📦"}</span>
            <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>No photos yet</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.key ?? img.url ?? i}
              type="button"
              onClick={() => setActive(i)}
              className="aspect-square overflow-hidden rounded-xl transition-opacity hover:opacity-80"
              style={{ border: i === active ? "1.5px solid var(--primary)" : "1px solid var(--border)" }}
              aria-label={`View photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" decoding="async" src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Summary ───────────────────────────────────────────────────────────────────

const Metric = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>{label}</p>
    <p className="mt-0.5 text-sm font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
    {hint && <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>{hint}</p>}
  </div>
);

const Summary = ({ product }: { product: Product }) => {
  const cat = getCategoryMeta(product.category);
  const status = STATUS_COLORS[product.status] ?? STATUS_COLORS.draft;
  const stock = product.stockStatus ? STOCK_STATUS_COLORS[product.stockStatus] : null;
  const isPublic = product.visibility === "public";

  return (
    <Card padding="lg" tone="surface" className="space-y-5">
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
          {status.label}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: isPublic ? "var(--primary-light)" : "var(--background)",
            color: isPublic ? "var(--primary)" : "var(--medium-gray)",
            border: isPublic ? "none" : "1px solid var(--border)",
          }}
        >
          {isPublic ? "Public" : "Private"}
        </span>
        {stock && (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: stock.bg, color: stock.text }}
          >
            {stock.label}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          {formatCurrency(product.price.amount, product.price.currency)}
        </span>
        {product.price.unit && (
          <span className="text-sm" style={{ color: "var(--medium-gray)" }}>/ {product.price.unit}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <Metric
          label="Available"
          value={`${product.availableQuantity.toLocaleString("en-IN")}${product.unit ? ` ${product.unit}` : ""}`}
          hint={`Low-stock alert at ${product.minStockQuantity.toLocaleString("en-IN")}`}
        />
        <Metric label="Category" value={cat?.title ?? product.category} hint={product.subCategory} />
        {product.sku && <Metric label="SKU" value={product.sku} />}
        <Metric label="Last updated" value={new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
      </div>

      <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>
        {isPublic
          ? "Buyers can find this product in marketplace search."
          : "Only your team can see this product — switch visibility to Public to list it."}
      </p>
    </Card>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const MyProductDetailContainer = ({ productId }: { productId: string }) => {
  const router = useRouter();
  const { product, loading, error, notFound, reload } = useProductResource(productId);
  const { requestDelete, deletingId } = useDeleteProduct();

  if (loading) return <MyProductSkeleton />;
  if (!product) return <MyProductLoadError notFound={notFound} message={error} onRetry={reload} />;

  const specRows = buildSpecRows(product);
  const additionalRows = buildAdditionalInfoRows(product);
  const deleting = deletingId === product._id;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={<MyProductsCrumb current={product.name} />}
        title={product.name}
        actions={
          <>
            <Link
              href={myProductEditHref(product._id)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M11 4h-7v16h16v-7M19 4l-9 9M14 4h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit
            </Link>
            <button
              type="button"
              disabled={deleting}
              onClick={() => requestDelete(product, () => router.push(MY_PRODUCTS_HREF))}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ border: "1px solid var(--border)", color: "var(--accent)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <motion.div {...fadeUp(0)} className="lg:col-span-2">
          <Gallery product={product} />
        </motion.div>
        <motion.div {...fadeUp(0.05)} className="lg:col-span-3">
          <Summary product={product} />
        </motion.div>
      </div>

      {product.description && (
        <motion.div {...fadeUp(0.1)}>
          <Card padding="lg" tone="surface">
            <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed" style={{ color: "var(--medium-gray)" }}>
              {product.description}
            </p>
          </Card>
        </motion.div>
      )}

      {(specRows.length > 0 || additionalRows.length > 0) && (
        <motion.div {...fadeUp(0.15)}>
          <Card padding="lg" tone="surface" className="space-y-5">
            {specRows.length > 0 && (
              <div>
                <h2 className="mb-2.5 text-sm font-bold" style={{ color: "var(--foreground)" }}>Specifications</h2>
                <SpecTable rows={specRows} />
              </div>
            )}
            {additionalRows.length > 0 && (
              <div>
                <h2 className="mb-2.5 text-sm font-bold" style={{ color: "var(--foreground)" }}>Additional information</h2>
                <SpecTable rows={additionalRows} />
              </div>
            )}
          </Card>
        </motion.div>
      )}

      <motion.div {...fadeUp(0.2)}>
        <Card padding="lg" tone="surface">
          <ProductVariantsContainer productId={product._id} canEdit />
        </Card>
      </motion.div>
    </div>
  );
};
