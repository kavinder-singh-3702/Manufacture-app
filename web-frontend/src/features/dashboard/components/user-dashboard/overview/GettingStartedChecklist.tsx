"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useDashboardContext } from "../context";

/**
 * Onboarding checklist for brand-new accounts — moved off Overview onto the
 * Profile page (rendered only while there's no active company, same
 * condition the original inline version used).
 */
export const GettingStartedChecklist = () => {
  const { user, openVerificationModal } = useDashboardContext();

  const steps = [
    { done: !!user.displayName, text: "Complete your profile", href: "/dashboard/profile" },
    { done: false, text: "Create or join a company", href: "/dashboard/company" },
    { done: false, text: "Add your first product", href: "/dashboard/products/mine" },
    { done: false, text: "Get your company verified", href: "#", onClick: openVerificationModal },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="rounded-3xl p-5"
      style={{ background: "linear-gradient(135deg, var(--primary-light) 0%, var(--card) 100%)", border: "1px solid var(--border)" }}
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>Getting started</p>
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.text} className="flex items-center gap-3">
            <div
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: step.done ? "color-mix(in srgb, var(--success) 18%, transparent)" : "var(--border)", color: step.done ? "var(--success)" : "var(--medium-gray)" }}
            >
              {step.done ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                <div className="h-2 w-2 rounded-full bg-current opacity-40" />
              )}
            </div>
            <Link
              href={step.href}
              onClick={step.onClick ? (e) => { e.preventDefault(); step.onClick?.(); } : undefined}
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: step.done ? "var(--medium-gray)" : "var(--foreground)", textDecoration: step.done ? "line-through" : "none" }}
            >
              {step.text}
            </Link>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
