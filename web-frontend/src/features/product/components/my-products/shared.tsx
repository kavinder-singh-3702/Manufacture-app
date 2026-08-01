"use client";

/**
 * Small pieces every "My Products" page needs — breadcrumb trail, the
 * loading skeleton and the not-found/error card. Extracted so the detail,
 * edit and create pages don't each own a slightly different version of the
 * same three states.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { MY_PRODUCTS_HREF } from "../../utils/links";

/** Consistent breadcrumb for every owner page: "My Products › <current>". */
export const MyProductsCrumb = ({ current }: { current: string }) => (
  <>
    <Link href={MY_PRODUCTS_HREF} className="transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
      My Products
    </Link>
    <span aria-hidden="true">›</span>
    <span className="truncate">{current}</span>
  </>
);

export const BackToMyProducts = ({ label = "Back" }: { label?: string }) => (
  <Link
    href={MY_PRODUCTS_HREF}
    className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
    style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {label}
  </Link>
);

const shimmer = { backgroundColor: "var(--light-gray)" };

/** Mirrors the real page rhythm (header → hero block → two content blocks). */
export const MyProductSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-3 w-40 animate-pulse rounded" style={shimmer} />
      <div className="h-7 w-64 animate-pulse rounded" style={shimmer} />
    </div>
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="h-64 animate-pulse rounded-2xl lg:col-span-2" style={shimmer} />
      <div className="h-64 animate-pulse rounded-2xl" style={shimmer} />
    </div>
    <div className="h-40 animate-pulse rounded-2xl" style={shimmer} />
  </div>
);

export const MyProductLoadError = ({
  notFound,
  message,
  onRetry,
}: {
  notFound: boolean;
  message?: string | null;
  onRetry: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl px-6 py-14 text-center"
    style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}
  >
    <div
      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
      style={{ background: "linear-gradient(135deg, var(--primary-light), var(--accent-light))" }}
    >
      {notFound ? "🔍" : "⚠️"}
    </div>
    <h2 className="mt-4 text-lg font-bold" style={{ color: "var(--foreground)" }}>
      {notFound ? "Product not found" : "Couldn't load this product"}
    </h2>
    <p className="mx-auto mt-1.5 max-w-md text-sm" style={{ color: "var(--medium-gray)" }}>
      {notFound
        ? "It may have been deleted, or it belongs to a different company than the one you're currently in."
        : (message ?? "Something went wrong. Please try again.")}
    </p>
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
      {!notFound && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          Retry
        </button>
      )}
      <Link
        href={MY_PRODUCTS_HREF}
        className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--primary)" }}
      >
        Back to My Products
      </Link>
    </div>
  </motion.div>
);
