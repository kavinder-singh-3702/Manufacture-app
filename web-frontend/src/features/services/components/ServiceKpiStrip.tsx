"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/src/components/ui/charts";

/** Three-chip Open / In Progress / Completed strip, tone-matched to ServiceStatusBadge so the KPI colors mean the same thing everywhere on the page. */
const CHIPS = [
  { key: "open", label: "Open", anchor: "#D97706" },
  { key: "inProgress", label: "In Progress", anchor: "#0EA5E9" },
  { key: "completed", label: "Completed", anchor: "#16A34A" },
] as const;

export type ServiceKpis = { open: number; inProgress: number; completed: number };

export const ServiceKpiStrip = ({ kpis }: { kpis: ServiceKpis }) => (
  <div className="grid grid-cols-3 gap-3">
    {CHIPS.map(({ key, label, anchor }, i) => (
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: i * 0.05 }}
        className="flex flex-col items-center gap-1.5 rounded-2xl py-4"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: anchor }} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: anchor }}>
            {label}
          </p>
        </div>
        <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          <AnimatedNumber value={kpis[key]} />
        </p>
      </motion.div>
    ))}
  </div>
);
