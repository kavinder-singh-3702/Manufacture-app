"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { INHOUSE_COPY, INHOUSE_PREVIEW_LIMIT, INHOUSE_SHOP_HREF } from "../constants";
import { useInhouseProducts } from "../useInhouseProducts";
import { InhouseProductCard } from "./InhouseProductCard";

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
    <div className="h-[3px] w-full" style={{ background: "var(--light-gray)" }} />
    <div className="aspect-[4/3] animate-pulse" style={{ backgroundColor: "var(--light-gray)" }} />
    <div className="space-y-2.5 p-4">
      <div className="h-3 w-1/3 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
      <div className="h-6 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
    </div>
  </div>
);

export type InhouseProductsShowcaseProps = {
  /** Override the section heading (defaults to the shared in-house copy). */
  heading?: string;
  className?: string;
  /** How many cards to preview. Defaults to {@link INHOUSE_PREVIEW_LIMIT}. */
  limit?: number;
};

/**
 * Premium "ARVANN Select" preview section shown above the regular buyer-product
 * grids on the home page and the dashboard products page. Sources only
 * admin-listed products via {@link useInhouseProducts}. Renders nothing when
 * the catalog is empty so an empty premium band never appears.
 */
export const InhouseProductsShowcase = ({
  heading = INHOUSE_COPY.heading,
  className,
  limit = INHOUSE_PREVIEW_LIMIT,
}: InhouseProductsShowcaseProps) => {
  const { products, total, loading, error } = useInhouseProducts({ limit });

  // Hide entirely when there's nothing to show (no admin products / failed load).
  if (!loading && (error || products.length === 0)) return null;

  return (
    <section
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 ${className ?? ""}`}
      style={{
        border: "1px solid var(--border)",
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--card)) 0%, var(--card) 55%)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Decorative brand orb */}
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-[0.08]"
        style={{ background: "var(--gradient-brand-deep)" }}
      />

      {/* Header */}
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.28 }}
            className="flex items-center gap-2"
          >
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white"
              style={{ background: "linear-gradient(135deg, #148DB2 0%, #0F6E8C 100%)" }}
            >
              ✦ {INHOUSE_COPY.eyebrow}
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.28, delay: 0.05 }}
            className="mt-2 text-2xl font-bold md:text-3xl"
            style={{ color: "var(--foreground)" }}
          >
            {heading}
          </motion.h2>
          <p className="mt-1 max-w-xl text-sm" style={{ color: "var(--medium-gray)" }}>
            {INHOUSE_COPY.subheading}
          </p>
        </div>

        <Link
          href={INHOUSE_SHOP_HREF}
          className="hidden items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold transition-opacity hover:opacity-70 sm:flex"
          style={{ border: "1px solid var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}
        >
          {INHOUSE_COPY.cta} <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Grid */}
      <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: limit }).map((_, i) => <CardSkeleton key={i} />)
          : products.map((p, i) => <InhouseProductCard key={p._id} product={p} index={i} />)}
      </div>

      {/* Mobile CTA + "view all" when there are more than the preview */}
      <div className="relative mt-6 flex justify-center">
        <Link
          href={INHOUSE_SHOP_HREF}
          className="inline-flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ backgroundColor: "var(--primary)", boxShadow: "0 8px 24px rgba(20,141,178,0.28)" }}
        >
          {total > limit ? `${INHOUSE_COPY.cta} — ${total.toLocaleString("en-IN")} items` : INHOUSE_COPY.cta}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
};
