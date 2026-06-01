"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { businessSetupService } from "@/src/services/businessSetup";
import { ApiError } from "@/src/lib/api-error";
import type {
  BusinessBudgetRange, BusinessContactChannel, BusinessFounderExperience,
  BusinessStartTimeline, BusinessSupportArea, BusinessWorkModel,
  CreateBusinessSetupRequestInput,
} from "@/src/types/businessSetup";

/* ─── Option definitions ─────────────────────────────────────── */

const WORK_MODELS: Array<{ value: BusinessWorkModel; label: string; icon: string }> = [
  { value: "manufacturing", label: "Manufacturing",      icon: "🏭" },
  { value: "trading",       label: "Trading",           icon: "🏪" },
  { value: "services",      label: "Services",          icon: "🛠️" },
  { value: "online",        label: "Online / E-comm",   icon: "🌐" },
  { value: "hybrid",        label: "Hybrid",            icon: "⚡" },
  { value: "other",         label: "Other",             icon: "💼" },
];

const BUDGETS: Array<{ value: BusinessBudgetRange; label: string }> = [
  { value: "under_5_lakh",    label: "Under ₹5L" },
  { value: "5_10_lakh",       label: "₹5L – 10L" },
  { value: "10_25_lakh",      label: "₹10L – 25L" },
  { value: "25_50_lakh",      label: "₹25L – 50L" },
  { value: "50_lakh_1_cr",    label: "₹50L – 1Cr" },
  { value: "above_1_cr",      label: "Above ₹1Cr" },
  { value: "undisclosed",     label: "Not sharing" },
];

const TIMELINES: Array<{ value: BusinessStartTimeline; label: string }> = [
  { value: "immediately",     label: "Right now" },
  { value: "within_1_month",  label: "Within 1 month" },
  { value: "1_3_months",      label: "1–3 months" },
  { value: "3_6_months",      label: "3–6 months" },
  { value: "6_plus_months",   label: "6+ months" },
];

const SUPPORT_AREAS: Array<{ value: BusinessSupportArea; label: string; icon: string }> = [
  { value: "business_plan",        label: "Business plan",       icon: "📋" },
  { value: "company_registration", label: "Company registration",icon: "🏛️" },
  { value: "licenses",             label: "Licenses",            icon: "📄" },
  { value: "factory_setup",        label: "Factory setup",       icon: "🏭" },
  { value: "vendor_sourcing",      label: "Vendor sourcing",     icon: "🤝" },
  { value: "finance_funding",      label: "Finance & funding",   icon: "💰" },
  { value: "compliance_tax",       label: "Compliance & tax",    icon: "🧮" },
  { value: "hiring_training",      label: "Hiring & training",   icon: "👥" },
  { value: "technology_setup",     label: "Technology setup",    icon: "💻" },
  { value: "go_to_market",         label: "Go-to-market",        icon: "🚀" },
];

const EXPERIENCE: Array<{ value: BusinessFounderExperience; label: string }> = [
  { value: "first_time",     label: "First time founder" },
  { value: "under_2_years",  label: "Under 2 years" },
  { value: "2_to_5_years",   label: "2–5 years" },
  { value: "5_plus_years",   label: "5+ years" },
];

const CONTACT_CHANNELS: Array<{ value: BusinessContactChannel; label: string; icon: string }> = [
  { value: "phone",    label: "Phone",    icon: "📞" },
  { value: "email",    label: "Email",    icon: "📧" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "chat",     label: "Chat",     icon: "🗨️" },
];

/* ─── Shared UI atoms ────────────────────────────────────────── */

const baseInput: React.CSSProperties = {
  border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)",
};
const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(20,141,178,0.2)]";

const Field = ({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
      {label}{required && <span style={{ color: "var(--accent)" }}> *</span>}
    </p>
    {children}
    {hint && !error && <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>{hint}</p>}
    {error && <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{error}</p>}
  </div>
);

/** Single-select chip row */
const ChipSelect = <T extends string>({
  options, value, onSelect, error,
}: { options: Array<{ value: T; label: string; icon?: string }>; value: T | ""; onSelect: (v: T) => void; error?: string }) => (
  <div className="space-y-1.5">
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <motion.button
            key={o.value} type="button"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(o.value)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
            style={{
              border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
              backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
              color: active ? "var(--primary)" : "var(--foreground)",
              boxShadow: active ? "var(--shadow-primary)" : "none",
            }}
          >
            {o.icon && <span>{o.icon}</span>}
            {o.label}
            {active && <span className="text-[9px] font-bold">✓</span>}
          </motion.button>
        );
      })}
    </div>
    {error && <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{error}</p>}
  </div>
);

/** Multi-select chip grid */
const MultiChipSelect = <T extends string>({
  options, values, onToggle,
}: { options: Array<{ value: T; label: string; icon?: string }>; values: T[]; onToggle: (v: T) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const active = values.includes(o.value);
      return (
        <motion.button
          key={o.value} type="button"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => onToggle(o.value)}
          className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
          style={{
            border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
            backgroundColor: active ? "var(--primary)" : "var(--surface)",
            color: active ? "#fff" : "var(--foreground)",
            boxShadow: active ? "var(--shadow-primary)" : "none",
          }}
        >
          {o.icon && <span>{o.icon}</span>}
          {o.label}
        </motion.button>
      );
    })}
  </div>
);

/* ─── Step indicator ─────────────────────────────────────────── */

const StepIndicator = ({ step }: { step: 1 | 2 }) => (
  <div className="flex items-center gap-0">
    {[{ n: 1, label: "Business basics" }, { n: 2, label: "Support & contact" }].map(({ n, label }, i) => {
      const done = n < step;
      const active = n === step;
      return (
        <div key={n} className="flex flex-1 items-center">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ backgroundColor: done || active ? "var(--primary)" : "var(--border)", scale: active ? 1.1 : 1 }}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            >
              {done ? "✓" : n}
            </motion.div>
            <span className="text-xs font-semibold"
              style={{ color: active ? "var(--primary)" : done ? "var(--foreground)" : "var(--medium-gray)" }}>
              {label}
            </span>
          </div>
          {i === 0 && (
            <motion.div
              animate={{ backgroundColor: done ? "var(--primary)" : "var(--border)" }}
              className="mx-3 flex-1 h-px"
            />
          )}
        </div>
      );
    })}
  </div>
);

/* ─── Form state ─────────────────────────────────────────────── */

type FormState = {
  businessType: string;
  workModel: BusinessWorkModel | "";
  location: string;
  budgetRange: BusinessBudgetRange | "";
  startTimeline: BusinessStartTimeline | "";
  supportAreas: BusinessSupportArea[];
  founderExperience: BusinessFounderExperience;
  teamSize: string;
  preferredContactChannel: BusinessContactChannel;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
};

const INITIAL: FormState = {
  businessType: "", workModel: "", location: "", budgetRange: "", startTimeline: "",
  supportAreas: [], founderExperience: "first_time", teamSize: "", preferredContactChannel: "phone",
  contactName: "", contactEmail: "", contactPhone: "", notes: "",
};

/* ─── Main component ─────────────────────────────────────────── */

export const BusinessSetupForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ trackingReference: string } | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  };

  const toggleSupport = (area: BusinessSupportArea) =>
    set("supportAreas", form.supportAreas.includes(area)
      ? form.supportAreas.filter((a) => a !== area)
      : [...form.supportAreas, area]);

  const validateStep1 = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.businessType.trim()) errs.businessType = "Required — describe your business idea";
    if (!form.workModel) errs.workModel = "Select a work model";
    if (!form.location.trim()) errs.location = "Enter your city and state";
    if (!form.budgetRange) errs.budgetRange = "Select your budget range";
    if (!form.startTimeline) errs.startTimeline = "When do you plan to start?";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (form.contactEmail.trim() && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) {
      errs.contactEmail = "Enter a valid email";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    try {
      setSubmitting(true); setSubmitError(null);
      const payload: CreateBusinessSetupRequestInput = {
        businessType: form.businessType.trim(),
        workModel: form.workModel as BusinessWorkModel,
        location: form.location.trim(),
        budgetRange: form.budgetRange as BusinessBudgetRange,
        startTimeline: form.startTimeline as BusinessStartTimeline,
        supportAreas: form.supportAreas.length ? form.supportAreas : undefined,
        founderExperience: form.founderExperience,
        teamSize: form.teamSize ? parseInt(form.teamSize) : undefined,
        preferredContactChannel: form.preferredContactChannel,
        contactName: form.contactName.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      const res = await businessSetupService.create(payload);
      setResult({ trackingReference: res.trackingReference ?? res.request?.trackingReference ?? "—" });
    } catch (err) {
      setSubmitError(err instanceof ApiError || err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success state ── */
  if (result) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="w-full max-w-md space-y-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 20 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl"
            style={{ background: "linear-gradient(135deg, var(--primary-light), rgba(20,141,178,0.04))", border: "2px solid rgba(20,141,178,0.2)" }}
          >
            🚀
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Request submitted!</h1>
            <p className="mt-2 text-base" style={{ color: "var(--medium-gray)" }}>
              Our business setup team will contact you within 24 hours to get you started.
            </p>
          </motion.div>

          {/* Tracking card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-3xl p-6 text-left"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
              Your tracking reference
            </p>
            <p className="mt-2 font-mono text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {result.trackingReference}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>
              Save this reference to follow up with our team.
            </p>

            <div className="mt-5 space-y-2.5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
                What happens next
              </p>
              {[
                "Team reviews your requirements within 24 hours",
                "We call / email you to discuss your business plan",
                "You get a personalised onboarding roadmap",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--foreground)" }}>
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: "var(--primary)" }}>{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="flex flex-col gap-3"
          >
            <Link href="/dashboard"
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
              Go to dashboard →
            </Link>
            <Link href="/dashboard/services"
              className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
              Browse services
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--medium-gray)" }}>
          <Link href="/dashboard/services" className="transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
            Services
          </Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)" }}>Business setup</span>
        </div>

        {/* Hero banner */}
        <div
          className="mt-4 overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ background: "var(--gradient-brand-deep)", color: "#fff" }}
        >
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white opacity-[0.06]" />
            <div className="pointer-events-none absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white opacity-[0.05]" />

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                Free concierge service
              </div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Start your own business
              </h1>
              <p className="max-w-lg text-sm text-white/75">
                Tell us your goal and our team will help you launch professionally — from registration to go-to-market.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-white/80">
              {["Company registration & GST", "Factory & vendor setup", "Finance & compliance support"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Step indicator */}
      <StepIndicator step={step} />

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* ── Step 1: Business basics ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <div
                className="space-y-5 rounded-3xl p-6"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                  Step 1 — Business basics
                </p>

                <Field label="What business are you starting?" required error={errors.businessType}
                  hint="Describe your idea: e.g. Snacks manufacturing, packaging unit, textile trading">
                  <input
                    className={inputCls} style={baseInput}
                    placeholder="e.g. Spice manufacturing unit for export"
                    value={form.businessType}
                    onChange={(e) => set("businessType", e.target.value)}
                  />
                </Field>

                <Field label="Work model" required error={errors.workModel}>
                  <ChipSelect options={WORK_MODELS} value={form.workModel} onSelect={(v) => set("workModel", v)} error={errors.workModel} />
                </Field>

                <Field label="Location" required error={errors.location} hint="City and state where you plan to operate">
                  <input
                    className={inputCls} style={baseInput}
                    placeholder="e.g. Surat, Gujarat"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </Field>

                <Field label="Expected investment budget" required error={errors.budgetRange}>
                  <ChipSelect options={BUDGETS} value={form.budgetRange} onSelect={(v) => set("budgetRange", v)} error={errors.budgetRange} />
                </Field>

                <Field label="When do you want to start?" required error={errors.startTimeline}>
                  <ChipSelect options={TIMELINES} value={form.startTimeline} onSelect={(v) => set("startTimeline", v)} error={errors.startTimeline} />
                </Field>
              </div>

              <div className="flex justify-end">
                <motion.button
                  type="button" onClick={handleNext}
                  whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
                >
                  Continue → Support & contact
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Support & contact ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              {/* Support areas */}
              <div
                className="space-y-5 rounded-3xl p-6"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                  Step 2 — Support & contact
                </p>

                <Field label="Where do you need help?" hint="Pick all that apply — our team will prioritise accordingly">
                  <MultiChipSelect options={SUPPORT_AREAS} values={form.supportAreas} onToggle={toggleSupport} />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Founder experience">
                    <ChipSelect
                      options={EXPERIENCE}
                      value={form.founderExperience}
                      onSelect={(v) => set("founderExperience", v)}
                    />
                  </Field>
                  <Field label="Current team size" hint="0 if starting solo">
                    <input
                      type="number" min="0" max="10000"
                      className={inputCls} style={baseInput}
                      placeholder="0"
                      value={form.teamSize}
                      onChange={(e) => set("teamSize", e.target.value.replace(/\D/g, ""))}
                    />
                  </Field>
                </div>
              </div>

              {/* Contact */}
              <div
                className="space-y-5 rounded-3xl p-6"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                  Contact information
                </p>

                <Field label="How should we reach you?" >
                  <ChipSelect options={CONTACT_CHANNELS} value={form.preferredContactChannel} onSelect={(v) => set("preferredContactChannel", v)} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Your name">
                    <input className={inputCls} style={baseInput} placeholder="Full name"
                      value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
                  </Field>
                  <Field label="Phone">
                    <input type="tel" className={inputCls} style={baseInput} placeholder="+91 98765 43210"
                      value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
                  </Field>
                  <Field label="Email" error={errors.contactEmail}>
                    <input type="email" className={inputCls} style={{ ...baseInput, borderColor: errors.contactEmail ? "var(--accent)" : "var(--border)" }}
                      placeholder="you@company.com"
                      value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
                  </Field>
                </div>

                <Field label="Additional notes" hint="Describe any constraints, timeline pressures, or specific requirements">
                  <textarea rows={3} className={inputCls} style={baseInput}
                    placeholder="Share anything that helps us understand your situation better…"
                    value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </Field>
              </div>

              {submitError && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                  {submitError}
                </motion.div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button" onClick={() => { setStep(1); setSubmitError(null); }}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  ← Back
                </button>
                <motion.button
                  type="submit" disabled={submitting}
                  whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                      Submitting…
                    </>
                  ) : (
                    <>🚀 Submit setup request</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
