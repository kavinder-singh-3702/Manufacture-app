"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { Product, ProductStockStatus } from "@/src/types/product";

type StatusFilter = "all" | ProductStockStatus;

const STATUS_CONFIG: Record<StatusFilter, { label: string; color: string; bg: string; icon: string }> = {
  all:          { label: "All stock",     color: "var(--foreground)", bg: "var(--surface)",   icon: "📦" },
  in_stock:     { label: "In stock",      color: "#15803D",            bg: "#DCFCE7",          icon: "✅" },
  low_stock:    { label: "Low stock",     color: "#92400E",            bg: "#FEF3C7",          icon: "⚠️" },
  out_of_stock: { label: "Out of stock",  color: "#991B1B",            bg: "#FEE2E2",          icon: "🚫" },
};

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const StockBadge = ({ status }: { status?: ProductStockStatus }) => {
  const s = status ?? "in_stock";
  const c = STATUS_CONFIG[s];
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
      style={{ backgroundColor: c.bg, color: c.color }}>
      {c.icon} {c.label}
    </span>
  );
};

const ProductRow = ({ product, delay }: { product: Product; delay: number }) => {
  const img = product.images?.[0]?.url;
  const hasVariants = (product.variantSummary?.totalVariants ?? 0) > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
      <Link href={`/dashboard/products/detail?productId=${product._id}`}
        className="flex items-start gap-3 p-4 hover:opacity-90 transition-opacity">
        {img ? (
          <img src={img} alt={product.name} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl flex-shrink-0 text-2xl"
            style={{ backgroundColor: "var(--background)" }}>📦</div>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>{product.name}</p>
            <StockBadge status={product.stockStatus} />
          </div>
          <p className="text-xs capitalize" style={{ color: "var(--medium-gray)" }}>
            {product.category?.replace(/-/g, " ")}
            {product.sku ? ` · SKU: ${product.sku}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span style={{ color: "var(--medium-gray)" }}>
              Stock: <strong style={{ color: "var(--foreground)" }}>{product.availableQuantity} {product.unit ?? "units"}</strong>
            </span>
            <span style={{ color: "var(--medium-gray)" }}>
              Reorder at: <strong style={{ color: "var(--foreground)" }}>{product.minStockQuantity} {product.unit ?? "units"}</strong>
            </span>
            {product.price?.amount && (
              <span style={{ color: "var(--medium-gray)" }}>
                Price: <strong style={{ color: "var(--primary)" }}>{fmt(product.price.amount)}</strong>
                {product.price.unit ? `/${product.price.unit}` : ""}
              </span>
            )}
            {hasVariants && (
              <span style={{ color: "var(--medium-gray)" }}>
                <strong style={{ color: "var(--foreground)" }}>{product.variantSummary!.totalVariants}</strong> variants
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Skeleton = () => (
  <div className="grid gap-3">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--surface)" }} />
    ))}
  </div>
);

export const InventoryContainer = () => {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<{ all: number; in_stock: number; low_stock: number; out_of_stock: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [res, allRes] = await Promise.all([
        productService.list({ scope: "company", status: filter === "all" ? undefined : filter, search: search || undefined, limit: 200, includeVariantSummary: true }),
        filter !== "all" ? productService.list({ scope: "company", limit: 1 }) : Promise.resolve(null),
      ]);
      setProducts(res.products ?? []);

      if (!stats || filter === "all") {
        const [inStock, lowStock, outStock] = await Promise.all([
          productService.list({ scope: "company", status: "in_stock" as any, limit: 1 }),
          productService.list({ scope: "company", status: "low_stock" as any, limit: 1 }),
          productService.list({ scope: "company", status: "out_of_stock" as any, limit: 1 }),
        ]);
        const total = filter === "all" ? (res.pagination?.total ?? res.products?.length ?? 0) : (allRes as any)?.pagination?.total ?? 0;
        setStats({
          all: total || (res.pagination?.total ?? res.products?.length ?? 0),
          in_stock: inStock.pagination?.total ?? 0,
          low_stock: lowStock.pagination?.total ?? 0,
          out_of_stock: outStock.pagination?.total ?? 0,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: StatusFilter[] = ["all", "in_stock", "low_stock", "out_of_stock"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Inventory</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Stock Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>Monitor stock levels across your product catalogue</p>
        </div>
        <div className="flex gap-2 self-start">
          <button onClick={() => load()}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
            ↻ Refresh
          </button>
          <Link href="/dashboard/products/mine"
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
            + Add product
          </Link>
        </div>
      </motion.div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filters.map((f) => {
            const cfg = STATUS_CONFIG[f];
            const count = stats[f];
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
                style={{
                  border: `2px solid ${active ? "var(--primary)" : "var(--border)"}`,
                  backgroundColor: active ? "var(--primary)" : "var(--surface)",
                }}>
                <p className="text-xl mb-1">{cfg.icon}</p>
                <p className="text-2xl font-black" style={{ color: active ? "#fff" : cfg.color }}>{count}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: active ? "rgba(255,255,255,0.8)" : "var(--medium-gray)" }}>{cfg.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search by product name or SKU…"
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          <span>{error}</span>
          <button onClick={load} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* Low-stock alert banner */}
      {!loading && stats && stats.low_stock > 0 && filter === "all" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#92400E" }}>
            ⚠️ {stats.low_stock} product{stats.low_stock !== 1 ? "s" : ""} running low on stock
          </div>
          <button onClick={() => setFilter("low_stock")}
            className="text-xs font-bold underline" style={{ color: "#92400E" }}>View</button>
        </motion.div>
      )}

      {/* Product list */}
      {loading ? <Skeleton /> : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-4xl">📦</div>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No products found</p>
          <p className="text-sm text-center" style={{ color: "var(--medium-gray)" }}>
            {search ? `No results for "${search}"` : `Nothing with status "${filter}" in your inventory.`}
          </p>
          <Link href="/dashboard/products/mine"
            className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold"
            style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>
            {products.length} product{products.length !== 1 ? "s" : ""}
            {filter !== "all" ? ` · ${STATUS_CONFIG[filter].label}` : ""}
          </p>
          <div className="grid gap-3">
            {products.map((p, i) => <ProductRow key={p._id} product={p} delay={i * 0.03} />)}
          </div>
        </div>
      )}
    </div>
  );
};
