"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { companyService } from "@/src/services/company";
import { userService } from "@/src/services/user";
import { ApiError } from "@/src/lib/api-error";
import { BUSINESS_ACCOUNT_TYPES, BUSINESS_CATEGORIES } from "@/src/constants/business";

const ACCOUNT_TYPE_META = {
  normal: { icon: "👤", label: "Buyer / Consumer", desc: "Individual or small business purchasing goods" },
  trader: { icon: "🏪", label: "Trader", desc: "Wholesale trader buying and reselling manufactured goods" },
  manufacturer: { icon: "🏭", label: "Manufacturer", desc: "Production facility, OEM or contract manufacturer" },
} as const;

const CAT_ICONS: Record<string, string> = {
  printing: "🖨️", manufacturing: "⚙️", packaging: "📦",
  logistics: "🚚", textiles: "🧵", machinery: "🔩", other: "💼",
};

const STEPS = ["Identity", "Contact", "Categories"] as const;
type Step = (typeof STEPS)[number];

type FormState = {
  displayName: string;
  type: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  city: string;
  country: string;
  categories: string[];
  logoUrl: string;
};

const emptyForm = (defaultType = "normal"): FormState => ({
  displayName: "", type: defaultType, description: "",
  contactEmail: "", contactPhone: "", website: "",
  city: "", country: "India", categories: [], logoUrl: "",
});

const baseInput: React.CSSProperties = {
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
};

const Field = ({ label, required, children, hint }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
      {label}{required && <span style={{ color: "var(--accent)" }}> *</span>}
    </span>
    {children}
    {hint && <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>{hint}</p>}
  </label>
);

export const CompanyCreateDrawer = ({
  open,
  defaultType,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultType?: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) => {
  const [step, setStep] = useState<Step>("Identity");
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultType));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (open) {
      setStep("Identity");
      setForm(emptyForm(defaultType));
      setError(null);
      setLogoError(null);
    }
  }, [open, defaultType]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const toggleCategory = (cat: string) =>
    setForm((p) => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...p.categories, cat],
    }));

  const handleLogoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setLogoError("Please select an image file."); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const content = result.includes(",") ? result.split(",")[1] ?? "" : result;
      try {
        setLogoUploading(true);
        setLogoError(null);
        const res = await userService.uploadUserFile({ fileName: file.name, mimeType: file.type || "image/png", content, purpose: "company-logo" });
        if (res.file?.url) set("logoUrl", res.file.url);
      } catch (err) {
        setLogoError(err instanceof ApiError || err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setLogoUploading(false);
      }
    };
    reader.onerror = () => setLogoError("Could not read file.");
    reader.readAsDataURL(file);
  };

  const validateStep = (): boolean => {
    if (step === "Identity") {
      if (!form.displayName.trim()) { setError("Company name is required."); return false; }
    }
    setError(null);
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (!form.displayName.trim()) { setError("Company name is required."); return; }
    try {
      setSaving(true);
      setError(null);
      await companyService.create({
        displayName: form.displayName.trim(),
        type: form.type,
        categories: form.categories,
        description: form.description.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
        contact: {
          email: form.contactEmail.trim() || undefined,
          phone: form.contactPhone.trim() || undefined,
          website: form.website.trim() || undefined,
        },
        headquarters: {
          city: form.city.trim() || undefined,
          country: form.country.trim() || undefined,
        },
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not create company.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col"
            style={{ backgroundColor: "var(--surface)", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            role="dialog" aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-primary)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                  New company
                </p>
                <h2 className="text-lg font-bold truncate" style={{ color: "var(--foreground)" }}>
                  Create a workspace
                </h2>
              </div>
              <button
                type="button" onClick={onClose}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl font-bold transition-opacity hover:opacity-60"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
              >×</button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-0 px-6 py-3" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
              {STEPS.map((s, i) => {
                const done = i < stepIndex;
                const active = s === step;
                return (
                  <div key={s} className="flex flex-1 items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all"
                        style={{
                          backgroundColor: done ? "var(--primary)" : active ? "var(--primary)" : "var(--border)",
                          color: done || active ? "#fff" : "var(--medium-gray)",
                        }}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: active ? "var(--primary)" : done ? "var(--foreground)" : "var(--medium-gray)" }}>
                        {s}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="mx-3 flex-1 h-px" style={{ backgroundColor: done ? "var(--primary)" : "var(--border)" }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {step === "Identity" && (
                    <motion.div
                      key="identity"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <Field label="Company name" required>
                        <input
                          autoFocus
                          className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                          style={baseInput} placeholder="e.g. Acme Textiles Pvt. Ltd."
                          value={form.displayName} onChange={(e) => set("displayName", e.target.value)}
                        />
                      </Field>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                          Company type <span style={{ color: "var(--accent)" }}>*</span>
                        </p>
                        <div className="mt-2 grid gap-2">
                          {BUSINESS_ACCOUNT_TYPES.map((t) => {
                            const meta = ACCOUNT_TYPE_META[t];
                            const active = form.type === t;
                            return (
                              <motion.button
                                key={t} type="button"
                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                onClick={() => set("type", t)}
                                className="flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                                style={{
                                  border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                                  backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
                                }}
                              >
                                <span className="flex-shrink-0 text-2xl">{meta.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>
                                    {meta.label}
                                  </p>
                                  <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{meta.desc}</p>
                                </div>
                                {active && (
                                  <div
                                    className="ml-auto flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white text-xs"
                                    style={{ backgroundColor: "var(--primary)" }}
                                  >✓</div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <Field label="Description" hint="What does this company make or trade?">
                        <textarea
                          rows={3}
                          className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                          style={baseInput} placeholder="We manufacture premium cotton yarn for export markets…"
                          value={form.description} onChange={(e) => set("description", e.target.value)}
                        />
                      </Field>

                      {/* Logo upload */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--foreground)" }}>
                          Logo
                        </p>
                        <div className="flex items-center gap-4 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                          <div
                            className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold"
                            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--border)" }}
                          >
                            {form.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img loading="lazy" decoding="async" src={form.logoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (form.displayName || "Co").slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:shadow-md"
                              style={{ border: "1px solid var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => { handleLogoUpload(e.target.files); e.currentTarget.value = ""; }} />
                              {logoUploading ? "Uploading…" : "Upload logo"}
                            </label>
                            <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>JPG or PNG, max 5 MB</p>
                            {logoError && <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--accent)" }}>{logoError}</p>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === "Contact" && (
                    <motion.div
                      key="contact"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                        Contact information
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Email">
                          <input type="email" className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                            style={baseInput} placeholder="ops@company.com"
                            value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
                        </Field>
                        <Field label="Phone">
                          <input type="tel" className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                            style={baseInput} placeholder="+91 98765 43210"
                            value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
                        </Field>
                      </div>
                      <Field label="Website">
                        <input type="url" className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                          style={baseInput} placeholder="https://yourcompany.com"
                          value={form.website} onChange={(e) => set("website", e.target.value)} />
                      </Field>
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                        Headquarters location
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="City">
                          <input className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                            style={baseInput} placeholder="Mumbai"
                            value={form.city} onChange={(e) => set("city", e.target.value)} />
                        </Field>
                        <Field label="Country">
                          <input className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                            style={baseInput} placeholder="India"
                            value={form.country} onChange={(e) => set("country", e.target.value)} />
                        </Field>
                      </div>
                    </motion.div>
                  )}

                  {step === "Categories" && (
                    <motion.div
                      key="categories"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                          Business categories
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>
                          Pick all that apply. This helps buyers find and qualify your company.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {BUSINESS_CATEGORIES.map((cat) => {
                          const active = form.categories.includes(cat);
                          return (
                            <motion.button
                              key={cat} type="button"
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={() => toggleCategory(cat)}
                              className="flex items-center gap-2.5 rounded-xl p-3 text-left transition-all"
                              style={{
                                border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                                backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
                              }}
                            >
                              <span className="text-xl">{CAT_ICONS[cat] ?? "🏭"}</span>
                              <span className="text-xs font-semibold capitalize" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>
                                {cat}
                              </span>
                              {active && (
                                <div
                                  className="ml-auto h-4 w-4 flex-shrink-0 flex items-center justify-center rounded-full text-white text-[9px] font-bold"
                                  style={{ backgroundColor: "var(--primary)" }}
                                >✓</div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                  >{error}</motion.div>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between gap-2 px-6 py-4"
                style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
              >
                <button
                  type="button"
                  onClick={stepIndex === 0 ? onClose : () => setStep(STEPS[stepIndex - 1]!)}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  {stepIndex === 0 ? "Cancel" : "← Back"}
                </button>
                {step !== "Categories" ? (
                  <button
                    type="button" onClick={goNext}
                    className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    type="submit" disabled={saving || logoUploading}
                    className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
                  >
                    {saving ? "Creating…" : "Create company"}
                  </button>
                )}
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
