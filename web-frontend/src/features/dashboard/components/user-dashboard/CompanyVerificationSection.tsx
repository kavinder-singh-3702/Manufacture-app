import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { companyVerificationService } from "@/src/services/companyVerification";
import { ApiError } from "@/src/lib/api-error";
import {
  COMPANY_VERIFICATION_ACCOUNT_TYPES,
  CompanyVerificationAccountType,
} from "@/src/constants/business";
import { useDashboardContext } from "./context";
import type {
  CompanyVerificationDocumentUpload,
  CompanyVerificationLatestResponse,
  CompanyVerificationRequest,
  CompanyVerificationStatus,
} from "@/src/types/company";

const verificationSpotlightBenefits = [
  "Unlock priority placement across buyer searches",
  "Signal compliance and unlock private RFQs",
  "Share a trust badge on proposals & chat",
] as const;

type UploadEntry = {
  payload: CompanyVerificationDocumentUpload;
  fileName: string;
  sizeLabel: string;
};

export type CompanyVerificationSectionProps = {
  onCompanyNameResolved?: (name?: string) => void;
  onRequestVerification?: () => void;
  openSignal?: number;
  hideInline?: boolean;
};

export const CompanyVerificationSection = ({
  onCompanyNameResolved,
  onRequestVerification,
  openSignal,
  hideInline = false,
}: CompanyVerificationSectionProps) => {
  const { user, activeCompany } = useDashboardContext();
  const activeCompanyId = (activeCompany?.id ?? (user.activeCompany as string | undefined)) as string | undefined;
  const [latest, setLatest] = useState<CompanyVerificationLatestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gstDocument, setGstDocument] = useState<UploadEntry | null>(null);
  const [aadhaarDocument, setAadhaarDocument] = useState<UploadEntry | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const lastOpenSignal = useRef<number | undefined>(undefined);
  const companyType = latest?.company?.type as CompanyVerificationAccountType | string | undefined;
  const isCompanyTypeEligible =
    !companyType || COMPANY_VERIFICATION_ACCOUNT_TYPES.includes(companyType as CompanyVerificationAccountType);

  const loadLatest = useCallback(async () => {
    if (!activeCompanyId) return;
    try {
      setLoading(true);
      setFetchError(null);
      const response = await companyVerificationService.getLatest(activeCompanyId);
      setLatest(response);
      onCompanyNameResolved?.(response.company?.displayName);
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "Unable to load verification status";
      setFetchError(message);
      onCompanyNameResolved?.(undefined);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, onCompanyNameResolved]);

  useEffect(() => {
    if (activeCompanyId) {
      loadLatest();
    } else {
      setLatest(null);
      onCompanyNameResolved?.(undefined);
    }
  }, [activeCompanyId, loadLatest, onCompanyNameResolved]);

  const request = latest?.request ?? null;
  const complianceStatus = latest?.company?.complianceStatus ?? "pending";
  const statusMeta = getVerificationStatusMeta(request?.status ?? complianceStatus);
  const hasPendingRequest = request?.status === "pending";

  useEffect(() => {
    if (!request) {
      setHistoryOpen(false);
    }
  }, [request]);

  useEffect(() => {
    if (!openSignal || openSignal === lastOpenSignal.current) return;
    lastOpenSignal.current = openSignal;
    setFormError(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  }, [openSignal]);

  const handleDocumentSelect = async (files: FileList | null, setter: (entry: UploadEntry | null) => void) => {
    if (!files || !files.length) return;
    const file = files[0];
    try {
      const payload = await fileToDocumentPayload(file);
      setter({
        payload,
        fileName: file.name,
        sizeLabel: formatFileSize(file.size),
      });
      setFormError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to read selected file.";
      setter(null);
      setFormError(message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeCompanyId) {
      setFormError("Select an active company before submitting for verification.");
      return;
    }
    if (!gstDocument?.payload || !aadhaarDocument?.payload) {
      setFormError("Upload both GST certificate and Aadhaar card scans before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      setSuccessMessage(null);
      await companyVerificationService.submit(activeCompanyId, {
        gstCertificate: gstDocument.payload,
        aadhaarCard: aadhaarDocument.payload,
        notes: notes.trim() || undefined,
      });
      setSuccessMessage("Verification request submitted. Compliance team will review it shortly.");
      setNotes("");
      setGstDocument(null);
      setAadhaarDocument(null);
      loadLatest();
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "Unable to submit verification request.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const ctaDisabled = !activeCompanyId || loading || !isCompanyTypeEligible || hasPendingRequest;

  const handleOpenModal = () => {
    if (ctaDisabled) return;
    setFormError(null);
    setSuccessMessage(null);
    if (onRequestVerification) {
      onRequestVerification();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  return (
    <>
      {!hideInline ? (
        <section id="company-verification" className="rounded-3xl border border-[var(--border-soft)] bg-gradient-to-br from-white to-[#fff8fd] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
                Compliance
              </p>
              <h2 className="text-2xl font-semibold text-[#1f1422]">Company verification</h2>
              <p className="text-sm text-[#5f3c4c]">
                Active company:{" "}
                <span className="font-semibold text-[#2e1f2c]">{latest?.company?.displayName ?? "Not selected"}</span> ·{" "}
                {latest?.company?.type ?? "Type not set"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
              <button
                type="button"
                onClick={loadLatest}
                className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[#5a3042] transition hover:border-[var(--color-plum)] hover:text-[var(--color-plum)] disabled:opacity-60"
                disabled={!activeCompanyId || loading}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
          {fetchError ? (
            <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#7f1d1d]">
              {fetchError}{" "}
              <button type="button" onClick={loadLatest} className="font-semibold underline">
                Try again
              </button>
            </div>
          ) : null}
          {activeCompanyId ? (
            <>
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm shadow-[#e7ddea]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#2e1f2c]">Latest status</p>
                      <p className="text-xs text-[#7a5d6b]">
                        {request
                          ? `Updated ${formatDateTime(request.updatedAt ?? request.createdAt)}`
                          : "No verification requests yet"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((prev) => !prev)}
                      disabled={!request}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold text-[var(--color-plum)] transition hover:border-[var(--color-plum)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {historyOpen ? "Hide history" : "View history"}
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className={`transition ${historyOpen ? "rotate-180" : ""}`}>
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-[#5c4451]">{statusMeta.helper}</p>
                  {request?.rejectionReason ? (
                    <p className="mt-3 rounded-2xl border border-[#fecaca] bg-[#fff5f5] p-3 text-sm text-[#7f1d1d]">
                      Rejection reason: <span className="font-semibold">{request.rejectionReason}</span>
                    </p>
                  ) : null}
                  {hasPendingRequest ? (
                    <p className="mt-3 rounded-2xl bg-[#ecfdf5] p-3 text-sm font-semibold text-[#065f46]">
                      We&apos;re currently reviewing your documents. You&apos;ll receive an email as soon as we conclude.
                    </p>
                  ) : null}
                </div>
                <div className="rounded-3xl border border-[#bbf7d0] bg-gradient-to-br from-white via-[#f5fff9] to-[#e7fff1] p-5 shadow-sm shadow-[#ccf2dc]">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                    Credibility spotlight
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#174836]">Turn trust into more deals</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[#174836]">
                    {verificationSpotlightBenefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#0d9f6e]" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    disabled={ctaDisabled}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d9f6e33] transition disabled:opacity-50"
                    style={{ backgroundColor: "#0d9f6e" }}
                  >
                    {hasPendingRequest ? "Request in review" : "Earn the verified badge"}
                  </button>
                  <p className="mt-2 text-xs text-[#256c51]">
                    {isCompanyTypeEligible
                      ? hasPendingRequest
                        ? "Your submission is being reviewed by Manufacture compliance."
                        : "Trader & manufacturer accounts can upload GST + Aadhaar to claim the badge."
                      : "Only trader and manufacturer account types are eligible for verification."}
                  </p>
                </div>
              </div>
              <AnimatePresence initial={false}>
                {historyOpen ? (
                  <motion.div
                    key="verification-history"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="mt-5"
                  >
                    <VerificationHistory request={request} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </>
          ) : (
            <p className="mt-6 text-sm text-[#5c4451]">
              Select or create a trader/manufacturer company to unlock verification. Once selected, your badge controls will appear here.
            </p>
          )}
        </section>
      ) : null}
      <VerificationModal
        open={isModalOpen}
        onClose={handleCloseModal}
        companyName={latest?.company?.displayName ?? user.displayName ?? user.email}
        companyType={latest?.company?.type}
        gstDocument={gstDocument}
        aadhaarDocument={aadhaarDocument}
        onSelectGst={(files) => handleDocumentSelect(files, setGstDocument)}
        onSelectAadhaar={(files) => handleDocumentSelect(files, setAadhaarDocument)}
        notes={notes}
        onChangeNotes={setNotes}
        onSubmit={handleSubmit}
        formError={formError}
        successMessage={successMessage}
        submitting={submitting}
      />
    </>
  );
};

const VerificationHistory = ({ request }: { request: CompanyVerificationRequest | null }) => {
  if (!request) {
    return (
      <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5">
        <p className="text-sm text-[#5c4451]">
          When you submit your GST + Aadhaar documents, the compliance team&apos;s updates will appear here.
        </p>
      </div>
    );
  }

  const docEntries = [
    { label: "GST certificate", doc: request.documents?.gstCertificate },
    { label: "Aadhaar card", doc: request.documents?.aadhaarCard },
  ];
  const requestedBy = request.requestedBy?.displayName ?? request.requestedBy?.email ?? "You";
  const auditTrail = request.auditTrail ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-3xl border border-[var(--border-soft)] bg-white p-5 shadow-sm shadow-[#e7ddea]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
          Latest submission
        </p>
        <h4 className="mt-2 text-lg font-semibold text-[#1f1422]">Documents on file</h4>
        <p className="text-sm text-[#5c4451]">
          Submitted {formatDateTime(request.createdAt)} by {requestedBy}.
        </p>
        <div className="mt-4 space-y-3">
          {docEntries.map((entry) => (
            <div
              key={entry.label}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3 text-sm text-[#2e1f2c]"
            >
              <p className="font-semibold">{entry.label}</p>
              {entry.doc ? (
                <p className="text-xs text-[#7a5d6b]">
                  {entry.doc.fileName ?? "Uploaded file"}
                  {entry.doc.size ? ` · ${formatFileSize(entry.doc.size)}` : ""}
                </p>
              ) : (
                <p className="text-xs text-[#b98b9e]">Waiting on upload</p>
              )}
              {entry.doc?.uploadedAt ? (
                <p className="text-xs text-[#b98b9e]">Uploaded {formatDateTime(entry.doc.uploadedAt)}</p>
              ) : null}
            </div>
          ))}
        </div>
        {request.notes ? (
          <p className="mt-4 rounded-2xl bg-[var(--surface-muted)] p-3 text-sm text-[#5c4451]">
            Submitter note: <span className="font-semibold">{request.notes}</span>
          </p>
        ) : null}
        {request.decisionNotes ? (
          <p className="mt-2 rounded-2xl bg-white/70 p-3 text-sm text-[#2e1f2c]">
            Reviewer note: <span className="font-semibold">{request.decisionNotes}</span>
          </p>
        ) : null}
      </div>
      <div className="rounded-3xl border border-[var(--border-soft)] bg-white p-5 shadow-sm shadow-[#e7ddea]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
          Audit trail
        </p>
        <h4 className="mt-2 text-lg font-semibold text-[#1f1422]">Verification steps</h4>
        {auditTrail.length ? (
          <ul className="mt-4 space-y-3">
            {auditTrail.map((entry, index) => (
              <li
                key={`${entry.action}-${entry.at ?? index}`}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3"
              >
                <p className="text-sm font-semibold text-[#2e1f2c] capitalize">{entry.action}</p>
                <p className="text-xs text-[#7a5d6b]">
                  {formatDateTime(entry.at)} · {entry.by?.displayName ?? entry.by?.email ?? "System"}
                </p>
                {entry.notes ? <p className="mt-1 text-xs text-[#5c4451]">{entry.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#5c4451]">
            Once compliance reviews your submission, their actions will show up here with timestamps.
          </p>
        )}
      </div>
    </div>
  );
};

type VerificationModalProps = {
  open: boolean;
  onClose: () => void;
  companyName?: string | null;
  companyType?: string | null;
  gstDocument: UploadEntry | null;
  aadhaarDocument: UploadEntry | null;
  onSelectGst: (files: FileList | null) => void;
  onSelectAadhaar: (files: FileList | null) => void;
  notes: string;
  onChangeNotes: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  formError: string | null;
  successMessage: string | null;
  submitting: boolean;
};

const VerificationModal = ({
  open,
  onClose,
  companyName,
  companyType,
  gstDocument,
  aadhaarDocument,
  onSelectGst,
  onSelectAadhaar,
  notes,
  onChangeNotes,
  onSubmit,
  formError,
  successMessage,
  submitting,
}: VerificationModalProps) => (
  <AnimatePresence>
    {open ? (
      <>
        <motion.div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-xl rounded-3xl border border-[var(--border-soft)] bg-white p-6 shadow-2xl shadow-[#5a304236]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                  Verification request
                </p>
                <h3 className="text-xl font-semibold text-[#1f1422]">Submit documents</h3>
                <p className="text-sm text-[#5f3c4c]">
                  We&apos;ll review GST + Aadhaar uploads for {companyName}. {companyType ? `Current type: ${companyType}.` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--border-soft)] p-2 text-[#5a3042] disabled:opacity-60"
                aria-label="Close verification modal"
                disabled={submitting}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <DocumentUploadField label="GST certificate" entry={gstDocument} onSelect={onSelectGst} disabled={submitting} />
              <DocumentUploadField label="Aadhaar card" entry={aadhaarDocument} onSelect={onSelectAadhaar} disabled={submitting} />
              <label className="text-sm font-semibold text-[#2e1f2c]">
                Reviewer notes (optional)
                <textarea
                  className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-[#2e1f2c] focus:outline-none"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(event) => onChangeNotes(event.target.value)}
                  placeholder="Share any procurement context that speeds up review."
                  disabled={submitting}
                />
              </label>
              {formError ? <p className="text-sm font-semibold text-[#b91c1c]">{formError}</p> : null}
              {successMessage ? <p className="text-sm font-semibold text-[#14532d]">{successMessage}</p> : null}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[#5a3042] disabled:opacity-60"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0d9f6e] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#0d9f6e33] disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </>
    ) : null}
  </AnimatePresence>
);

const DocumentUploadField = ({
  label,
  entry,
  onSelect,
  disabled,
}: {
  label: string;
  entry: UploadEntry | null;
  onSelect: (files: FileList | null) => void;
  disabled?: boolean;
}) => (
  <div>
    <p className="text-sm font-semibold text-[#2e1f2c]">{label}</p>
    <label
      className={`mt-2 block rounded-2xl border border-dashed border-[var(--border-soft)] bg-white/70 px-4 py-4 text-sm text-[#5c4451] ${
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
    >
      <input
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          onSelect(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      {entry ? (
        <div>
          <p className="font-semibold text-[#2e1f2c]">{entry.fileName}</p>
          <p className="text-xs text-[#7a5d6b]">{entry.sizeLabel}</p>
          <p className="text-xs text-[var(--color-plum)]">Click to replace file</p>
        </div>
      ) : (
        <p>Click to upload PDF or image scans.</p>
      )}
    </label>
  </div>
);

const fileToDocumentPayload = (file: File): Promise<CompanyVerificationDocumentUpload> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read file contents."));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1] ?? "" : result;
      resolve({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        content: base64,
      });
    };
    reader.onerror = () => reject(new Error("Unable to read file contents."));
    reader.readAsDataURL(file);
  });
};

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;
  return `${size.toFixed(1)} ${units[index]}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const getVerificationStatusMeta = (status?: CompanyVerificationStatus | string | null) => {
  const normalized = typeof status === "string" ? status.toLowerCase() : "not_submitted";
  const metaMap: Record<string, { label: string; className: string; helper: string }> = {
    approved: {
      label: "Verified",
      className: "border-[#bbf7d0] bg-[#ecfdf5] text-[#065f46]",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    active: {
      label: "Verified",
      className: "border-[#bbf7d0] bg-[#ecfdf5] text-[#065f46]",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    verified: {
      label: "Verified",
      className: "border-[#bbf7d0] bg-[#ecfdf5] text-[#065f46]",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    pending: {
      label: "Under review",
      className: "border-[#fde68a] bg-[#fff7ed] text-[#92400e]",
      helper: "Our compliance team is reviewing the latest submission. Expect updates soon.",
    },
    rejected: {
      label: "Needs attention",
      className: "border-[#fecaca] bg-[#fef2f2] text-[#7f1d1d]",
      helper: "We couldn't approve the last submission. Review the notes and try again.",
    },
  };

  return (
    metaMap[normalized] ?? {
      label: "Not submitted",
      className: "border-[#f5d6e8] bg-[#fff7fb] text-[#5a3042]",
      helper: "Earn trust by submitting GST + Aadhaar documents once you're ready.",
    }
  );
};
