"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { companyVerificationService } from "@/src/services/companyVerification";
import { ApiError } from "@/src/lib/api-error";
import {
  COMPANY_VERIFICATION_ACCOUNT_TYPES,
  CompanyVerificationAccountType,
} from "@/src/constants/business";
import { useDashboardContext } from "./context";
import { CompanyVerificationDrawer } from "@/src/features/company/components/CompanyVerificationDrawer";
import type {
  CompanyVerificationLatestResponse,
  CompanyVerificationRequest,
  CompanyVerificationStatus,
} from "@/src/types/company";

const verificationSpotlightBenefits = [
  "Unlock priority placement across buyer searches",
  "Signal compliance and unlock private RFQs",
  "Share a trust badge on proposals & chat",
] as const;

export type CompanyVerificationSectionProps = {
  onCompanyNameResolved?: (name?: string) => void;
};

/**
 * Full verification workspace — status, credibility spotlight, history
 * timeline, and the document-upload drawer. Lives on its own page
 * (/dashboard/verification) rather than embedded inline or behind a modal
 * signal, so this component owns its whole render — no more hideInline /
 * openSignal indirection.
 */
export const CompanyVerificationSection = ({
  onCompanyNameResolved,
}: CompanyVerificationSectionProps) => {
  const { user, activeCompany } = useDashboardContext();
  const activeCompanyId = (activeCompany?.id ?? (user.activeCompany as string | undefined)) as string | undefined;
  const [latest, setLatest] = useState<CompanyVerificationLatestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  const ctaDisabled = !activeCompanyId || loading || !isCompanyTypeEligible || hasPendingRequest;

  const handleOpenModal = () => {
    if (ctaDisabled) return;
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <section id="company-verification" className="rounded-3xl border p-5" style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, var(--card) 0%, var(--primary-light) 130%)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>Company verification</h2>
            <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
              Active company:{" "}
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>{latest?.company?.displayName ?? "Not selected"}</span> ·{" "}
              {latest?.company?.type ?? "Type not set"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className="inline-flex items-center rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: statusMeta.border, backgroundColor: statusMeta.bg, color: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
            <button
              type="button"
              onClick={loadLatest}
              className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:opacity-80 disabled:opacity-60"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--primary-dark)" }}
              disabled={!activeCompanyId || loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        {fetchError ? (
          <div className="mt-4 rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "var(--danger-bg)", color: "var(--danger-strong)" }}>
            {fetchError}{" "}
            <button type="button" onClick={loadLatest} className="font-semibold underline">
              Try again
            </button>
          </div>
        ) : null}
        {activeCompanyId ? (
          <>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-3xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Latest status</p>
                    <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                      {request
                        ? `Updated ${formatDateTime(request.updatedAt ?? request.createdAt)}`
                        : "No verification requests yet"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen((prev) => !prev)}
                    disabled={!request}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--primary)" }}
                  >
                    {historyOpen ? "Hide history" : "View history"}
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className={`transition ${historyOpen ? "rotate-180" : ""}`}>
                      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className="mt-4 text-sm" style={{ color: "var(--foreground)" }}>{statusMeta.helper}</p>
                {request?.rejectionReason ? (
                  <p className="mt-3 rounded-2xl border p-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "var(--danger-bg)", color: "var(--danger-strong)" }}>
                    Rejection reason: <span className="font-semibold">{request.rejectionReason}</span>
                  </p>
                ) : null}
                {hasPendingRequest ? (
                  <p className="mt-3 rounded-2xl p-3 text-sm font-semibold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-dark)" }}>
                    We&apos;re currently reviewing your documents. You&apos;ll receive an email as soon as we conclude.
                  </p>
                ) : null}
              </div>
              <div className="rounded-3xl border p-5" style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, var(--card) 0%, var(--primary-light) 100%)", boxShadow: "var(--shadow-sm)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                  Credibility spotlight
                </p>
                <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--foreground)" }}>Turn trust into more deals</h3>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--foreground)" }}>
                  {verificationSpotlightBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: "var(--success)" }} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  disabled={ctaDisabled}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
                  style={{ backgroundColor: "var(--success)", boxShadow: "0 6px 18px color-mix(in srgb, var(--success) 25%, transparent)" }}
                >
                  {hasPendingRequest ? "Request in review" : "Earn the verified badge"}
                </button>
                <p className="mt-2 text-xs" style={{ color: "var(--medium-gray)" }}>
                  {isCompanyTypeEligible
                    ? hasPendingRequest
                      ? "Your submission is being reviewed by ARVANN compliance."
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
          <p className="mt-6 text-sm" style={{ color: "var(--foreground)" }}>
            Select or create a trader/manufacturer company to unlock verification. Once selected, your badge controls will appear here.
          </p>
        )}
      </section>
      {activeCompanyId && (
        <CompanyVerificationDrawer
          open={isModalOpen}
          companyId={activeCompanyId}
          companyName={latest?.company?.displayName ?? user.displayName ?? user.email}
          companyType={latest?.company?.type}
          onClose={handleCloseModal}
          onSubmitted={() => { loadLatest(); }}
        />
      )}
    </>
  );
};

const VerificationHistory = ({ request }: { request: CompanyVerificationRequest | null }) => {
  if (!request) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-sm text-[var(--foreground)]">
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
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm shadow-[#e7ddea]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
          Latest submission
        </p>
        <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Documents on file</h4>
        <p className="text-sm text-[var(--foreground)]">
          Submitted {formatDateTime(request.createdAt)} by {requestedBy}.
        </p>
        <div className="mt-4 space-y-3">
          {docEntries.map((entry) => (
            <div
              key={entry.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)]"
            >
              <p className="font-semibold">{entry.label}</p>
              {entry.doc ? (
                <p className="text-xs text-[var(--medium-gray)]">
                  {entry.doc.fileName ?? "Uploaded file"}
                  {entry.doc.size ? ` · ${formatFileSize(entry.doc.size)}` : ""}
                </p>
              ) : (
                <p className="text-xs text-[var(--medium-gray)]">Waiting on upload</p>
              )}
              {entry.doc?.uploadedAt ? (
                <p className="text-xs text-[var(--medium-gray)]">Uploaded {formatDateTime(entry.doc.uploadedAt)}</p>
              ) : null}
            </div>
          ))}
        </div>
        {request.notes ? (
          <p className="mt-4 rounded-2xl bg-[var(--background)] p-3 text-sm text-[var(--foreground)]">
            Submitter note: <span className="font-semibold">{request.notes}</span>
          </p>
        ) : null}
        {request.decisionNotes ? (
          <p className="mt-2 rounded-2xl bg-[var(--card)] p-3 text-sm text-[var(--foreground)]">
            Reviewer note: <span className="font-semibold">{request.decisionNotes}</span>
          </p>
        ) : null}
      </div>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm shadow-[#e7ddea]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
          Audit trail
        </p>
        <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Verification steps</h4>
        {auditTrail.length ? (
          <ul className="mt-4 space-y-3">
            {auditTrail.map((entry, index) => (
              <li
                key={`${entry.action}-${entry.at ?? index}`}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <p className="text-sm font-semibold text-[var(--foreground)] capitalize">{entry.action}</p>
                <p className="text-xs text-[var(--medium-gray)]">
                  {formatDateTime(entry.at)} · {entry.by?.displayName ?? entry.by?.email ?? "System"}
                </p>
                {entry.notes ? <p className="mt-1 text-xs text-[var(--foreground)]">{entry.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--foreground)]">
            Once compliance reviews your submission, their actions will show up here with timestamps.
          </p>
        )}
      </div>
    </div>
  );
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
  const metaMap: Record<string, { label: string; bg: string; color: string; border: string; helper: string }> = {
    approved: {
      label: "Verified",
      bg: "color-mix(in srgb, var(--success) 14%, transparent)",
      color: "var(--success)",
      border: "color-mix(in srgb, var(--success) 35%, transparent)",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    active: {
      label: "Verified",
      bg: "color-mix(in srgb, var(--success) 14%, transparent)",
      color: "var(--success)",
      border: "color-mix(in srgb, var(--success) 35%, transparent)",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    verified: {
      label: "Verified",
      bg: "color-mix(in srgb, var(--success) 14%, transparent)",
      color: "var(--success)",
      border: "color-mix(in srgb, var(--success) 35%, transparent)",
      helper: "Your company is verified. Keep documents updated to maintain the badge.",
    },
    pending: {
      label: "Under review",
      bg: "color-mix(in srgb, var(--warning) 14%, transparent)",
      color: "var(--warning)",
      border: "color-mix(in srgb, var(--warning) 35%, transparent)",
      helper: "Our compliance team is reviewing the latest submission. Expect updates soon.",
    },
    rejected: {
      label: "Needs attention",
      bg: "var(--danger-bg)",
      color: "var(--danger-strong)",
      border: "color-mix(in srgb, var(--danger) 40%, transparent)",
      helper: "We couldn't approve the last submission. Review the notes and try again.",
    },
  };

  return (
    metaMap[normalized] ?? {
      label: "Not submitted",
      bg: "var(--primary-light)",
      color: "var(--primary-dark)",
      border: "color-mix(in srgb, var(--primary) 30%, transparent)",
      helper: "Earn trust by submitting GST + Aadhaar documents once you're ready.",
    }
  );
};
