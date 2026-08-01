"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "@/src/services/product";
import { ApiError, isAbortError } from "@/src/lib/api-error";
import type { Product, ProductCategory } from "@/src/types/product";
import { SearchBar, useRecentSearches, useUrlSearchQuery } from "@/src/features/search";
import { PRODUCT_CATEGORIES } from "../utils/categories";
import { ProductCard } from "./ProductCard";

const PAGE_SIZE = 24;

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay },
});

export const ProductSearchContainer = () => {
  const router = useRouter();
  // Bound to `?q=`, so arriving from the topbar, following a shared link, and
  // browser back/forward all drive the results — and typing here keeps the URL
  // shareable. Recents are the app-wide list, shared with every other search bar.
  const { input: query, setInput: setQuery, query: debouncedQuery, submit } = useUrlSearchQuery();
  const { recent: recentSearches, clear: clearRecent } = useRecentSearches();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<ProductCategory[]>([]);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Load category stats
  useEffect(() => {
    productService.getCategoryStats({ scope: "marketplace" })
      .then((res) => setCategoryStats(res.categories))
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string, mode: "fresh" | "more" = "fresh") => {
    if (!q.trim()) { setProducts([]); setTotal(0); return; }
    const isFresh = mode === "fresh";
    // Cancel any in-flight search so superseded keystrokes don't waste backend
    // work or land out of order.
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    try {
      if (isFresh) { setLoading(true); setError(null); }
      else setLoadingMore(true);
      const nextOffset = isFresh ? 0 : offset + PAGE_SIZE;
      const res = await productService.list({
        search: q.trim(),
        scope: "marketplace",
        limit: PAGE_SIZE,
        offset: nextOffset,
        includeVariantSummary: true,
      }, controller.signal);
      setProducts((prev) => isFresh ? res.products : [...prev, ...res.products]);
      setTotal(res.pagination.total);
      setHasMore(res.pagination.hasMore);
      setOffset(nextOffset);
    } catch (err) {
      if (isAbortError(err)) return; // superseded/unmounted — ignore
      if (isFresh) setError(err instanceof ApiError || err instanceof Error ? err.message : "Search failed");
    } finally {
      if (searchAbortRef.current === controller) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [offset]);

  useEffect(() => {
    setOffset(0);
    void search(debouncedQuery, "fresh");
    return () => searchAbortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // SearchBar records the query in the shared recents list itself, so this
  // only has to commit it to the URL.
  const handleSearch = (q: string) => submit(q);

  const showResults = debouncedQuery.trim().length > 0;
  const showIdle = !showResults;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <motion.div {...fade(0)}>
        <SearchBar
          size="lg"
          autoFocus
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          placeholder="Search products by name, category, SKU…"
        />
      </motion.div>

      {/* Idle state: Recent + Categories */}
      <AnimatePresence mode="wait">
        {showIdle && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                    Recent searches
                  </p>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-xs font-semibold transition-opacity hover:opacity-60"
                    style={{ color: "var(--medium-gray)" }}
                  >Clear all</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuery(q); handleSearch(q); }}
                      className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: "var(--medium-gray)" }}>
                        <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {q}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Browse by category */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                Browse by industry
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
                {PRODUCT_CATEGORIES.map((cat, i) => {
                  const stat = categoryStats.find((s) => s.id === cat.id);
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * i }}
                      whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
                      type="button"
                      onClick={() => router.push(`/dashboard/products/category/${cat.id}`)}
                      className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--card)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                        style={{ backgroundColor: cat.bg }}
                      >{cat.icon}</span>
                      <span className="text-[10px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                        {cat.title}
                      </span>
                      {stat && stat.count > 0 && (
                        <span className="text-[9px] font-medium" style={{ color: "var(--medium-gray)" }}>
                          {stat.count} products
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}

        {/* Search results */}
        {showResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Results header */}
            {!loading && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {total > 0
                    ? <>{total.toLocaleString("en-IN")} result{total !== 1 ? "s" : ""} for &ldquo;<span style={{ color: "var(--primary)" }}>{debouncedQuery}</span>&rdquo;</>
                    : <>No results for &ldquo;<span style={{ color: "var(--accent)" }}>{debouncedQuery}</span>&rdquo;</>
                  }
                </p>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => search(debouncedQuery, "fresh")}
                  className="text-xs font-bold underline"
                >Retry</button>
              </div>
            )}

            {/* Results grid */}
            {!loading && products.length > 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((p, i) => (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    >
                      <ProductCard product={p} buyerView />
                    </motion.div>
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => search(debouncedQuery, "more")}
                      disabled={loadingMore}
                      className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}
                    >{loadingMore ? "Loading…" : "Load more"}</button>
                  </div>
                )}
              </>
            )}

            {/* Empty */}
            {!loading && !error && products.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--border)" }}>
                <span className="text-4xl">🔍</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No products found</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
                    Try a different keyword or browse by category below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => submit("")}
                  className="mt-1 rounded-xl px-4 py-2 text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--primary)" }}
                >Browse categories</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
