"use client";

import { useState } from "react";
import { Sheet } from "@/src/components/ui/Sheet";
import { PRIORITIES, SERVICE_TYPE_LABELS, SERVICE_TYPES, toStatusLabel } from "./opsMeta";

export type OpsFilters = {
  kind: "all" | "service" | "business_setup";
  priority: "all" | (typeof PRIORITIES)[number];
  serviceType: "all" | (typeof SERVICE_TYPES)[number];
  sort: "updatedAt:desc" | "createdAt:desc" | "createdAt:asc" | "priority:desc";
  from: string;
  to: string;
};

export const DEFAULT_OPS_FILTERS: OpsFilters = {
  kind: "all",
  priority: "all",
  serviceType: "all",
  sort: "updatedAt:desc",
  from: "",
  to: "",
};

export const countActiveFilters = (f: OpsFilters) =>
  [f.kind !== "all", f.priority !== "all", f.serviceType !== "all", f.sort !== "updatedAt:desc", Boolean(f.from), Boolean(f.to)]
    .filter(Boolean).length;

const SORT_OPTIONS: { key: OpsFilters["sort"]; label: string }[] = [
  { key: "updatedAt:desc", label: "Recently updated" },
  { key: "createdAt:desc", label: "Newest first" },
  { key: "createdAt:asc", label: "Oldest first" },
  { key: "priority:desc", label: "Priority" },
];

const ChipRow = <T extends string>({
  label, options, value, onChange,
}: { label: string; options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) => (
  <div>
    <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>{label}</p>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button key={opt.key} type="button" onClick={() => onChange(opt.key)}
          className="rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-all"
          style={{
            backgroundColor: value === opt.key ? "var(--primary)" : "var(--surface)",
            color: value === opt.key ? "#fff" : "var(--foreground)",
            border: "1px solid var(--border)",
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export const OpsFilterSheet = ({
  open, filters, onClose, onApply,
}: { open: boolean; filters: OpsFilters; onClose: () => void; onApply: (f: OpsFilters) => void }) => {
  const [draft, setDraft] = useState<OpsFilters>(filters);
  // Re-seed the draft from the committed filters each time the sheet opens —
  // adjusted during render (React's recommended pattern for resetting state
  // on a prop change) rather than in an effect, which would set state
  // synchronously on mount and trigger a redundant extra render.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(filters);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Filter requests"
      footer={
        <div className="flex gap-3 p-4">
          <button type="button" onClick={() => setDraft(DEFAULT_OPS_FILTERS)}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
            Reset
          </button>
          <button type="button" onClick={() => onApply(draft)}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--primary)" }}>
            Apply filters
          </button>
        </div>
      }>
      <div className="space-y-5">
        <ChipRow label="Kind" value={draft.kind} onChange={(kind) => setDraft((d) => ({ ...d, kind }))}
          options={[
            { key: "all", label: "All" },
            { key: "service", label: "Service" },
            { key: "business_setup", label: "Startup" },
          ]} />

        <ChipRow label="Priority" value={draft.priority} onChange={(priority) => setDraft((d) => ({ ...d, priority }))}
          options={[{ key: "all", label: "All" }, ...PRIORITIES.map((p) => ({ key: p, label: p }))]} />

        {draft.kind !== "business_setup" && (
          <ChipRow label="Service type" value={draft.serviceType} onChange={(serviceType) => setDraft((d) => ({ ...d, serviceType }))}
            options={[{ key: "all", label: "All" }, ...SERVICE_TYPES.map((t) => ({ key: t, label: SERVICE_TYPE_LABELS[t] }))]} />
        )}

        <ChipRow label="Sort by" value={draft.sort} onChange={(sort) => setDraft((d) => ({ ...d, sort }))} options={SORT_OPTIONS} />

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>Date range</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            <input type="date" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
      </div>
    </Sheet>
  );
};

// Kept alongside the sheet so both AdminOpsPanel's chip row and the sheet
// agree on the exact same labels.
export const statusLabel = toStatusLabel;
