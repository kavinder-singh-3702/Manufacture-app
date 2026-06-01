import { motion } from "framer-motion";

export type MetricCardProps = {
  label: string;
  value: string;
  icon?: string;
  accent?: string;    // background color
  textColor?: string;
  trend?: { value: string; up: boolean } | null;
  subtitle?: string;
  delay?: number;
  size?: "sm" | "md" | "lg";
};

const formatIndian = (n: number): string => {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
};

export { formatIndian };

export const MetricCard = ({
  label, value, icon, accent, textColor, trend, subtitle, delay = 0, size = "md",
}: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, delay }}
    className="relative overflow-hidden rounded-2xl p-4"
    style={{
      border: "1px solid var(--border)",
      backgroundColor: "var(--card)",
      boxShadow: "var(--shadow-sm)",
    }}
  >
    {/* Accent top bar */}
    {accent && <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ backgroundColor: accent }} />}

    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>
          {label}
        </p>
        <p className={`mt-1.5 font-bold ${size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl"} truncate`}
          style={{ color: textColor ?? "var(--foreground)" }}>
          {value}
        </p>
        {subtitle && <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{subtitle}</p>}
        {trend && (
          <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${trend.up ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            <span>{trend.up ? "↑" : "↓"}</span>{trend.value}
          </span>
        )}
      </div>
      {icon && (
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: accent ? `${accent}22` : "var(--primary-light)", color: textColor ?? "var(--primary)" }}
        >
          {icon}
        </span>
      )}
    </div>
  </motion.div>
);

/** Reusable progress bar used inside reports */
export const ProgressBar = ({
  label, value, max, color, amount, delay = 0,
}: { label: string; value: number; max: number; color: string; amount: string; delay?: number }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
        <span className="ml-2 flex-shrink-0 font-bold" style={{ color }}>{amount}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/** Reusable section wrapper for reports */
export const ReportSection = ({ title, subtitle, children, className = "" }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`rounded-2xl p-5 ${className}`}
    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
  >
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>{title}</p>
      {subtitle && <p className="mt-0.5 text-sm" style={{ color: "var(--medium-gray)" }}>{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);

/** Loading skeleton for metric cards */
export const MetricCardSkeleton = ({ count = 4, className = "" }: { count?: number; className?: string }) => (
  <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
    ))}
  </div>
);
