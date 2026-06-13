"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productInquiryService, ProductInquiry, InquiryStatus } from "@/src/services/productInquiry";
import { ApiError } from "@/src/lib/api-error";

const PAGE_SIZE = 25;

const relativeDate = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "today";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const STATUS_STYLE: Record<InquiryStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#92400E", bg: "#FEF3C7" },
  seen:      { label: "Seen",      color: "#1E40AF", bg: "#DBEAFE" },
  responded: { label: "Responded", color: "#166534", bg: "#DCFCE7" },
  closed:    { label: "Closed",    color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_CHIPS: { key: InquiryStatus | "all"; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "seen",      label: "Seen" },
  { key: "responded", label: "Responded" },
  { key: "closed",    label: "Closed" },
];

const NEXT_STATUS: Record<InquiryStatus, InquiryStatus | null> = {
  pending:   "seen",
  seen:      "responded",
  responded: "closed",
  closed:    null,
};

export const AdminInquiriesPanel = () => {
  const [inquiries, setInquiries] = useState<ProductInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">("all");
  const [actionTarget, setActionTarget] = useState<ProductInquiry | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionStatus, setActionStatus] = useState<InquiryStatus>("seen");
  const [actionSaving, setActionSaving] = useState(false);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await productInquiryService.adminList({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset,
      });
      setInquiries((prev) => append ? [...prev, ...(res.inquiries ?? [])] : (res.inquiries ?? []));
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load inquiries");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(0); }, [load]);

  const openAction = (inq: ProductInquiry, nextStatus: InquiryStatus) => {
    setActionTarget(inq);
    setActionStatus(nextStatus);
    setActionNote(inq.adminNotes ?? "");
  };

  const submitAction = async () => {
    if (!actionTarget) return;
    setActionSaving(true);
    try {
      await productInquiryService.adminUpdateStatus(actionTarget._id, {
        status: actionStatus,
        adminNotes: actionNote.trim() || undefined,
      });
      setActionTarget(null);
      load(0);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionSaving(false);
    }
  };

  const buyerName = (inq: ProductInquiry) =>
    inq.buyer?.displayName ?? inq.buyerSnapshot?.name ?? inq.buyerSnapshot?.email ?? "Guest";

  const productName = (inq: ProductInquiry) =>
    inq.product?.name ?? inq.productSnapshot?.name ?? "Unknown product";

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Product Inquiries</h1>
          {!loading && <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>{pagination.total.toLocaleString("en-IN")} total</p>}
        </div>
      </motion.div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_CHIPS.map((chip) => (
          <button key={chip.key} onClick={() => setStatusFilter(chip.key)}
            className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
            style={{
              backgroundColor: statusFilter === chip.key ? "var(--primary)" : "var(--surface)",
              color: statusFilter === chip.key ? "#fff" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}>
            {chip.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !inquiries.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center"
          style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">📩</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No inquiries found</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
            {statusFilter !== "all" ? `No ${statusFilter} inquiries.` : "Product inquiries will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq, i) => {
            const sStyle = STATUS_STYLE[inq.status];
            const nextStatus = NEXT_STATUS[inq.status];
            const price = inq.product?.price ?? (inq.productSnapshot?.amount ? { amount: inq.productSnapshot.amount, currency: inq.productSnapshot.currency ?? "INR" } : null);
            return (
              <motion.div key={inq._id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="rounded-xl px-4 py-3.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{productName(inq)}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: sStyle.bg, color: sStyle.color }}>
                        {sStyle.label}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>
                      From {buyerName(inq)}
                      {inq.buyer?.email && ` (${inq.buyer.email})`}
                      {inq.quantity && ` · Qty: ${inq.quantity}`}
                      {price && ` · ₹${price.amount.toLocaleString("en-IN")}`}
                      {" · "}{relativeDate(inq.createdAt)}
                    </p>
                    {inq.message && (
                      <p className="mt-1.5 text-xs line-clamp-2 rounded-lg px-3 py-1.5"
                        style={{ backgroundColor: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                        "{inq.message}"
                      </p>
                    )}
                    {inq.adminNotes && (
                      <p className="mt-1 text-xs italic" style={{ color: "var(--medium-gray)" }}>
                        Note: {inq.adminNotes}
                      </p>
                    )}
                  </div>
                  {nextStatus && (
                    <button onClick={() => openAction(inq, nextStatus)}
                      className="rounded-lg px-3 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70 flex-shrink-0"
                      style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(20,141,178,0.2)" }}>
                      Mark {STATUS_STYLE[nextStatus].label}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {pagination.hasMore && (
        <div className="flex justify-center">
          <button onClick={() => load(pagination.offset + PAGE_SIZE, true)} disabled={loadingMore}
            className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {/* Status update modal */}
      <AnimatePresence>
        {actionTarget && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActionTarget(null)} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                Mark as {STATUS_STYLE[actionStatus].label}
              </p>
              <p className="mt-0.5 text-sm truncate" style={{ color: "var(--medium-gray)" }}>
                {productName(actionTarget)} · {buyerName(actionTarget)}
              </p>
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                  Admin note (optional)
                </label>
                <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} rows={2}
                  placeholder="Internal note for this inquiry…"
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setActionTarget(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  Cancel
                </button>
                <button onClick={submitAction} disabled={actionSaving}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary)" }}>
                  {actionSaving ? "Saving…" : "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
