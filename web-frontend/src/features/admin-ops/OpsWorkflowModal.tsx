"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService, type AdminOpsRequest } from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";
import { useAuth } from "@/src/hooks/useAuth";
import { useToast } from "@/src/components/ui/Toast";

const REASON_MAX = 300;
const REASON_MIN = 3;

export type OpsWorkflowTarget = {
  id: string;
  company?: { id: string } | null;
  updatedAt: string;
};

export type OpsWorkflowChange = {
  title: string;
  subtitle?: string;
  destructive?: boolean;
  payload: {
    status?: string;
    priority?: string;
    assignedTo?: string | null;
    slaDueAt?: string | null;
  };
};

/**
 * Single reason-required mutation dialog for every ops workflow change —
 * status transition, priority change, assignment, SLA due date. The backend
 * validator requires `reason` (3-300 chars) on every workflow PATCH
 * (admin.validators.js updateServiceRequestWorkflowValidation /
 * updateBusinessSetupWorkflowValidation), so this is never optional here —
 * the old AdminOpsPanel silently substituted "Updated by admin" instead of
 * surfacing that requirement to the admin.
 */
export const OpsWorkflowModal = ({
  target, kind, change, onClose, onSuccess,
}: {
  target: OpsWorkflowTarget | null;
  kind: AdminOpsRequest["kind"];
  change: OpsWorkflowChange | null;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(target && change);

  const close = () => {
    if (saving) return;
    setReason("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!target || !change) return;
    const trimmed = reason.trim();
    if (trimmed.length < REASON_MIN) {
      setError(`Add a reason (at least ${REASON_MIN} characters) — it's recorded in the audit trail.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Non-super-admins must echo the request's company as contextCompanyId
      // (ensureAdminContextScope on the backend). When the request has no
      // company (a service request filed by a non-company user), fall back
      // to the admin's own active company — the backend's "must match
      // target" check only fires when a target company is set, so this is
      // safe. Super-admins never need it, but sending it is harmless.
      const contextCompanyId = target.company?.id
        || (typeof user?.activeCompany === "string" ? user.activeCompany : undefined);
      const payload = {
        ...change.payload,
        reason: trimmed,
        contextCompanyId,
        expectedUpdatedAt: target.updatedAt,
      };
      if (kind === "service") {
        await adminService.updateServiceRequestWorkflow(target.id, payload);
      } else {
        await adminService.updateBusinessSetupRequestWorkflow(target.id, payload);
      }
      toast.success("Request updated");
      setReason("");
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("This request changed since you loaded it — refresh and retry.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError(err.message || "That change isn't allowed from the current state.");
      } else {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && change && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close} />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[61] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>{change.title}</p>
            {change.subtitle && (
              <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>{change.subtitle}</p>
            )}

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                  Reason<span className="ml-0.5" style={{ color: "var(--danger-strong)" }}>*</span>
                </label>
                <span className="text-[11px] font-medium" style={{ color: "var(--medium-gray)" }}>
                  {reason.trim().length}/{REASON_MAX}
                </span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => { setReason(e.target.value.slice(0, REASON_MAX)); if (error) setError(null); }}
                rows={3}
                placeholder="Why is this changing? Recorded in the audit trail…"
                autoFocus
                className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
              <p className="mt-1 text-[11px]" style={{ color: "var(--medium-gray)" }}>Required for the audit history.</p>
            </div>

            {error && (
              <p className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger-strong)" }}>
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button type="button" onClick={close} disabled={saving}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                Cancel
              </button>
              <button type="button" onClick={submit} disabled={saving}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: change.destructive ? "var(--danger-strong)" : "var(--primary)" }}>
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
