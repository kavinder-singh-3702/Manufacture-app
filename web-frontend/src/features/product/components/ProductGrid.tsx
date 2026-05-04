"use client";

import { motion } from "framer-motion";
import type { Product } from "@/src/types/product";
import { ProductCard } from "./ProductCard";

const CardSkeleton = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.04 }}
    className="overflow-hidden rounded-2xl"
    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
  >
    <div className="aspect-[4/3] animate-pulse" style={{ backgroundColor: "var(--light-gray)" }} />
    <div className="space-y-3 p-4">
      <div className="h-3 w-20 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-4 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-6 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-1.5 w-full animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
    </div>
  </motion.div>
);

const EmptyState = ({ onCreate }: { onCreate?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
    style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}
  >
    <div
      className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
      style={{ background: "linear-gradient(135deg, var(--primary-light), var(--accent-light))" }}
    >
      📦
    </div>
    <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--foreground)" }}>No products yet</h3>
    <p className="mt-1.5 max-w-sm text-sm" style={{ color: "var(--medium-gray)" }}>
      Add your first product to start managing inventory and showing it to verified buyers.
    </p>
    {onCreate && (
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        Create your first product
      </button>
    )}
  </motion.div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div
    className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
    style={{ border: "1px solid var(--accent-light)", backgroundColor: "var(--accent-light)" }}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: "rgba(255,255,255,0.5)" }}>
      ⚠️
    </div>
    <h3 className="mt-4 text-base font-bold" style={{ color: "var(--accent)" }}>Couldn&apos;t load products</h3>
    <p className="mt-1 text-sm" style={{ color: "var(--accent)" }}>{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--accent)" }}
      >
        Retry
      </button>
    )}
  </div>
);

export const ProductGrid = ({
  products,
  loading,
  error,
  onCreate,
  onRetry,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  products: Product[];
  loading: boolean;
  error?: string | null;
  onCreate?: () => void;
  onRetry?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) => {
  if (loading && products.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} index={i} />)}
      </div>
    );
  }

  if (error && products.length === 0) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (products.length === 0) {
    return <EmptyState onCreate={onCreate} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p._id} product={p} index={i} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", boxShadow: "var(--shadow-sm)" }}
          >
            {loadingMore ? "Loading…" : "Load more products"}
          </button>
        </div>
      )}
    </div>
  );
};

export { EmptyState as ProductsEmptyState };
