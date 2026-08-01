"use client";

/**
 * Shared primitives for the Ad Studio drawers — split out of what used to be
 * a single 1486-line AdStudioPanel.tsx so the list view, the campaign wizard,
 * and the insights view can each live in their own file.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { AdPlacement } from "@/src/services/ad";
import type { AdminUser } from "@/src/services/admin";
import { adminService } from "@/src/services/admin";

export const PLACEMENTS: { key: AdPlacement; label: string }[] = [
  { key: "dashboard_home",  label: "Dashboard home" },
  { key: "hero_banner",     label: "Hero banner" },
  { key: "cart_cross_sell", label: "Cart cross-sell" },
];

// Same ease as the rest of the design system's fade/slide motion — see
// src/components/ui/motion.ts (fadeUp). Kept local since the step-transition
// shape (directional slide) doesn't fit that helper's signature.
export const EASE = [0.22, 1, 0.36, 1] as const;

// Collapsible wrapper for conditionally-shown fields (discount amount, audience
// sub-panels, external-only inputs) — the form grows/shrinks instead of popping.
export const Reveal = ({ show, motionSafe, children }: { show: boolean; motionSafe: boolean; children: React.ReactNode }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        initial={motionSafe ? { height: 0, opacity: 0 } : false}
        animate={{ height: "auto", opacity: 1 }}
        exit={motionSafe ? { height: 0, opacity: 0 } : { opacity: 0 }}
        transition={{ duration: motionSafe ? 0.16 : 0, ease: EASE }}
        className="overflow-hidden">
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// `onRequestClose` — NOT a direct close. The backdrop click and Escape key
// only *request* a close; the caller decides whether that's safe (clean vs.
// dirty form, mid-save, etc.) and only unmounts the drawer if it agrees. This
// used to be a bare `onClose` wired straight to the backdrop's onClick, so a
// single stray click outside the ~448px-wide panel silently discarded the
// entire wizard — including an uploaded banner — with no confirmation and no
// guard against closing mid-save.
export const Drawer = ({ children, onRequestClose }: { children: React.ReactNode; onRequestClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onRequestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRequestClose]);

  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onRequestClose} />
      <motion.aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto shadow-2xl"
        style={{ backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)" }}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}>
        {children}
      </motion.aside>
    </>
  );
};

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

// ── Wizard field/control primitives ─────────────────────────────────────────
// Every text input, segmented button row, and upload dropzone in the campaign
// wizards (web + eventually app) shares one of these three shapes. Extracted
// so restyling is a single edit instead of hunting down N copy-pasted blocks.

const fieldBoxStyle = { backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" } as const;

export const TextInput = ({ className = "", style, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none ${className}`} style={{ ...fieldBoxStyle, ...style }} />
);

export const TextArea = ({ className = "", style, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none ${className}`} style={{ ...fieldBoxStyle, ...style }} />
);

export function SegmentedControl<T extends string>({ options, value, onChange, layoutId }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Unique per control instance — drives the sliding-pill shared-layout animation. */
  layoutId: string;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className="relative flex-1 overflow-hidden rounded-xl py-2.5 text-xs font-bold transition-colors"
            style={{ color: active ? "#fff" : "var(--foreground)", border: "1px solid var(--border)" }}>
            {active && (
              <motion.span layoutId={layoutId} className="absolute inset-0"
                style={{ backgroundColor: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }} />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const MediaDropzone = ({ label, accept, kind = "image", preview, onFile, onRemove, height = "h-28" }: {
  label: string;
  accept: string;
  kind?: "image" | "video";
  preview: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
  height?: string;
}) => (
  preview ? (
    <div className="relative overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
      {kind === "video" ? (
        <video src={preview} muted playsInline controls className={`${height} w-full object-cover`} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img loading="lazy" decoding="async" src={preview} alt="" className={`${height} w-full object-cover`} />
      )}
      <button type="button" onClick={onRemove}
        className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white">
        Remove
      </button>
    </div>
  ) : (
    <label className="flex cursor-pointer items-center justify-center rounded-xl py-4 text-sm font-semibold transition-opacity hover:opacity-70"
      style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--background)" }}>
      {label}
      <input type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </label>
  )
);

// ── User search modal ────────────────────────────────────────────────────────
// Shared by the audience "specific users" targeting picker and the
// Source & Owner step's owner picker (`productSource: "user_listings"`) —
// was previously a private copy living only inside CampaignDrawer.tsx.

export type UserPickerProps = {
  selectedIds: string[];
  onToggle: (u: AdminUser) => void;
  onClose: () => void;
  title?: string;
  /** Owner-picker mode: selecting a user replaces the selection and closes immediately. */
  single?: boolean;
};

export const UserPicker = ({ selectedIds, onToggle, onClose, title, single = false }: UserPickerProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced fetch — one request per pause in typing, not per keystroke.
  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      // Keep it minimal: show only the 3 most-recent users until the admin searches.
      adminService.listUsers({ search: search || undefined, limit: search ? 40 : 3, sort: "updatedAt:desc" })
        .then((res) => { if (active) setResults(res.users ?? []); })
        .catch(() => { if (active) setResults([]); })
        .finally(() => { if (active) setLoading(false); });
    }, search ? 250 : 0);
    return () => { active = false; clearTimeout(t); };
  }, [search]);

  const showingTop = !search.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {title ?? (single ? "Select owner" : `Target specific users · ${selectedIds.length} selected`)}
          </p>
          <button onClick={onClose} className="text-lg font-bold leading-none hover:opacity-60" style={{ color: "var(--medium-gray)" }}>✕</button>
        </div>
        <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus placeholder="Search by name, email, phone…"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          {showingTop && (
            <p className="mt-2 text-[11px]" style={{ color: "var(--medium-gray)" }}>Showing 3 recent users — search to find anyone.</p>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
            </div>
          ) : !results.length ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No users found.</p>
          ) : results.map((u) => {
            const active = selectedIds.includes(u.id);
            return (
              <button key={u.id} onClick={() => { onToggle(u); if (single) onClose(); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--background)]"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: active ? "var(--primary)" : "var(--background)", color: active ? "#fff" : "var(--medium-gray)" }}>
                  {active ? "✓" : (u.displayName || u.email || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{u.displayName || "Unnamed user"}</p>
                  <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>{u.email}</p>
                </div>
              </button>
            );
          })}
        </div>
        {!single && (
          <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={onClose} className="w-full rounded-xl py-2.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>Done</button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ── Freeform tag editor ──────────────────────────────────────────────────────
// Type-and-add chips for the sub-category targeting arrays (shopperSubCategories,
// buyIntentSubCategories, listedProductSubCategories) — these are free strings
// on the backend (no canonical sub-category list spans every parent category
// at once), so a type-ahead-and-commit editor mirrors the app's TagEditor
// instead of a category-scoped multi-select.
export const TagEditor = ({ label, values, placeholder, onChange }: {
  label: string; values: string[]; placeholder?: string; onChange: (values: string[]) => void;
}) => {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={fieldBoxStyle} />
        <button type="button" onClick={commit}
          className="flex-shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
          +
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="font-bold">✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
