"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { companyVerificationService } from "../../services/companyVerification";
import { CompanyVerificationRequest } from "../../types/company";
import { ApiError } from "../../lib/api-error";

type FilterValue = "all" | "pending" | "approved" | "rejected";
type ActionType = "approve" | "reject";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const STATUS_STYLES: Record<
  "pending" | "approved" | "rejected",
  { background: string; color: string; label: string }
> = {
  pending: { label: "Pending", background: "rgba(234,179,8,0.18)", color: "#854d0e" },
  approved: { label: "Approved", background: "rgba(16,185,129,0.15)", color: "#065f46" },
  rejected: { label: "Rejected", background: "rgba(248,113,113,0.15)", color: "#b91c1c" },
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export const VerificationRequestsPanel = () => {
  const { user, initializing } = useAuth();
  const [statusFilter, setStatusFilter] = useState<FilterValue>("pending");
  const [requests, setRequests] = useState<CompanyVerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{ request: CompanyVerificationRequest; action: ActionType } | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const canModerate = user?.role === "admin";

  const loadRequests = useCallback(async () => {
    if (!canModerate) return;
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter === "all" ? undefined : { status: statusFilter };
      const response = await companyVerificationService.list(params);
      setRequests(response.requests);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to fetch requests";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [canModerate, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const startAction = (request: CompanyVerificationRequest, action: ActionType) => {
    setActiveAction({ request, action });
    setReviewNotes("");
    setRejectionReason("");
    setActionError(null);
  };

  const closeAction = () => {
    setActiveAction(null);
    setReviewNotes("");
    setRejectionReason("");
    setSubmitting(false);
    setActionError(null);
  };

  const submitDecision = async () => {
    if (!activeAction) return;
    if (activeAction.action === "reject" && !rejectionReason.trim()) {
      setActionError("Add a brief rejection reason so the user knows what to fix.");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      await companyVerificationService.decide(activeAction.request.id, {
        action: activeAction.action,
        notes: reviewNotes.trim() || undefined,
        rejectionReason: activeAction.action === "reject" ? rejectionReason.trim() : undefined,
      });
      closeAction();
      loadRequests();
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Unable to process request";
      setActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const emptyStateMessage = useMemo(() => {
    if (initializing) return "Checking your session…";
    if (!canModerate) return "Sign in with an admin account to moderate verification requests.";
    if (loading) return "Loading verification queue…";
    if (error) return error;
    if (!requests.length) {
      return statusFilter === "all"
        ? "No verification requests available."
        : `No ${statusFilter} verifications right now.`;
    }
    return null;
  }, [canModerate, error, initializing, loading, requests.length, statusFilter]);

  return (
    <section
      className="rounded-3xl border p-6 shadow-lg shadow-black/10"
      style={{
        borderColor: "rgba(250,218,208,0.25)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(244,235,231,0.9))",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Compliance review
          </p>
          <h2 className="text-2xl font-semibold text-[#2e1f2c]">Company verification queue</h2>
          <p className="text-sm text-[#6c4f5b]">
            Approve or reject GST + Aadhaar submissions from manufacturers.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="rounded-full px-5 py-2 text-sm font-semibold shadow"
          style={{
            backgroundColor: "var(--color-plum)",
            color: "#fff",
          }}
          disabled={!canModerate}
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className="rounded-full px-4 py-2 text-sm font-semibold transition"
              style={{
                backgroundColor: isActive ? "var(--color-peach)" : "rgba(255,255,255,0.7)",
                color: isActive ? "var(--color-plum)" : "rgba(46,31,44,0.7)",
                boxShadow: isActive ? "0 10px 25px rgba(246,184,168,0.45)" : undefined,
              }}
              disabled={!canModerate}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {emptyStateMessage ? (
        <p className="mt-8 text-center text-sm font-semibold text-[#6c4f5b]">{emptyStateMessage}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border p-5 transition hover:shadow-lg"
              style={{ borderColor: "rgba(90,48,66,0.2)", backgroundColor: "rgba(255,255,255,0.85)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#2e1f2c]">
                    {request.company?.displayName ?? "Company"}
                  </h3>
                  <p className="text-sm text-[#6c4f5b]">
                    Compliance: {request.company?.complianceStatus ?? "pending"} · Requested by{" "}
                    {request.requestedBy?.displayName ?? request.requestedBy?.email ?? "user"}
                  </p>
                </div>
                {request.status ? (
                  <span
                    className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: STATUS_STYLES[request.status].background,
                      color: STATUS_STYLES[request.status].color,
                    }}
                  >
                    {STATUS_STYLES[request.status].label}
                  </span>
                ) : null}
              </div>

              <dl className="mt-4 grid gap-3 text-sm text-[#453440] md:grid-cols-2">
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-xs text-[#9e7d8b]">Submitted</dt>
                  <dd className="mt-1">{formatDateTime(request.createdAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-xs text-[#9e7d8b]">Notes</dt>
                  <dd className="mt-1">{request.notes || "—"}</dd>
                </div>
                {request.rejectionReason ? (
                  <div className="md:col-span-2">
                    <dt className="font-semibold uppercase tracking-wide text-xs text-[#9e7d8b]">Rejection reason</dt>
                    <dd className="mt-1 text-[#b91c1c]">{request.rejectionReason}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(90,48,66,0.2)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9e7d8b]">Documents</p>
                <ul className="mt-2 space-y-1 text-[#453440]">
                  {[
                    { label: "GST certificate", doc: request.documents?.gstCertificate },
                    { label: "Aadhaar card", doc: request.documents?.aadhaarCard },
                  ].map(({ label, doc }) => (
                    <li key={label} className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-2">
                      <span className="font-semibold capitalize">{label}:</span>
                      {doc?.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold"
                          style={{ color: "var(--color-plum)" }}
                        >
                          Open file
                        </a>
                      ) : (
                        <span className="text-sm text-[#6c4f5b]">
                          Uploaded {doc?.uploadedAt ? formatDateTime(doc.uploadedAt) : "recently"} (secure S3)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {request.status === "pending" ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startAction(request, "approve")}
                    className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--color-plum)" }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => startAction(request, "reject")}
                    className="flex-1 rounded-full px-4 py-2 text-sm font-semibold"
                    style={{ backgroundColor: "rgba(185,28,28,0.1)", color: "#b91c1c" }}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {activeAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div
            className="w-full max-w-lg rounded-3xl p-6 text-[#2e1f2c]"
            style={{ backgroundColor: "white", border: "1px solid rgba(90,48,66,0.2)" }}
          >
            <h3 className="text-xl font-semibold">
              {activeAction.action === "approve" ? "Approve request" : "Reject request"}
            </h3>
            <p className="mt-1 text-sm text-[#6c4f5b]">
              {activeAction.request.company?.displayName ?? "Company"} · Submitted{" "}
              {formatDateTime(activeAction.request.createdAt)}
            </p>
            <label className="mt-4 block text-sm font-semibold text-[#6c4f5b]">
              Reviewer notes (optional)
              <textarea
                className="mt-2 w-full rounded-2xl border px-3 py-2"
                style={{ borderColor: "rgba(90,48,66,0.3)" }}
                rows={3}
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
              />
            </label>
            {activeAction.action === "reject" ? (
              <label className="mt-4 block text-sm font-semibold text-[#6c4f5b]">
                Rejection reason
                <textarea
                  className="mt-2 w-full rounded-2xl border px-3 py-2"
                  style={{ borderColor: "rgba(185,28,28,0.4)" }}
                  rows={3}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  required
                />
              </label>
            ) : null}
            {actionError ? <p className="mt-3 text-sm font-semibold text-[#b91c1c]">{actionError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAction}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "#4c1d95" }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDecision}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: activeAction.action === "approve" ? "#16a34a" : "#b91c1c" }}
                disabled={submitting}
              >
                {submitting ? "Processing…" : activeAction.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
