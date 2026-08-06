"use client";

import { useState } from "react";
import Image from "next/image";
import { Sheet } from "@/src/components/ui/Sheet";
import { useToast } from "@/src/components/ui/Toast";
import { productInquiryService, type InquiryStatus, type ProductInquiry } from "@/src/services/productInquiry";
import { ApiError } from "@/src/lib/api-error";
import { formatDate, relativeAge, statusBg, statusTone, STATUS_LABELS } from "./inquiryMeta";

const STATUSES: InquiryStatus[] = ["pending", "seen", "responded", "closed"];

export const InquiryDetailSheet = ({
  inquiry, onClose, onSaved,
}: {
  inquiry: ProductInquiry | null;
  onClose: () => void;
  onSaved: (updated: ProductInquiry) => void;
}) => {
  const toast = useToast();
  const [status, setStatus] = useState<InquiryStatus>(inquiry?.status ?? "pending");
  const [notes, setNotes] = useState(inquiry?.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(Boolean(inquiry));

  // Re-seed local edit state whenever a different inquiry is opened — adjusted
  // during render (not in an effect) per React's guidance for resetting state
  // on a prop change.
  const open = Boolean(inquiry);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (inquiry) { setStatus(inquiry.status); setNotes(inquiry.adminNotes ?? ""); }
  }

  const productName = inquiry?.productSnapshot?.name || inquiry?.product?.name || "Product";
  const buyerName = inquiry?.buyerSnapshot?.name || inquiry?.buyer?.displayName || "Guest";
  const buyerPhone = inquiry?.buyerSnapshot?.phone || inquiry?.buyer?.phone;
  const buyerEmail = inquiry?.buyerSnapshot?.email || inquiry?.buyer?.email;
  const productImage = inquiry?.product?.images?.[0]?.url;
  const currency = inquiry?.product?.price?.currency || inquiry?.productSnapshot?.currency || "INR";
  const amount = inquiry?.product?.price?.amount ?? inquiry?.productSnapshot?.amount;

  const save = async () => {
    if (!inquiry) return;
    setSaving(true);
    try {
      const updated = await productInquiryService.adminUpdateStatus(inquiry._id, {
        status,
        adminNotes: notes.trim() || undefined,
      });
      toast.success("Inquiry updated");
      onSaved(updated);
    } catch (err) {
      toast.error("Update failed", err instanceof ApiError || err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const copyId = () => {
    if (!inquiry) return;
    navigator.clipboard?.writeText(inquiry._id).then(() => toast.info("Copied", "Inquiry ID copied to clipboard"));
  };

  return (
    <Sheet open={open} onClose={onClose} width={480}
      footer={
        <div className="flex gap-3 p-4">
          <button type="button" onClick={onClose} disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      }>
      {inquiry && (
        <div className="space-y-5">
          {/* Product */}
          <div className="flex items-start gap-3">
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
              {productImage ? (
                <Image src={productImage} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <span className="text-xl">📦</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{productName}</p>
              {inquiry.variant?.title && <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{inquiry.variant.title}</p>}
              {typeof amount === "number" && (
                <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                  {currency === "INR" ? "₹" : `${currency} `}{amount.toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: statusBg(inquiry.status), color: statusTone(inquiry.status) }}>
              {STATUS_LABELS[inquiry.status]}
            </span>
          </div>

          {/* Buyer */}
          <div className="rounded-xl p-3.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>Buyer</p>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{buyerName}</p>
            <div className="mt-1.5 space-y-1">
              {buyerPhone && (
                <a href={`tel:${buyerPhone}`} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: "var(--primary)" }}>
                  📞 {buyerPhone}
                </a>
              )}
              {buyerEmail && (
                <a href={`mailto:${buyerEmail}`} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: "var(--primary)" }}>
                  ✉️ {buyerEmail}
                </a>
              )}
            </div>
          </div>

          {/* Request details */}
          <div className="rounded-xl p-3.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>Request details</p>
            <div className="space-y-1.5 text-sm" style={{ color: "var(--foreground)" }}>
              {inquiry.quantity != null && <p>📦 Quantity: {inquiry.quantity}</p>}
              {inquiry.location && <p>📍 {inquiry.location}</p>}
              {inquiry.message ? (
                <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
                  &quot;{inquiry.message}&quot;
                </p>
              ) : (
                !inquiry.quantity && !inquiry.location && (
                  <p className="text-xs" style={{ color: "var(--medium-gray)" }}>No additional details provided.</p>
                )
              )}
            </div>
          </div>

          {/* Status picker */}
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>Update status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => {
                const active = status === s;
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className="rounded-xl py-2.5 text-center text-xs font-bold transition-all"
                    style={{
                      backgroundColor: active ? statusBg(s) : "var(--surface)",
                      color: active ? statusTone(s) : "var(--foreground)",
                      border: active ? `1.5px solid ${statusTone(s)}` : "1px solid var(--border)",
                    }}>
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>Notes (optional)</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Internal notes or response details…"
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>

          <div className="space-y-0.5 text-[11px]" style={{ color: "var(--medium-gray)" }}>
            <p>{relativeAge(inquiry.createdAt)} · filed {formatDate(inquiry.createdAt)}</p>
            {inquiry.updatedAt !== inquiry.createdAt && <p>Updated {formatDate(inquiry.updatedAt)}</p>}
            <button type="button" onClick={copyId} className="underline decoration-dotted underline-offset-2 hover:opacity-70">Copy ID</button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
