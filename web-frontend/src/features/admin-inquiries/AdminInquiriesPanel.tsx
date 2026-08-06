"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { productInquiryService, type InquiryStatus, type InquiryStatusCounts, type ProductInquiry } from "@/src/services/productInquiry";
import { ApiError } from "@/src/lib/api-error";
import { PageHeader } from "@/src/components/ui/Surface";
import { useToast } from "@/src/components/ui/Toast";
import { relativeAge, statusBg, statusTone, STATUS_LABELS } from "./inquiryMeta";
import { InquiryDetailSheet } from "./InquiryDetailSheet";

const PAGE_SIZE = 25;

const STATUS_TILES: { key: InquiryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "seen", label: "Seen" },
  { key: "responded", label: "Responded" },
  { key: "closed", label: "Closed" },
];

const buyerName = (inq: ProductInquiry) => inq.buyer?.displayName ?? inq.buyerSnapshot?.name ?? inq.buyerSnapshot?.email ?? "Guest";
const productName = (inq: ProductInquiry) => inq.product?.name ?? inq.productSnapshot?.name ?? "Unknown product";

export const AdminInquiriesPanel = () => {
  const toast = useToast();
  const [inquiries, setInquiries] = useState<ProductInquiry[]>([]);
  const [counts, setCounts] = useState<InquiryStatusCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<ProductInquiry | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await productInquiryService.adminList({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setInquiries((prev) => (append ? [...prev, ...(res.inquiries ?? [])] : (res.inquiries ?? [])));
      setCounts(res.counts ?? null);
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load inquiries");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(0); }, [load]);
  useEffect(() => { setSelected(new Set()); }, [statusFilter, search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !pagination.hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) load(pagination.offset + PAGE_SIZE, true);
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [pagination.hasMore, pagination.offset, loading, loadingMore, load]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSaved = (updated: ProductInquiry) => {
    setInquiries((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    setActiveInquiry(null);
    load(0);
  };

  const bulkUpdate = async (status: InquiryStatus) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkSaving(true);
    let ok = 0, failed = 0;
    for (const id of ids) {
      try {
        await productInquiryService.adminUpdateStatus(id, { status });
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    setBulkSaving(false);
    setSelected(new Set());
    if (ok) toast.success(`Marked ${ok} as ${STATUS_LABELS[status].toLowerCase()}`, failed ? `${failed} failed to update` : undefined);
    else toast.error("Bulk update failed", "None of the selected inquiries could be updated");
    load(0);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <>
            Product Inquiries
            {!loading && counts && (
              <span className="ml-2.5 rounded-full px-2.5 py-0.5 text-sm font-semibold align-middle"
                style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                {counts.all.toLocaleString("en-IN")}
              </span>
            )}
          </>
        }
      />

      {/* Search */}
      <div className="relative">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
          <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by product, buyer name, email or phone…"
          className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
      </div>

      {/* Status tiles — double as filters */}
      <div className="grid grid-cols-5 gap-1.5">
        {STATUS_TILES.map((tile) => {
          const active = statusFilter === tile.key;
          const value = counts ? counts[tile.key] : 0;
          const tone = tile.key === "all" ? "var(--primary)" : statusTone(tile.key);
          return (
            <button key={tile.key} type="button" onClick={() => setStatusFilter(tile.key)}
              className="rounded-xl px-1.5 py-2.5 text-center transition-all"
              style={{
                border: active ? `1px solid ${tone}` : "1px solid var(--border)",
                backgroundColor: active ? `color-mix(in srgb, ${tone} 12%, transparent)` : "var(--card)",
              }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: active ? tone : "var(--medium-gray)" }}>{tile.label}</p>
              <p className="mt-0.5 text-base font-bold tabular-nums" style={{ color: active ? tone : "var(--foreground)" }}>
                {counts ? value.toLocaleString("en-IN") : "—"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Bulk action bar (desktop-only selection UI) */}
      {selected.size > 0 && (
        <div className="hidden items-center gap-2 rounded-xl px-4 py-2.5 sm:flex" style={{ backgroundColor: "var(--primary-light)", border: "1px solid rgba(20,141,178,0.2)" }}>
          <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{selected.size} selected</span>
          <div className="ml-auto flex gap-1.5">
            {(["seen", "responded", "closed"] as InquiryStatus[]).map((s) => (
              <button key={s} type="button" disabled={bulkSaving} onClick={() => bulkUpdate(s)}
                className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: statusTone(s) }}>
                Mark {STATUS_LABELS[s]}
              </button>
            ))}
            <button type="button" onClick={() => setSelected(new Set())}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger-strong)", color: "var(--danger-strong)" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !inquiries.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">📩</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No inquiries found</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
            {statusFilter !== "all" ? `No ${statusFilter} inquiries.` : "Product inquiries will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq, i) => {
            const img = inq.product?.images?.[0]?.url;
            const isSelected = selected.has(inq._id);
            return (
              <motion.button key={inq._id} type="button" onClick={() => setActiveInquiry(inq)}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex w-full items-start gap-3 rounded-xl px-3.5 py-3 text-left transition-colors hover:bg-[var(--background)]"
                style={{ border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <button type="button" onClick={(e) => toggleSelect(inq._id, e)}
                  className="mt-1 hidden h-4 w-4 flex-shrink-0 items-center justify-center rounded sm:flex"
                  style={{ border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`, backgroundColor: isSelected ? "var(--primary)" : "transparent" }}
                  aria-label={isSelected ? "Deselect" : "Select"}>
                  {isSelected && <span className="text-[10px] font-bold text-white">✓</span>}
                </button>

                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
                  {img ? <Image src={img} alt="" fill sizes="44px" className="object-cover" /> : (
                    <span className="flex h-full w-full items-center justify-center text-lg">📦</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{productName(inq)}</p>
                    {inq.variant?.title && <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{inq.variant.title}</span>}
                    <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: statusBg(inq.status), color: statusTone(inq.status) }}>
                      {STATUS_LABELS[inq.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--medium-gray)" }}>
                    {buyerName(inq)}{inq.buyer?.email && ` · ${inq.buyer.email}`}
                  </p>
                  <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px]" style={{ color: "var(--medium-gray)" }}>
                    {inq.quantity ? <span>Qty: {inq.quantity}</span> : null}
                    {inq.location ? <span className="truncate">📍 {inq.location}</span> : null}
                    <span>{relativeAge(inq.createdAt)}</span>
                  </p>
                  {inq.message && (
                    <p className="mt-1 truncate text-xs" style={{ color: "var(--foreground)" }}>&quot;{inq.message}&quot;</p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {pagination.hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-2">
          {loadingMore && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          )}
        </div>
      )}

      <InquiryDetailSheet inquiry={activeInquiry} onClose={() => setActiveInquiry(null)} onSaved={handleSaved} />
    </div>
  );
};
