"use client";

import { motion } from "framer-motion";
import type { Quote, QuoteMode, QuoteStatus } from "@/src/services/quotes";

const STATUS_STYLE: Record<QuoteStatus, { bg: string; text: string }> = {
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  quoted:    { bg: "#DBEAFE", text: "#1E40AF" },
  accepted:  { bg: "#DCFCE7", text: "#15803D" },
  rejected:  { bg: "#FEE2E2", text: "#991B1B" },
  cancelled: { bg: "#F3F4F6", text: "#4B5563" },
  expired:   { bg: "#F3F4F6", text: "#4B5563" },
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmtCurrency = (v?: number, cur = "INR") =>
  v !== undefined
    ? v.toLocaleString("en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 })
    : null;

type Props = {
  quote: Quote;
  tab: QuoteMode;
  delay?: number;
  onRespond?: (q: Quote) => void;
  onAccept?: (q: Quote) => void;
  onReject?: (q: Quote) => void;
  onCancel?: (q: Quote) => void;
  actionLoading?: boolean;
};

export const QuoteCard = ({ quote, tab, delay = 0, onRespond, onAccept, onReject, onCancel, actionLoading }: Props) => {
  const ss = STATUS_STYLE[quote.status] ?? STATUS_STYLE.cancelled;
  const counterpart = tab === "incoming" ? quote.buyer : quote.seller;
  const img = quote.product.images?.[0]?.url;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
      <div className="p-4 space-y-3">
        {/* Product row */}
        <div className="flex items-start gap-3">
          {img ? (
            <img src={img} alt={quote.product.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 text-xl"
              style={{ backgroundColor: "var(--background)" }}>📦</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>{quote.product.name}</p>
              <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
                style={{ backgroundColor: ss.bg, color: ss.text }}>{quote.status}</span>
            </div>
            <p className="text-xs capitalize" style={{ color: "var(--medium-gray)" }}>
              {quote.product.category?.replace(/-/g, " ")}
            </p>
          </div>
        </div>

        {/* Request details */}
        <div className="grid grid-cols-2 gap-2 rounded-xl p-3"
          style={{ backgroundColor: "var(--background)" }}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Qty</p>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{quote.request.quantity}</p>
          </div>
          {quote.request.targetPrice && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Target</p>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                {fmtCurrency(quote.request.targetPrice, quote.request.currency)}
              </p>
            </div>
          )}
          {quote.response?.unitPrice && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Quoted</p>
              <p className="text-sm font-bold" style={{ color: "#15803D" }}>
                {fmtCurrency(quote.response.unitPrice, quote.response.currency)}
              </p>
            </div>
          )}
          {quote.response?.leadTimeDays && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Lead time</p>
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{quote.response.leadTimeDays}d</p>
            </div>
          )}
        </div>

        {/* Requirements */}
        {quote.request.requirements && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--medium-gray)" }}>
            "{quote.request.requirements}"
          </p>
        )}

        {/* Response notes */}
        {quote.response?.notes && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--medium-gray)" }}>
            Seller note: "{quote.response.notes}"
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--medium-gray)" }}>
          <span>
            {tab === "incoming" ? "From buyer: " : "Seller: "}
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              {counterpart?.displayName || "—"}
            </span>
          </span>
          <span>{fmt(quote.createdAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {tab === "incoming" && quote.status === "pending" && onRespond && (
            <button onClick={() => onRespond(quote)} disabled={actionLoading}
              className="rounded-xl px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
              Respond
            </button>
          )}
          {tab === "incoming" && quote.status === "pending" && onReject && (
            <button onClick={() => onReject(quote)} disabled={actionLoading}
              className="rounded-xl px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ border: "1px solid #FCA5A5", color: "#991B1B", backgroundColor: "#FEE2E2" }}>
              Reject
            </button>
          )}
          {(tab === "asked" || tab === "received") && quote.status === "quoted" && onAccept && (
            <button onClick={() => onAccept(quote)} disabled={actionLoading}
              className="rounded-xl px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ backgroundColor: "#16A34A", color: "#fff" }}>
              Accept
            </button>
          )}
          {(tab === "asked" || tab === "received") && quote.status === "quoted" && onReject && (
            <button onClick={() => onReject(quote)} disabled={actionLoading}
              className="rounded-xl px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ border: "1px solid #FCA5A5", color: "#991B1B", backgroundColor: "#FEE2E2" }}>
              Reject
            </button>
          )}
          {["pending", "quoted"].includes(quote.status) && onCancel && (
            <button onClick={() => onCancel(quote)} disabled={actionLoading}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--medium-gray)", backgroundColor: "var(--background)" }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
