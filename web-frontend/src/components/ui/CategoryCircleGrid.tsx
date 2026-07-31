"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export type CategoryCircleItem = {
  id: string;
  title: string;
  icon: string;
  bg: string;
  count?: number;
};

// Tailwind's scanner only picks up complete, literal class-name strings — it
// can't resolve `grid-cols-${n}` built at runtime. These lookup tables keep
// every literal the compiler needs to see while still letting callers pass a
// plain number for each breakpoint.
const BASE_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};
const SM_COLS: Record<number, string> = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  6: "sm:grid-cols-6",
};
const LG_COLS: Record<number, string> = {
  6: "lg:grid-cols-6",
  8: "lg:grid-cols-8",
};

/**
 * App-parity "browse by industry" grid — a colored round icon chip with an
 * optional count badge and a two-line clamped title underneath. Mirrors the
 * app's CategoryGrid (DashboardScreenContent.tsx) so web and app render the
 * identical shape at mobile widths; widens via the `columns` breakpoints on
 * larger viewports instead of switching to a different layout.
 */
export const CategoryCircleGrid = ({
  items,
  hrefBuilder,
  columns = { base: 3, sm: 4, lg: 8 },
  onItemClick,
}: {
  items: CategoryCircleItem[];
  hrefBuilder: (item: CategoryCircleItem) => string;
  columns?: { base: number; sm?: number; lg?: number };
  onItemClick?: (item: CategoryCircleItem) => void;
}) => {
  const gridClass = [
    "grid gap-2.5",
    BASE_COLS[columns.base] ?? BASE_COLS[3],
    columns.sm ? SM_COLS[columns.sm] : "",
    columns.lg ? LG_COLS[columns.lg] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={gridClass}>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.3) }}
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href={hrefBuilder(item)}
            onClick={() => onItemClick?.(item)}
            className="flex flex-col items-center gap-2 rounded-2xl p-2.5 text-center transition-shadow duration-200 hover:shadow-md sm:p-3"
          >
            <span
              className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-2xl sm:h-16 sm:w-16 sm:text-[26px]"
              style={{ backgroundColor: item.bg }}
            >
              {item.icon}
              {!!item.count && item.count > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {item.count > 99 ? "99+" : item.count}
                </span>
              )}
            </span>
            <span
              className="line-clamp-2 text-[10px] font-semibold leading-tight sm:text-[11px]"
              style={{ color: "var(--foreground)" }}
            >
              {item.title}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};
