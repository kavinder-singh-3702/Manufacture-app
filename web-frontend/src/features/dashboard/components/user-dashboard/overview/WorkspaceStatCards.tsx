"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useDashboardContext } from "../context";

const STAT_ICONS = [
  <svg key="co" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="li" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" /><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.6" /></svg>,
  <svg key="sh" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
];

const STAT_COLORS = [
  { bg: "#E8F6FB", text: "#148DB2" },
  { bg: "#EDE9FE", text: "#7C3AED" },
  { bg: "#DCFCE7", text: "#059669" },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, delay },
});

/**
 * Active company / linked companies / compliance snapshot — moved off
 * Overview onto the Company page, where it sits alongside the switcher and
 * company profile. Computes its own data from DashboardContext so callers
 * don't need to build a `cards` array.
 */
export const WorkspaceStatCards = () => {
  const { user, activeCompany, companies } = useDashboardContext();

  const cards = useMemo(
    () => [
      {
        label: "Active company",
        value: activeCompany?.displayName ?? "Select a company",
        detail: `Type: ${activeCompany?.type ?? user.accountType ?? "normal"}`,
      },
      {
        label: "Linked companies",
        value: companies.length ? `${companies.length}` : "0",
        detail: "Switch between workspaces",
      },
      {
        label: "Compliance",
        value: activeCompany?.complianceStatus ?? "pending",
        detail: activeCompany ? "Verification state" : "Awaiting submission",
      },
    ],
    [activeCompany, companies, user.accountType]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          {...fade(i * 0.05)}
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl p-5"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: STAT_COLORS[i]?.text ?? "var(--primary)" }} />
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: STAT_COLORS[i]?.text ?? "var(--primary)" }}>
              {card.label}
            </p>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: STAT_COLORS[i]?.bg ?? "var(--primary-light)", color: STAT_COLORS[i]?.text ?? "var(--primary)" }}
            >
              {STAT_ICONS[i]}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold capitalize" style={{ color: "var(--foreground)" }}>{card.value}</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{card.detail}</p>
        </motion.div>
      ))}
    </div>
  );
};
