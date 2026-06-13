"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import { getCategoryMeta, PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";

type StockFilter = "" | "in_stock" | "low_stock";

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number, cur = "INR") =>
  n.toLocaleString("en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 });

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ── ProductCard ────────────────────────────────────────────────────────────────

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const cat = getCategoryMeta(product.category);
  const img = product.images?.[0]?.url;

  return (
    <motion.div {...fade(Math.min(index * 0.04, 0.32))} whileHover={{ y: -4 }}>
      <Link href={`/products/detail/?productId=${encodeURIComponent(product._id)}`}
        className="group flex flex-col overflow-hidden rounded-2xl transition-shadow duration-200 hover:shadow-xl"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden"
          style={{ background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--light-gray)" }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">{cat?.icon ?? "📦"}</div>
          )}
          {/* Category pill */}
          {cat && (
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"
                style={{ backgroundColor: cat.bg, color: cat.text }}>
                {cat.icon} {cat.title}
              </span>
            </div>
          )}
          {/* Stock badge */}
          {product.stockStatus === "out_of_stock" && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
              <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: "rgba(220,38,38,0.9)" }}>
                Out of stock
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
              {product.name}
            </h3>
            {product.company?.displayName && (
              <p className="mt-1 text-xs font-medium truncate" style={{ color: "var(--medium-gray)" }}>
                by {product.company.displayName}
              </p>
            )}
          </div>

          <div className="mt-auto space-y-2">
            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                {fmt(product.price.amount, product.price.currency)}
              </span>
              {product.price.unit && (
                <span className="text-xs" style={{ color: "var(--medium-gray)" }}>/ {product.price.unit}</span>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--medium-gray)" }}>
                {product.availableQuantity > 0
                  ? <span className="font-semibold" style={{ color: "#16A34A" }}>
                      {product.availableQuantity.toLocaleString("en-IN")} {product.unit ?? "units"} available
                    </span>
                  : <span style={{ color: "#DC2626" }}>Out of stock</span>
                }
              </span>
              {(product.variantSummary?.totalVariants ?? 0) > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                  {product.variantSummary!.totalVariants} variants
                </span>
              )}
            </div>

            {/* CTA — contact actions (chat/call) are gated behind sign-in on the detail page */}
            <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="flex-1 rounded-xl px-3 py-2 text-center text-xs font-bold text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--primary)" }}>
                View details
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
    <div className="aspect-[4/3] animate-pulse" style={{ backgroundColor: "var(--light-gray)" }} />
    <div className="space-y-3 p-4">
      <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-6 w-1/3 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
    </div>
  </div>
);

// ── PublicMarketplace ─────────────────────────────────────────────────────────

type Props = { initialCategory?: string; initialSearch?: string; companyId?: string };

const PAGE_SIZE = 24;

const STOCK_FILTERS: { value: StockFilter; label: string; icon: string }[] = [
  { value: "",           label: "All",       icon: "📦" },
  { value: "in_stock",  label: "In stock",  icon: "✅" },
  { value: "low_stock", label: "Low stock", icon: "⚠️" },
];

export const PublicMarketplace = ({ initialCategory = "", initialSearch = "", companyId }: Props) => {
  const router = useRouter();
  const [search, setSearch]     = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort]         = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal]       = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [offset, setOffset]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(async (off = 0, append = false) => {
    try {
      setError(null);
      if (append) setLoadingMore(true); else setLoading(true);
      const res = await productService.list({
        scope: "marketplace",
        limit: PAGE_SIZE,
        offset: off,
        search: search || undefined,
        category: category || undefined,
        status: stockFilter || undefined,
        sort: (sort as any) || undefined,
        companyId: companyId || undefined,
        includeVariantSummary: true,
      });
      setProducts((p) => append ? [...p, ...(res.products ?? [])] : (res.products ?? []));
      setTotal(res.pagination?.total ?? 0);
      setHasMore(res.pagination?.hasMore ?? false);
      setOffset(off);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, category, sort, stockFilter, companyId]);

  useEffect(() => { setOffset(0); load(0, false); }, [load]);

  // Debounce search input
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = searchInput.trim();
      setSearch(q);
      // Sync URL so search is shareable
      if (!companyId && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
        router.replace(url.pathname + (url.search || ""), { scroll: false });
      }
    }, 320);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput, companyId, router]);

  const activeCat = getCategoryMeta(category);

  return (
    <div>
      {/* Page hero */}
      <div className="border-b px-6 py-8 lg:px-10" style={{ borderColor: "var(--border)", background: "linear-gradient(160deg, #f8fafb 0%, #f0f9ff 100%)" }}>
        <div className="mx-auto max-w-[1400px]">
          {activeCat ? (
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: activeCat.bg }}>
                {activeCat.icon}
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Category</p>
                <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{activeCat.title}</h1>
                <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                  {total} product{total !== 1 ? "s" : ""} from Indian manufacturers
                </p>
              </div>
              <button type="button" onClick={() => setCategory("")}
                className="ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}>
                ✕ Clear filter
              </button>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Marketplace</p>
              <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Browse products</h1>
              <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                {total > 0 ? `${total.toLocaleString("en-IN")} products` : "Explore"} from verified Indian manufacturers
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
        {/* Search + Sort bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="m20 20-4.5-4.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by name, SKU, description…"
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }} />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
            <option value="">Newest first</option>
            <option value="priceAsc">Price: low → high</option>
            <option value="priceDesc">Price: high → low</option>
            <option value="createdAt:asc">Oldest first</option>
          </select>
          {/* Stock filter */}
          <div className="flex gap-1.5">
            {STOCK_FILTERS.map((sf) => (
              <button key={sf.value} type="button" onClick={() => setStockFilter(sf.value)}
                className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: stockFilter === sf.value ? "var(--primary)" : "var(--surface)",
                  color: stockFilter === sf.value ? "#fff" : "var(--foreground)",
                  border: "1px solid var(--border)",
                }}>
                {sf.icon} {sf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category chips — horizontal scroll */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button type="button" onClick={() => setCategory("")}
            className="flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
            style={{
              backgroundColor: !category ? "var(--primary)" : "var(--surface)",
              color: !category ? "#fff" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}>
            All
          </button>
          {PRODUCT_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button key={cat.id} type="button" onClick={() => setCategory(active ? "" : cat.id)}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: active ? cat.text : cat.bg,
                  color: active ? "#fff" : cat.text,
                  border: `1px solid ${cat.bg}`,
                }}>
                {cat.icon} {cat.title}
              </button>
            );
          })}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div {...fade()} className="mb-5 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
              <span>{error}</span>
              <button type="button" onClick={() => load(0, false)} className="text-xs font-bold underline">Retry</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">🔍</div>
            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>No products found</p>
            <p className="text-sm text-center" style={{ color: "var(--medium-gray)" }}>
              {search ? `No results for "${search}"` : stockFilter ? `No ${stockFilter.replace("_"," ")} products here.` : "No products in this category yet."}
            </p>
            {(search || category || stockFilter) && (
              <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setCategory(""); setStockFilter(""); }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: "var(--primary)" }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>
              <span>{total.toLocaleString("en-IN")} products{activeCat ? ` in ${activeCat.title}` : ""}{search ? ` matching "${search}"` : ""}</span>
              {stockFilter && (
                <span className="flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: stockFilter === "in_stock" ? "#DCFCE7" : "#FEF3C7",
                           color: stockFilter === "in_stock" ? "#15803D" : "#92400E" }}>
                  {stockFilter === "in_stock" ? "✅ In stock" : "⚠️ Low stock"}
                  <button type="button" onClick={() => setStockFilter("")} className="ml-1 hover:opacity-70">✕</button>
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button type="button" onClick={() => load(offset + PAGE_SIZE, true)} disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                  {loadingMore ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" /> Loading…</>
                  ) : "Load more products"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
