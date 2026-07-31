"use client";

/**
 * Shared primitives for the Ad Studio drawers — split out of what used to be
 * a single 1486-line AdStudioPanel.tsx so the list view, the campaign wizard,
 * and the insights view can each live in their own file.
 */

import { motion } from "framer-motion";
import type { AdPlacement } from "@/src/services/ad";

export const PLACEMENTS: { key: AdPlacement; label: string }[] = [
  { key: "dashboard_home",  label: "Dashboard home" },
  { key: "hero_banner",     label: "Hero banner" },
  { key: "cart_cross_sell", label: "Cart cross-sell" },
];

export const Drawer = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <>
    <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto shadow-2xl"
      style={{ backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}>
      {children}
    </motion.aside>
  </>
);

export const DrawerHeader = ({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) => (
  <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 py-4"
    style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
    <div>
      <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--medium-gray)" }}>{subtitle}</p>}
    </div>
    <button type="button" onClick={onClose}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-60"
      style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--medium-gray)" }}>✕</button>
  </div>
);

export const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
    {children}{required && <span className="ml-0.5" style={{ color: "#DC2626" }}>*</span>}
  </label>
);

export const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <Label required={required}>{label}</Label>
    {children}
  </div>
);

export const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl p-4 space-y-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
    {children}
  </div>
);

export const ToggleRow = ({ label, hint, on, onToggle }: { label: string; hint?: string; on: boolean; onToggle: () => void }) => (
  <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left"
    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
    <span>
      <span className="block text-xs font-bold" style={{ color: "var(--foreground)" }}>{label}</span>
      {hint && <span className="block text-[10px]" style={{ color: "var(--medium-gray)" }}>{hint}</span>}
    </span>
    <span className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
      style={{ backgroundColor: on ? "var(--primary)" : "var(--border)" }}>
      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }} />
    </span>
  </button>
);
