"use client";

import { motion } from "framer-motion";
import { useCategoryStats } from "@/src/features/product/useCategoryStats";
import { CategoryCircleGrid } from "@/src/components/ui/CategoryCircleGrid";

/** "Browse by industry" — app-parity category circles, 3/4/8 cols mobile/sm/lg. */
export const CategorySection = () => {
  const { categories, loading, error, reload } = useCategoryStats("marketplace");

  return (
    <div>
      <SectionHeader label="Browse by industry" />
      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl p-3 text-sm" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger-strong)" }}>
          <span>{error}</span>
          <button type="button" onClick={reload} className="font-bold" style={{ color: "var(--primary)" }}>Retry</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-2.5">
              <div className="h-14 w-14 animate-pulse rounded-full sm:h-16 sm:w-16" style={{ backgroundColor: "var(--light-gray)" }} />
              <div className="h-2.5 w-10 animate-pulse rounded" style={{ backgroundColor: "var(--light-gray)" }} />
            </div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <CategoryCircleGrid
            items={categories.map((cat) => ({ id: cat.id, title: cat.title, icon: cat.icon, bg: cat.bg, count: cat.count }))}
            columns={{ base: 3, sm: 4, lg: 8 }}
            hrefBuilder={(item) => `/dashboard/products/category/${item.id}`}
          />
        </motion.div>
      )}
    </div>
  );
};

const SectionHeader = ({ label }: { label: string }) => (
  <div className="mb-4 flex items-center gap-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--medium-gray)" }}>{label}</p>
    <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
  </div>
);
