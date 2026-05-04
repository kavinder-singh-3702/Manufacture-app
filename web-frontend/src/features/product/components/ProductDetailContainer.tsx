"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { CreateProductInput, Product } from "@/src/types/product";
import { formatCurrency, getCategoryMeta, STATUS_COLORS, STOCK_STATUS_COLORS } from "../utils/categories";
import { ProductFormDrawer } from "./ProductFormDrawer";

export const ProductDetailContainer = ({ productId }: { productId: string }) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirm" | "deleting">("idle");
  const [activeImage, setActiveImage] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const p = await productService.get(productId, { includeVariantSummary: true });
      setProduct(p);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Failed to load product";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const handleAdjustQty = async (delta: number) => {
    if (!product) return;
    try {
      setAdjusting(true);
      const updated = await productService.adjustQuantity(product._id, delta);
      setProduct(updated);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Couldn't adjust quantity";
      setError(message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleSave = async (data: CreateProductInput) => {
    if (!product) return;
    const updated = await productService.update(product._id, data);
    setProduct(updated);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      setDeleteState("deleting");
      await productService.remove(product._id);
      router.push("/dashboard/products");
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Couldn't delete";
      setError(message);
      setDeleteState("idle");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-3xl" style={{ backgroundColor: "var(--light-gray)" }} />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--light-gray)" }} />
          <div className="h-48 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--light-gray)" }} />
          <div className="h-48 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--light-gray)" }} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Product not found</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>{error ?? "It may have been deleted."}</p>
        <Link
          href="/dashboard/products"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--primary)", color: "#fff" }}
        >
          ← Back to products
        </Link>
      </div>
    );
  }

  const cat = getCategoryMeta(product.category);
  const status = STATUS_COLORS[product.status] ?? STATUS_COLORS.draft;
  const stockStatus = product.stockStatus ? STOCK_STATUS_COLORS[product.stockStatus] : null;
  const images = product.images ?? [];
  const cover = images[activeImage]?.url ?? images[0]?.url;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/products" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
          Products
        </Link>
        <span style={{ color: "var(--medium-gray)" }}>/</span>
        <span style={{ color: "var(--foreground)" }}>{product.name}</span>
      </motion.div>

      {/* Hero card — image gallery + summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid gap-6 overflow-hidden rounded-3xl p-5 lg:grid-cols-[420px_1fr] lg:p-7"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
      >
        {/* Image */}
        <div className="space-y-3">
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl"
            style={{ background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--background)" }}
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">{cat?.icon ?? "📦"}</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.url || i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all"
                  style={{ border: i === activeImage ? "2px solid var(--primary)" : "1px solid var(--border)" }}
                >
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              {cat && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: cat.bg, color: cat.text }}
                >
                  <span>{cat.icon}</span>
                  {cat.title}{product.subCategory ? ` · ${product.subCategory}` : ""}
                </span>
              )}
              <h1 className="text-2xl font-bold leading-tight md:text-3xl" style={{ color: "var(--foreground)" }}>
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-xs font-mono" style={{ color: "var(--medium-gray)" }}>SKU · {product.sku}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{ backgroundColor: status.bg, color: status.text }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                {status.label}
              </span>
              {stockStatus && (
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold"
                  style={{ backgroundColor: stockStatus.bg, color: stockStatus.text }}
                >
                  {stockStatus.label}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.05) 100%)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
              Price
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                {formatCurrency(product.price.amount, product.price.currency)}
              </span>
              {product.price.unit && (
                <span className="text-sm" style={{ color: "var(--medium-gray)" }}>
                  / {product.price.unit}
                </span>
              )}
            </div>
          </div>

          {/* Stock controls */}
          <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                  Available
                </p>
                <p className="mt-0.5 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {product.availableQuantity.toLocaleString("en-IN")}
                  {product.unit && <span className="ml-1 text-base font-medium" style={{ color: "var(--medium-gray)" }}>{product.unit}</span>}
                </p>
                <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>
                  Reorder at {product.minStockQuantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjustQty(-1)}
                  disabled={adjusting || product.availableQuantity <= 0}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold disabled:opacity-40"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
                  aria-label="Decrease"
                >−</button>
                <button
                  type="button"
                  onClick={() => handleAdjustQty(1)}
                  disabled={adjusting}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}
                  aria-label="Increase"
                >+</button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4h-7v16h16v-7M19 4l-9 9M14 4h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit product
            </button>
            <button
              type="button"
              onClick={() => setDeleteState("confirm")}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--accent)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      {product.description && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl p-6"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
            Description
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {product.description}
          </p>
        </motion.div>
      )}

      {/* Meta grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[
          { label: "Visibility", value: product.visibility },
          { label: "Created", value: new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
          { label: "Last updated", value: new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
          { label: "Currency", value: product.price.currency },
          { label: "Variants", value: product.variantSummary?.totalVariants ?? 0 },
          { label: "Company", value: product.company?.displayName ?? "—" },
        ].map((row) => (
          <div
            key={row.label}
            className="rounded-2xl p-4"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>{row.label}</p>
            <p className="mt-1.5 text-sm font-semibold capitalize" style={{ color: "var(--foreground)" }}>{String(row.value)}</p>
          </div>
        ))}
      </motion.div>

      {/* Edit drawer */}
      <ProductFormDrawer
        open={editOpen}
        product={product}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSave}
      />

      {/* Delete confirm modal */}
      {deleteState !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="m12 3 9 16H3l9-16zm0 6v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-bold" style={{ color: "var(--foreground)" }}>Delete this product?</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
              <strong style={{ color: "var(--foreground)" }}>{product.name}</strong> will be removed from your catalog. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteState("idle")}
                disabled={deleteState === "deleting"}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteState === "deleting"}
                className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {deleteState === "deleting" ? "Deleting…" : "Delete product"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
