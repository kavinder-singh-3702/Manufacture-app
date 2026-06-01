"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { companyVerificationService } from "@/src/services/companyVerification";
import { ApiError } from "@/src/lib/api-error";
import type { CompanyVerificationDocumentUpload } from "@/src/types/company";

const STEPS = ["Requirements", "Documents", "Submitted"] as const;
type Step = (typeof STEPS)[number];

type UploadEntry = { payload: CompanyVerificationDocumentUpload; fileName: string; sizeLabel: string };

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), u.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${u[i]}`;
};

const fileToPayload = (file: File): Promise<CompanyVerificationDocumentUpload> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") { reject(new Error("Cannot read file")); return; }
      resolve({ fileName: file.name, mimeType: file.type || "application/octet-stream", content: r.includes(",") ? r.split(",")[1] ?? "" : r });
    };
    reader.onerror = () => reject(new Error("Cannot read file"));
    reader.readAsDataURL(file);
  });

const BENEFITS = [
  "Priority placement in buyer search results",
  "Access to private RFQs and restricted tenders",
  "Verified badge on your profile and proposals",
  "Increased buyer confidence and conversion rates",
];

const REQUIREMENTS = [
  { icon: "📄", label: "GST Certificate", desc: "Current GST registration certificate (PDF or image)" },
  { icon: "🪪", label: "Aadhaar Card", desc: "Proprietor or authorized signatory's Aadhaar scan" },
];

const DropZone = ({
  label, icon, entry, disabled,
  onSelect,
}: {
  label: string; icon: string; entry: UploadEntry | null;
  disabled?: boolean; onSelect: (files: FileList | null) => void;
}) => (
  <div>
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
      {icon} {label}
    </p>
    <label
      className={`block cursor-pointer rounded-2xl p-5 text-center transition-all ${disabled ? "cursor-not-allowed opacity-60" : "hover:shadow-md"}`}
      style={{ border: `1.5px dashed ${entry ? "var(--primary)" : "var(--border)"}`, backgroundColor: entry ? "var(--primary-light)" : "var(--background)" }}
    >
      <input type="file" accept=".pdf,image/*" className="hidden" disabled={disabled}
        onChange={(e) => { onSelect(e.target.files); e.currentTarget.value = ""; }} />
      {entry ? (
        <div className="space-y-1">
          <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>✓ {entry.fileName}</p>
          <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{entry.sizeLabel} · Click to replace</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>⬆️</div>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Click to upload</p>
          <p className="text-xs" style={{ color: "var(--medium-gray)" }}>PDF or image scans accepted</p>
        </div>
      )}
    </label>
  </div>
);

export const CompanyVerificationDrawer = ({
  open,
  companyId,
  companyName,
  companyType,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  companyId: string;
  companyName?: string | null;
  companyType?: string | null;
  onClose: () => void;
  onSubmitted?: () => void;
}) => {
  const [step, setStep] = useState<Step>("Requirements");
  const [gst, setGst] = useState<UploadEntry | null>(null);
  const [aadhaar, setAadhaar] = useState<UploadEntry | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);

  const resetAndClose = () => {
    if (submitting) return;
    setStep("Requirements");
    setGst(null); setAadhaar(null); setNotes(""); setError(null);
    onClose();
  };

  const handleDocSelect = async (files: FileList | null, setter: (e: UploadEntry | null) => void) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const payload = await fileToPayload(file);
      setter({ payload, fileName: file.name, sizeLabel: formatFileSize(file.size) });
      setError(null);
    } catch (err) {
      setter(null);
      setError(err instanceof Error ? err.message : "Could not read file.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gst?.payload || !aadhaar?.payload) {
      setError("Please upload both GST certificate and Aadhaar card.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await companyVerificationService.submit(companyId, {
        gstCertificate: gst.payload,
        aadhaarCard: aadhaar.payload,
        notes: notes.trim() || undefined,
      });
      setStep("Submitted");
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={resetAndClose}
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
                style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l7 4v5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V7l7-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "#16A34A" }}>
                  Verification
                </p>
                <h2 className="text-lg font-bold truncate" style={{ color: "var(--foreground)" }}>
                  {companyName ? `Verify ${companyName}` : "Earn the verified badge"}
                </h2>
              </div>
              <button
                type="button" onClick={resetAndClose} disabled={submitting}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl font-bold transition-opacity hover:opacity-60 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}
              >×</button>
            </div>

            {/* Step indicator */}
            {step !== "Submitted" && (
              <div className="flex items-center px-6 py-3" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                {STEPS.filter(s => s !== "Submitted").map((s, i) => {
                  const done = i < stepIndex;
                  const active = s === step;
                  return (
                    <div key={s} className="flex flex-1 items-center">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all"
                          style={{
                            backgroundColor: done ? "#16A34A" : active ? "#16A34A" : "var(--border)",
                            color: done || active ? "#fff" : "var(--medium-gray)",
                          }}>
                          {done ? "✓" : i + 1}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: active ? "#16A34A" : done ? "var(--foreground)" : "var(--medium-gray)" }}>
                          {s}
                        </span>
                      </div>
                      {i < 1 && <div className="mx-3 flex-1 h-px" style={{ backgroundColor: done ? "#16A34A" : "var(--border)" }} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Body */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {step === "Requirements" && (
                  <motion.div
                    key="req"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                  >
                    {/* Eligibility */}
                    {companyType && !["trader", "manufacturer"].includes(companyType.toLowerCase()) && (
                      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--accent)" }}>
                        <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                          Verification is available for Trader and Manufacturer account types only.
                        </p>
                      </div>
                    )}

                    {/* What you'll need */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--medium-gray)" }}>
                        Documents needed
                      </p>
                      {REQUIREMENTS.map((r) => (
                        <div key={r.label} className="flex items-start gap-3 rounded-2xl p-4"
                          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                          <span className="text-2xl flex-shrink-0">{r.icon}</span>
                          <div>
                            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{r.label}</p>
                            <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{r.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Benefits */}
                    <div className="rounded-2xl p-4 space-y-3"
                      style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }}>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "#16A34A" }}>
                        What you unlock
                      </p>
                      <ul className="space-y-2">
                        {BENEFITS.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-sm" style={{ color: "#15803D" }}>
                            <span className="mt-0.5 h-4 w-4 flex-shrink-0 flex items-center justify-center rounded-full bg-[#16A34A] text-white text-[9px] font-bold">✓</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                      Typical review time: 24–48 hours. You&apos;ll receive an email notification with the outcome.
                    </p>
                  </motion.div>
                )}

                {step === "Documents" && (
                  <motion.form
                    key="docs"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="flex flex-1 flex-col overflow-hidden"
                  >
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                      <DropZone label="GST Certificate" icon="📄" entry={gst} disabled={submitting}
                        onSelect={(files) => handleDocSelect(files, setGst)} />
                      <DropZone label="Aadhaar Card" icon="🪪" entry={aadhaar} disabled={submitting}
                        onSelect={(files) => handleDocSelect(files, setAadhaar)} />
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                          Notes for reviewer (optional)
                        </p>
                        <textarea
                          rows={3}
                          className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                          style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                          placeholder="Any context that speeds up review…"
                          value={notes} onChange={(e) => setNotes(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl px-4 py-3 text-sm font-medium"
                          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                        >{error}</motion.div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-6 py-4"
                      style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                      <button type="button" onClick={() => setStep("Requirements")} disabled={submitting}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
                        style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                        ← Back
                      </button>
                      <button type="submit" disabled={submitting || !gst || !aadhaar}
                        className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: "#16A34A", boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }}>
                        {submitting ? "Submitting…" : "Submit for review"}
                      </button>
                    </div>
                  </motion.form>
                )}

                {step === "Submitted" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                      className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
                      style={{ backgroundColor: "#DCFCE7", border: "2px solid #bbf7d0" }}
                    >✅</motion.div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                        Verification submitted!
                      </h3>
                      <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
                        Our compliance team will review your documents within 24–48 hours. You&apos;ll receive an email with the outcome.
                      </p>
                    </div>
                    <div className="rounded-2xl p-4 w-full space-y-2"
                      style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                        What happens next
                      </p>
                      {["Documents reviewed by compliance team", "Badge activated if approved", "Email notification sent"].map((item, i) => (
                        <div key={item} className="flex items-center gap-3 text-sm" style={{ color: "var(--foreground)" }}>
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: "var(--primary)" }}>{i + 1}</span>
                          {item}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={resetAndClose}
                      className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white"
                      style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer for Requirements step */}
              {step === "Requirements" && (
                <div className="flex items-center justify-between gap-2 px-6 py-4"
                  style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                  <button type="button" onClick={resetAndClose}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => setStep("Documents")}
                    className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                    style={{ backgroundColor: "#16A34A", boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }}>
                    Continue → Upload docs
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
