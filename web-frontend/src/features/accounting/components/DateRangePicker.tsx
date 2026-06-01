"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type DateRange = { from: string; to: string };

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

const startOfMonth = () => {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
};
const startOfLastMonth = () => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};
const endOfLastMonth = () => {
  const d = new Date(); d.setDate(0);
  return d.toISOString().slice(0, 10);
};
const startOfQuarter = () => {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1).toISOString().slice(0, 10);
};
const startOfYear = () => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);

const PRESETS: Array<{ label: string; from: () => string; to: () => string }> = [
  { label: "This month", from: startOfMonth, to: today },
  { label: "Last month", from: startOfLastMonth, to: endOfLastMonth },
  { label: "This quarter", from: startOfQuarter, to: today },
  { label: "This year", from: startOfYear, to: today },
  { label: "Last 30 days", from: () => daysAgo(30), to: today },
  { label: "Last 90 days", from: () => daysAgo(90), to: today },
];

type Props = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
};

export const DateRangePicker = ({ value, onChange, className = "" }: Props) => {
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (preset: typeof PRESETS[number]) => {
    onChange({ from: preset.from(), to: preset.to() });
    setShowCustom(false);
  };

  const activePreset = PRESETS.find((p) => p.from() === value.from && p.to() === value.to);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const active = activePreset?.label === p.label;
          return (
            <button
              key={p.label} type="button"
              onClick={() => applyPreset(p)}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: active ? "var(--primary)" : "var(--surface)",
                color: active ? "#fff" : "var(--foreground)",
                border: active ? "none" : "1px solid var(--border)",
                boxShadow: active ? "var(--shadow-primary)" : "none",
              }}
            >{p.label}</button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5"
          style={{
            backgroundColor: (!activePreset && value.from) ? "var(--primary)" : "var(--surface)",
            color: (!activePreset && value.from) ? "#fff" : "var(--foreground)",
            border: (!activePreset && value.from) ? "none" : "1px solid var(--border)",
          }}
        >
          Custom…
        </button>
      </div>

      {/* Custom date inputs */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-3 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>From</label>
              <input
                type="date" value={value.from}
                onChange={(e) => onChange({ ...value, from: e.target.value })}
                className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>To</label>
              <input
                type="date" value={value.to}
                onChange={(e) => onChange({ ...value, to: e.target.value })}
                className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active range display */}
      {value.from && value.to && (
        <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
          {new Date(value.from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {" — "}
          {new Date(value.to).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}
    </div>
  );
};

export const defaultDateRange = (): DateRange => ({
  from: startOfMonth(),
  to: today(),
});
