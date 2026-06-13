"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adService,
  AdCampaign,
  AdCampaignStatus,
  AdInsights,
  AdPlacement,
  UpsertAdCampaignInput,
} from "@/src/services/ad";
import { productService } from "@/src/services/product";
import type { Product } from "@/src/types/product";
import { ApiError } from "@/src/lib/api-error";
import { DonutChart, DonutLegend, GroupedBars, FunnelBar, AnimatedNumber, type DonutSegment, type BarGroup } from "@/src/components/ui/charts";

const PAGE_SIZE = 24;

const relativeDate = (iso?: string) => {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "today";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const STATUS_STYLE: Record<AdCampaignStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",     color: "#6B7280", bg: "#F3F4F6" },
  active:    { label: "Active",    color: "#166534", bg: "#DCFCE7" },
  paused:    { label: "Paused",    color: "#92400E", bg: "#FEF3C7" },
  completed: { label: "Completed", color: "#1E40AF", bg: "#DBEAFE" },
  archived:  { label: "Archived",  color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_CHIPS: { key: AdCampaignStatus | "all"; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "active",   label: "Active" },
  { key: "paused",   label: "Paused" },
  { key: "draft",    label: "Draft" },
  { key: "archived", label: "Archived" },
];

const PLACEMENTS: { key: AdPlacement; label: string }[] = [
  { key: "dashboard_home", label: "Dashboard home" },
  { key: "hero_banner",    label: "Hero banner" },
];

export const AdStudioPanel = () => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdCampaignStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdCampaign | null>(null);
  const [insightsFor, setInsightsFor] = useState<AdCampaign | null>(null);
  const [summary, setSummary] = useState<Record<AdCampaignStatus, number> | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accurate per-status totals (independent of the active filter / pagination).
  const loadSummary = useCallback(async () => {
    const statuses: AdCampaignStatus[] = ["active", "paused", "draft", "completed", "archived"];
    const results = await Promise.allSettled(
      statuses.map((s) => adService.listCampaigns({ status: s, limit: 1 }))
    );
    const next = {} as Record<AdCampaignStatus, number>;
    statuses.forEach((s, i) => {
      const r = results[i];
      next[s] = r.status === "fulfilled" ? (r.value.pagination?.total ?? 0) : 0;
    });
    setSummary(next);
  }, []);

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await adService.listCampaigns({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setCampaigns((prev) => append ? [...prev, ...(res.campaigns ?? [])] : (res.campaigns ?? []));
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(0); }, [load]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [searchInput]);

  const runLifecycle = async (c: AdCampaign, action: "activate" | "pause" | "stop") => {
    setActionId(c.id);
    setError(null);
    try {
      if (action === "activate") await adService.activateCampaign(c.id);
      else if (action === "pause") await adService.pauseCampaign(c.id);
      else await adService.stopCampaign(c.id);
      load(0);
      loadSummary();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Ad Studio</h1>
          {!loading && <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>{pagination.total.toLocaleString("en-IN")} campaigns</p>}
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--primary)" }}>
          + New campaign
        </button>
      </motion.div>

      {/* Portfolio summary */}
      {summary && (() => {
        const segs: DonutSegment[] = [
          { label: "Active", value: summary.active, color: "#16A34A" },
          { label: "Paused", value: summary.paused, color: "#F59E0B" },
          { label: "Draft", value: summary.draft, color: "#9CA3AF" },
          { label: "Archived", value: summary.archived, color: "#6B7280" },
        ];
        const totalCampaigns = Object.values(summary).reduce((a, b) => a + b, 0);
        const liveSegs = segs.filter((s) => s.value > 0);
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 rounded-2xl p-5 sm:grid-cols-[auto_1fr]"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <div className="flex items-center gap-5">
              <DonutChart segments={liveSegs.length ? liveSegs : segs} centerValue={totalCampaigns} centerLabel="Total" size={120} thickness={14} />
              <div className="hidden sm:block min-w-[140px]"><DonutLegend segments={segs} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:self-center">
              {[
                { label: "Active", value: summary.active, accent: "#16A34A", icon: "🟢" },
                { label: "Paused", value: summary.paused, accent: "#F59E0B", icon: "⏸️" },
                { label: "Draft", value: summary.draft, accent: "#6B7280", icon: "✏️" },
                { label: "Archived", value: summary.archived, accent: "#9CA3AF", icon: "📁" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>{s.icon} {s.label}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: s.accent }}><AnimatedNumber value={s.value} /></p>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Search + filters */}
      <div className="space-y-2">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
            <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search campaigns…"
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
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
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !campaigns.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">📣</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No campaigns</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>Create your first ad campaign to promote products.</p>
          <button onClick={() => setCreateOpen(true)} className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
            + New campaign
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c, i) => {
              const s = STATUS_STYLE[c.status];
              const banner = c.creative?.bannerImageUrl ?? c.product?.images?.[0]?.url;
              const busy = actionId === c.id;
              return (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex flex-col overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  {/* Banner */}
                  <div className="relative h-28" style={{ backgroundColor: "var(--surface)" }}>
                    {banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={banner} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">📦</div>
                    )}
                    <span className="absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div>
                      <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                        {c.creative?.title || c.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>
                        {c.product?.name ?? "No product"} · {relativeDate(c.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.placements.map((p) => (
                        <span key={p} className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)", border: "1px solid var(--border)" }}>
                          {PLACEMENTS.find((x) => x.key === p)?.label ?? p}
                        </span>
                      ))}
                    </div>
                    {/* Actions */}
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                      {(c.status === "draft" || c.status === "paused") && (
                        <ActBtn onClick={() => runLifecycle(c, "activate")} disabled={busy} color="#166534" bg="#DCFCE7">Activate</ActBtn>
                      )}
                      {c.status === "active" && (
                        <ActBtn onClick={() => runLifecycle(c, "pause")} disabled={busy} color="#92400E" bg="#FEF3C7">Pause</ActBtn>
                      )}
                      <ActBtn onClick={() => setInsightsFor(c)} color="var(--primary)" bg="var(--primary-light)">Insights</ActBtn>
                      {c.status !== "archived" && (
                        <ActBtn onClick={() => setEditing(c)} color="var(--foreground)" bg="var(--background)">Edit</ActBtn>
                      )}
                      {c.status !== "archived" && (
                        <ActBtn onClick={() => runLifecycle(c, "stop")} disabled={busy} color="#991B1B" bg="#FEE2E2">Archive</ActBtn>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {pagination.hasMore && (
            <div className="flex justify-center pt-1">
              <button onClick={() => load(pagination.offset + PAGE_SIZE, true)} disabled={loadingMore}
                className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Create / edit drawer */}
      <AnimatePresence>
        {(createOpen || editing) && (
          <CampaignDrawer
            campaign={editing}
            onClose={() => { setCreateOpen(false); setEditing(null); }}
            onSaved={() => { setCreateOpen(false); setEditing(null); load(0); loadSummary(); }}
          />
        )}
      </AnimatePresence>

      {/* Insights drawer */}
      <AnimatePresence>
        {insightsFor && (
          <InsightsDrawer campaign={insightsFor} onClose={() => setInsightsFor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const ActBtn = ({ children, onClick, disabled, color, bg }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; color: string; bg: string;
}) => (
  <button onClick={onClick} disabled={disabled}
    className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
    style={{ backgroundColor: bg, color }}>
    {children}
  </button>
);

// ── Create Campaign Drawer ─────────────────────────────────────────────────────

const isoToLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const localInputToIso = (val: string) => (val ? new Date(val).toISOString() : undefined);

const CampaignDrawer = ({ campaign, onClose, onSaved }: { campaign?: AdCampaign | null; onClose: () => void; onSaved: () => void }) => {
  const isEdit = !!campaign;
  const [product, setProduct] = useState<Product | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState(campaign?.name ?? "");
  const [title, setTitle] = useState(campaign?.creative?.title ?? "");
  const [subtitle, setSubtitle] = useState(campaign?.creative?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(campaign?.creative?.ctaLabel ?? "Shop now");
  const [badge, setBadge] = useState(campaign?.creative?.badge ?? "");
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(campaign?.creative?.bannerImageUrl ?? null);
  const [bannerVideoUrl, setBannerVideoUrl] = useState(campaign?.creative?.bannerVideoUrl ?? "");
  const [placements, setPlacements] = useState<AdPlacement[]>(campaign?.placements ?? ["dashboard_home"]);
  const [priority, setPriority] = useState(String(campaign?.priority ?? 5));
  const [freqCap, setFreqCap] = useState(String(campaign?.frequencyCapPerDay ?? 3));
  const [startAt, setStartAt] = useState(isoToLocalInput(campaign?.schedule?.startAt));
  const [endAt, setEndAt] = useState(isoToLocalInput(campaign?.schedule?.endAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the chosen product display from either a freshly-picked Product or
  // the campaign's embedded summary (edit mode).
  const productId = product?._id ?? campaign?.product?.id ?? "";
  const productDisplay = product
    ? { name: product.name, image: product.images?.[0]?.url, price: product.price.amount }
    : campaign?.product
      ? { name: campaign.product.name ?? "Product", image: campaign.product.images?.[0]?.url, price: campaign.product.price?.amount }
      : null;

  const togglePlacement = (p: AdPlacement) =>
    setPlacements((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const handleBanner = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBannerPreview(result);
      setBannerBase64(result.includes(",") ? result.split(",")[1] ?? "" : result);
    };
    reader.readAsDataURL(file);
  };

  const canSave = !!productId && !!name.trim() && placements.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const schedule = (startAt || endAt)
        ? { startAt: localInputToIso(startAt), endAt: localInputToIso(endAt) }
        : undefined;
      const payload: UpsertAdCampaignInput = {
        name: name.trim(),
        productId,
        placements,
        priority: parseInt(priority, 10) || 5,
        frequencyCapPerDay: parseInt(freqCap, 10) || 3,
        ...(schedule ? { schedule } : {}),
        creative: {
          title: title.trim() || productDisplay?.name,
          subtitle: subtitle.trim() || undefined,
          ctaLabel: ctaLabel.trim() || undefined,
          badge: badge.trim() || undefined,
          ...(bannerBase64
            ? { bannerMediaType: "image" as const, bannerImageBase64: bannerBase64 }
            : bannerVideoUrl.trim()
              ? { bannerMediaType: "video" as const, bannerVideoUrl: bannerVideoUrl.trim() }
              : {}),
        },
      };
      if (isEdit && campaign) await adService.updateCampaign(campaign.id, payload);
      else await adService.createCampaign(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} campaign`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader title={isEdit ? "Edit campaign" : "New campaign"} subtitle="Promote a product across placements" onClose={onClose} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        {/* Product */}
        <div>
          <Label required>Product</Label>
          {productDisplay ? (
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
              {productDisplay.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={productDisplay.image} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--surface)" }}>📦</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{productDisplay.name}</p>
                {productDisplay.price != null && (
                  <p className="text-xs" style={{ color: "var(--medium-gray)" }}>₹{productDisplay.price.toLocaleString("en-IN")}</p>
                )}
              </div>
              <button type="button" onClick={() => setPickerOpen(true)} className="text-xs font-bold" style={{ color: "var(--primary)" }}>Change</button>
            </div>
          ) : (
            <button type="button" onClick={() => setPickerOpen(true)}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--background)" }}>
              + Select a product
            </button>
          )}
        </div>

        <Field label="Campaign name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Internal campaign name"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </Field>

        {/* Creative */}
        <div className="rounded-xl p-4 space-y-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Creative</p>
          <Field label="Headline">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to product name"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Subtitle">
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optional supporting line"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA label">
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </Field>
            <Field label="Badge">
              <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. New"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </Field>
          </div>
          <Field label="Banner image">
            {bannerPreview ? (
              <div className="relative overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerPreview} alt="banner" className="h-28 w-full object-cover" />
                <button type="button" onClick={() => { setBannerPreview(null); setBannerBase64(null); }}
                  className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center rounded-xl py-4 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
                + Upload banner
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBanner(f); }} />
              </label>
            )}
          </Field>
          <Field label="Banner video URL">
            <input value={bannerVideoUrl} onChange={(e) => setBannerVideoUrl(e.target.value)}
              placeholder="https://… (used when no image is set)" type="url"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            {bannerVideoUrl.trim() && !bannerBase64 && (
              <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--primary)" }}>▶ Video creative will be used for this campaign.</p>
            )}
          </Field>
        </div>

        {/* Placements */}
        <div>
          <Label required>Placements</Label>
          <div className="flex gap-2">
            {PLACEMENTS.map((p) => (
              <button key={p.key} type="button" onClick={() => togglePlacement(p.key)}
                className="flex-1 rounded-xl py-2.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: placements.includes(p.key) ? "var(--primary)" : "var(--surface)",
                  color: placements.includes(p.key) ? "#fff" : "var(--foreground)",
                  border: "1px solid var(--border)",
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority (1–10)">
            <input type="number" min="1" max="10" value={priority} onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Frequency cap / day">
            <input type="number" min="1" value={freqCap} onChange={(e) => setFreqCap(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
        </div>

        {/* Schedule */}
        <div className="rounded-xl p-4 space-y-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Schedule</p>
            {(startAt || endAt) && (
              <button type="button" onClick={() => { setStartAt(""); setEndAt(""); }}
                className="text-[11px] font-bold" style={{ color: "var(--medium-gray)" }}>Clear</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </Field>
            <Field label="Ends">
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </Field>
          </div>
          <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Leave blank to run indefinitely once activated.</p>
        </div>

        {error && <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>Cancel</button>
          <button type="submit" disabled={!canSave || saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)" }}>
            {saving ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save changes" : "Create as draft")}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {pickerOpen && (
          <ProductPicker onSelect={(p) => { setProduct(p); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />
        )}
      </AnimatePresence>
    </Drawer>
  );
};

// ── Product Picker (marketplace scope) ─────────────────────────────────────────

const ProductPicker = ({ onSelect, onClose }: { onSelect: (p: Product) => void; onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await productService.list({ scope: "marketplace", search: q || undefined, limit: 40 });
      setResults(res.products ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(""); }, [load]);
  useEffect(() => { const t = setTimeout(() => load(search), 250); return () => clearTimeout(t); }, [load, search]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Select product</p>
          <button onClick={onClose} className="text-lg font-bold leading-none hover:opacity-60" style={{ color: "var(--medium-gray)" }}>✕</button>
        </div>
        <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus placeholder="Search marketplace products…"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
            </div>
          ) : !results.length ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No products found.</p>
          ) : results.map((p) => (
            <button key={p._id} onClick={() => onSelect(p)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--background)]"
              style={{ borderBottom: "1px solid var(--border)" }}>
              {p.images?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0].url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--background)" }}>📦</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.name}</p>
                <p className="text-xs" style={{ color: "var(--medium-gray)" }}>₹{p.price.amount.toLocaleString("en-IN")} · {p.category}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ── Insights Drawer ────────────────────────────────────────────────────────────

const InsightsDrawer = ({ campaign, onClose }: { campaign: AdCampaign; onClose: () => void }) => {
  const [insights, setInsights] = useState<AdInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await adService.getInsights(campaign.id);
        if (active) setInsights(data);
      } catch (err) {
        if (active) setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load insights");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [campaign.id]);

  const impressions = insights?.summary.impression?.count ?? 0;
  const clicks = insights?.summary.click?.count ?? 0;
  const dismisses = insights?.summary.dismiss?.count ?? 0;

  const cards = insights ? [
    { label: "Impressions", value: impressions.toLocaleString("en-IN"), sub: `${insights.summary.impression?.uniqueUsers ?? 0} users`, color: "var(--primary)" },
    { label: "Clicks",      value: clicks.toLocaleString("en-IN"),      sub: `${insights.summary.click?.uniqueUsers ?? 0} users`, color: "#16A34A" },
    { label: "Dismisses",   value: dismisses.toLocaleString("en-IN"),   sub: `${insights.summary.dismiss?.uniqueUsers ?? 0} users`, color: "#DC2626" },
    { label: "CTR",         value: `${(insights.ctr * 100).toFixed(1)}%`, sub: "click-through", color: "#7C3AED" },
  ] : [];

  // Pivot the flat byDay events into one group per day with each event type.
  const barGroups: BarGroup[] = insights
    ? Object.values(
        insights.byDay.reduce((acc, d) => {
          const key = d.day.slice(0, 10);
          acc[key] ??= { label: new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), values: {} };
          acc[key].values[d.type] = (acc[key].values[d.type] ?? 0) + d.count;
          return acc;
        }, {} as Record<string, BarGroup>)
      ).sort((a, b) => a.label.localeCompare(b.label))
    : [];

  const ctrDonut: DonutSegment[] = [
    { label: "Clicked", value: clicks, color: "#16A34A" },
    { label: "Did not click", value: Math.max(0, impressions - clicks), color: "var(--border)" },
  ];

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader title="Campaign insights" subtitle={campaign.creative?.title || campaign.name} onClose={onClose} />
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />)}
          </div>
        ) : error ? (
          <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>
        ) : insights ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {cards.map((c) => (
                <div key={c.label} className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: c.color }}>{c.label}</p>
                  <p className="mt-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>{c.value}</p>
                  <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>{c.sub}</p>
                </div>
              ))}
            </div>

            {/* CTR donut + conversion funnel */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col items-center justify-center rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-2 self-start text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Click-through</p>
                <DonutChart segments={ctrDonut} centerValue={`${(insights.ctr * 100).toFixed(1)}%`} centerLabel="CTR" size={120} thickness={14} />
              </div>
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Funnel</p>
                <FunnelBar rows={[
                  { label: "Impressions", value: impressions, color: "var(--primary)" },
                  { label: "Clicks", value: clicks, color: "#16A34A" },
                  { label: "Dismisses", value: dismisses, color: "#DC2626" },
                ]} />
              </div>
            </div>

            {/* Daily trend */}
            {barGroups.length > 0 ? (
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Daily activity</p>
                <GroupedBars
                  groups={barGroups}
                  series={[
                    { key: "impression", label: "Impressions", color: "var(--primary)" },
                    { key: "click", label: "Clicks", color: "#16A34A" },
                    { key: "dismiss", label: "Dismisses", color: "#DC2626" },
                  ]}
                />
              </div>
            ) : (
              <p className="rounded-2xl p-4 text-center text-sm" style={{ border: "1px dashed var(--border)", color: "var(--medium-gray)" }}>
                No daily activity recorded yet.
              </p>
            )}
          </>
        ) : null}
      </div>
    </Drawer>
  );
};

// ── Shared drawer primitives ──────────────────────────────────────────────────

const Drawer = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <>
    <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto shadow-2xl"
      style={{ backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}>
      {children}
    </motion.aside>
  </>
);

const DrawerHeader = ({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) => (
  <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 py-4"
    style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
    <div>
      <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--medium-gray)" }}>{subtitle}</p>}
    </div>
    <button type="button" onClick={onClose}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-60"
      style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--medium-gray)" }}>✕</button>
  </div>
);

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
    {children}{required && <span className="ml-0.5" style={{ color: "#DC2626" }}>*</span>}
  </label>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <Label required={required}>{label}</Label>
    {children}
  </div>
);
