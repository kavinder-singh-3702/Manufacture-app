"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { quoteService, Quote, QuoteMode, QuoteStatus, RespondQuotePayload } from "@/src/services/quotes";
import { ApiError } from "@/src/lib/api-error";
import { QuoteCard } from "./QuoteCard";
import { QuoteRespondModal } from "./QuoteRespondModal";

const PAGE_SIZE = 12;

type StatusChip = "all" | QuoteStatus;

const TABS: { key: QuoteMode; label: string }[] = [
  { key: "asked", label: "Asked" },
  { key: "received", label: "Received" },
];

const STATUS_CHIPS: StatusChip[] = ["all", "pending", "quoted", "accepted", "rejected", "cancelled", "expired"];
const RECEIVED_STATUS_CHIPS: StatusChip[] = ["all", "quoted", "accepted", "rejected", "expired"];

const chipLabel = (s: StatusChip) => s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1);

export const QuotesContainer = () => {
  const [tab, setTab] = useState<QuoteMode>("asked");
  const [status, setStatus] = useState<StatusChip>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [respondQuote, setRespondQuote] = useState<Quote | null>(null);
  const [respondSaving, setRespondSaving] = useState(false);
  const [hasIncoming, setHasIncoming] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetch = useCallback(async (off = 0, append = false) => {
    try {
      setError(null);
      if (append) setLoadingMore(true); else setLoading(true);
      const res = await quoteService.list({
        mode: tab,
        status: status === "all" ? undefined : status,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset: off,
      });
      const incoming = res.quotes ?? [];
      setQuotes((prev) => append ? [...prev, ...incoming] : incoming);
      setTotal(res.pagination?.total ?? 0);
      setHasMore(res.pagination?.hasMore ?? false);
      setOffset(off);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load quotes");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, status, search]);

  const checkIncoming = useCallback(async () => {
    try {
      const res = await quoteService.list({ mode: "incoming", limit: 1, offset: 0 });
      setHasIncoming((res.pagination?.total ?? 0) > 0);
    } catch { setHasIncoming(false); }
  }, []);

  useEffect(() => { fetch(0, false); checkIncoming(); }, [fetch, checkIncoming]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  useEffect(() => { if (tab !== "incoming") setStatus("all"); }, [tab]);
  useEffect(() => { if (tab === "incoming" && !hasIncoming) setTab("asked"); }, [tab, hasIncoming]);

  const loadMore = () => { if (!hasMore || loading || loadingMore) return; fetch(offset + PAGE_SIZE, true); };

  const updateStatus = async (quote: Quote, newStatus: "accepted" | "rejected" | "cancelled" | "expired") => {
    try {
      setActionLoadingId(quote._id);
      await quoteService.updateStatus(quote._id, { status: newStatus });
      await Promise.all([fetch(0, false), checkIncoming()]);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitResponse = async (payload: RespondQuotePayload) => {
    if (!respondQuote) return;
    try {
      setRespondSaving(true);
      await quoteService.respond(respondQuote._id, payload);
      setRespondQuote(null);
      await Promise.all([fetch(0, false), checkIncoming()]);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Response failed");
    } finally {
      setRespondSaving(false);
    }
  };

  const tabs = hasIncoming ? [...TABS, { key: "incoming" as QuoteMode, label: "Incoming" }] : TABS;
  const chips = tab === "received" ? RECEIVED_STATUS_CHIPS : STATUS_CHIPS;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Quotes & RFQ</p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Quote Center</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>
          {total} quote{total !== 1 ? "s" : ""} in {tab}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 rounded-lg py-2 text-xs font-bold transition-all"
            style={{
              backgroundColor: tab === t.key ? "var(--primary)" : "transparent",
              color: tab === t.key ? "#fff" : "var(--medium-gray)",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + status chips */}
      <div className="space-y-2">
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by product or requirement…"
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button key={c} onClick={() => setStatus(c)}
              className="rounded-full px-3 py-1 text-xs font-bold transition-all"
              style={{
                backgroundColor: status === c ? "var(--primary)" : "var(--surface)",
                color: status === c ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {chipLabel(c)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          <span>{error}</span>
          <button onClick={() => { setError(null); fetch(0, false); }} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--surface)" }} />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-4xl">📋</div>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No quotes found</p>
          <p className="text-sm text-center max-w-xs" style={{ color: "var(--medium-gray)" }}>
            Your {tab} list is empty
            {status !== "all" ? ` for status "${status}"` : ""}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quotes.map((q, i) => (
              <div key={q._id} style={{ opacity: actionLoadingId === q._id ? 0.6 : 1 }}>
                <QuoteCard
                  quote={q}
                  tab={tab}
                  delay={i * 0.04}
                  onRespond={tab === "incoming" ? (q) => setRespondQuote(q) : undefined}
                  onAccept={(tab === "asked" || tab === "received") ? (q) => updateStatus(q, "accepted") : undefined}
                  onReject={(q) => updateStatus(q, "rejected")}
                  onCancel={tab !== "incoming" ? (q) => updateStatus(q, "cancelled") : undefined}
                  actionLoading={actionLoadingId === q._id}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button onClick={loadMore} disabled={loadingMore}
                className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Respond modal */}
      <QuoteRespondModal
        quote={respondQuote}
        saving={respondSaving}
        onClose={() => setRespondQuote(null)}
        onSubmit={submitResponse}
      />
    </div>
  );
};
