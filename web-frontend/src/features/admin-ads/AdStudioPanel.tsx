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
import { adminService, type AdminUser } from "@/src/services/admin";
import type { Product } from "@/src/types/product";
import { PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";
import { ApiError, isAbortError } from "@/src/lib/api-error";
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
                      <img loading="lazy" decoding="async" src={banner} alt={c.name} className="h-full w-full object-cover" />
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

type AudiencePreset = "everyone" | "specific_users" | "shopper_category" | "buy_intent" | "same_category_listers";

const AUDIENCE_PRESETS: { key: AudiencePreset; label: string; hint: string; icon: string }[] = [
  { key: "everyone",               label: "Everyone",             hint: "Show to all eligible users",                 icon: "🌐" },
  { key: "specific_users",         label: "Specific users",       hint: "Hand-pick exactly who sees this ad",          icon: "🎯" },
  { key: "shopper_category",       label: "Browsed a category",   hint: "Users recently viewing chosen categories",   icon: "👀" },
  { key: "buy_intent",             label: "Buying signal",        hint: "Added-to-cart / accepted quotes in category", icon: "🛒" },
  { key: "same_category_listers",  label: "Same-category sellers", hint: "Users who list in this product's category",  icon: "🏭" },
];

const inferAudiencePreset = (t?: AdCampaign["targeting"]): AudiencePreset => {
  if (!t) return "everyone";
  if ((t.userIds?.length ?? 0) > 0) return "specific_users";
  if (t.requireListedProductInSameCategory) return "same_category_listers";
  if ((t.buyIntentCategories?.length ?? 0) > 0) return "buy_intent";
  if ((t.shopperCategories?.length ?? 0) > 0) return "shopper_category";
  return "everyone";
};

const CampaignDrawer = ({ campaign, onClose, onSaved }: { campaign?: AdCampaign | null; onClose: () => void; onSaved: () => void }) => {
  const isEdit = !!campaign;
  const [product, setProduct] = useState<Product | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [title, setTitle] = useState(campaign?.creative?.title ?? "");
  const [subtitle, setSubtitle] = useState(campaign?.creative?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(campaign?.creative?.ctaLabel ?? "View product");
  const [badge, setBadge] = useState(campaign?.creative?.badge ?? "");

  // Banner (hero placement only)
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(campaign?.creative?.bannerImageUrl ?? null);
  const [bannerVideoUrl, setBannerVideoUrl] = useState(campaign?.creative?.bannerVideoUrl ?? "");
  const [aspectWarning, setAspectWarning] = useState<string | null>(null);
  // Poster (shown before/while a banner video loads)
  const [posterBase64, setPosterBase64] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(campaign?.creative?.bannerPosterUrl ?? null);

  // Discount
  const [useDiscount, setUseDiscount] = useState(!!campaign?.creative?.priceOverride?.amount);
  const [discountAmount, setDiscountAmount] = useState(
    campaign?.creative?.priceOverride?.amount != null ? String(campaign.creative.priceOverride.amount) : "",
  );

  // Audience targeting
  const [audience, setAudience] = useState<AudiencePreset>(inferAudiencePreset(campaign?.targeting));
  const [shopperCategories, setShopperCategories] = useState<string[]>(campaign?.targeting?.shopperCategories ?? []);
  const [buyIntentCategories, setBuyIntentCategories] = useState<string[]>(campaign?.targeting?.buyIntentCategories ?? []);
  const [specificUsers, setSpecificUsers] = useState<AdminUser[]>([]);
  const [specificUserIds, setSpecificUserIds] = useState<string[]>(campaign?.targeting?.userIds ?? []);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [targetingMode, setTargetingMode] = useState<"any" | "all">(campaign?.targeting?.mode ?? "any");
  const [lookbackDays, setLookbackDays] = useState(String(campaign?.targeting?.lookbackDays ?? 60));
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Delivery + schedule
  const [placements, setPlacements] = useState<AdPlacement[]>(campaign?.placements ?? ["dashboard_home"]);
  const [priority, setPriority] = useState(campaign?.priority ?? 50);
  const [freqCap, setFreqCap] = useState(String(campaign?.frequencyCapPerDay ?? 3));
  const [startAt, setStartAt] = useState(isoToLocalInput(campaign?.schedule?.startAt));
  const [endAt, setEndAt] = useState(isoToLocalInput(campaign?.schedule?.endAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the chosen product display from either a freshly-picked Product or
  // the campaign's embedded summary (edit mode).
  const productId = product?._id ?? campaign?.product?.id ?? "";
  const listedPrice = product ? product.price.amount : campaign?.product?.price?.amount;
  const productCurrency = (product ? product.price.currency : campaign?.product?.price?.currency) ?? "INR";
  const productDisplay = product
    ? { name: product.name, image: product.images?.[0]?.url, price: product.price.amount }
    : campaign?.product
      ? { name: campaign.product.name ?? "Product", image: campaign.product.images?.[0]?.url, price: campaign.product.price?.amount }
      : null;

  const isHero = placements.includes("hero_banner");

  // Edit mode: hydrate display names for already-targeted users so chips don't show raw ids.
  useEffect(() => {
    const missing = specificUserIds.filter((id) => !specificUsers.some((u) => u.id === id));
    if (!missing.length) return;
    let active = true;
    (async () => {
      const loaded = await Promise.all(
        missing.map((id) => adminService.getUserOverview(id).then((o) => o.user).catch(() => null)),
      );
      if (active) {
        const found = loaded.filter((u): u is AdminUser => !!u);
        if (found.length) setSpecificUsers((prev) => [...prev, ...found.filter((u) => !prev.some((p) => p.id === u.id))]);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlacement = (p: AdPlacement) =>
    setPlacements((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const toggleCat = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleBanner = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBannerPreview(result);
      setBannerBase64(result.includes(",") ? result.split(",")[1] ?? "" : result);
      // Aspect-ratio guard — the hero is a wide banner (~16:9). Warn on far-off ratios.
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        setAspectWarning(ratio < 1.3 || ratio > 2.4
          ? `Banner is ${img.width}×${img.height} (${ratio.toFixed(2)}:1). The hero crops to ~16:9 — use a wide image to avoid cropping.`
          : null);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handlePoster = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPosterPreview(result);
      setPosterBase64(result.includes(",") ? result.split(",")[1] ?? "" : result);
    };
    reader.readAsDataURL(file);
  };

  // Validation surfaced inline so the save button explains itself.
  const validationError = (() => {
    if (!productId) return "Select a product to promote.";
    if (!name.trim()) return "Give the campaign an internal name.";
    if (!placements.length) return "Pick at least one placement.";
    if (audience === "specific_users" && !specificUserIds.length) return "Pick at least one user to target.";
    if (audience === "shopper_category" && !shopperCategories.length) return "Choose at least one shopper category.";
    if (audience === "buy_intent" && !buyIntentCategories.length) return "Choose at least one buying-signal category.";
    if (useDiscount) {
      const amt = Number(discountAmount);
      if (!Number.isFinite(amt) || amt <= 0) return "Discounted price must be greater than 0.";
      if (listedPrice != null && amt > listedPrice) return "Discounted price can't exceed the listed price.";
    }
    return null;
  })();
  const canSave = !validationError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    try {
      const schedule = startAt || endAt
        ? { startAt: localInputToIso(startAt), endAt: localInputToIso(endAt) }
        : undefined;

      const targeting: UpsertAdCampaignInput["targeting"] = {
        mode: targetingMode,
        userIds: audience === "specific_users" ? specificUserIds : [],
        shopperCategories: audience === "shopper_category" ? shopperCategories : [],
        buyIntentCategories: audience === "buy_intent" ? buyIntentCategories : [],
        requireListedProductInSameCategory: audience === "same_category_listers",
        lookbackDays: Math.min(Math.max(parseInt(lookbackDays, 10) || 60, 1), 365),
      };

      const creative: UpsertAdCampaignInput["creative"] = {
        title: title.trim() || productDisplay?.name,
        subtitle: subtitle.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
        badge: badge.trim() || undefined,
        priceOverride: useDiscount && Number(discountAmount) > 0
          ? { amount: Number(discountAmount), currency: productCurrency }
          : null,
        ...(isHero
          ? {
              ...(bannerBase64
                ? { bannerMediaType: "image" as const, bannerImageBase64: bannerBase64 }
                : bannerVideoUrl.trim()
                  ? { bannerMediaType: "video" as const, bannerVideoUrl: bannerVideoUrl.trim() }
                  : {}),
              ...(posterBase64 ? { bannerPosterBase64: posterBase64 } : {}),
            }
          : {}),
      };

      const payload: UpsertAdCampaignInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        productId,
        placements,
        targeting,
        priority,
        frequencyCapPerDay: parseInt(freqCap, 10) || 3,
        ...(schedule ? { schedule } : {}),
        creative,
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

  const priorityLabel = priority >= 75 ? "High" : priority >= 40 ? "Medium" : "Low";

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader title={isEdit ? "Edit campaign" : "New campaign"} subtitle="Promote a product across placements" onClose={onClose} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        {/* 1 ─ Product */}
        <Section title="Product" step={1}>
          {productDisplay ? (
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              {productDisplay.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" decoding="async" src={productDisplay.image} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--background)" }}>📦</div>
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
              style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
              + Select a product
            </button>
          )}
          <Field label="Campaign name" required>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Internal name, e.g. Bearings push — June"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Notes (internal)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional — why this campaign exists"
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
        </Section>

        {/* 2 ─ Creative */}
        <Section title="Creative" step={2}>
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

          {/* Discount toggle */}
          <ToggleRow
            label="Run a discounted ad price"
            hint={listedPrice != null ? `Listed at ₹${listedPrice.toLocaleString("en-IN")}` : "Shown as a strike-through deal"}
            on={useDiscount}
            onToggle={() => setUseDiscount((v) => !v)}
          />
          {useDiscount && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--medium-gray)" }}>₹</span>
              <input type="number" min="1" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="Advertised price"
                className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--foreground)" }} />
              {listedPrice != null && Number(discountAmount) > 0 && Number(discountAmount) < listedPrice && (
                <span className="whitespace-nowrap text-[11px] font-bold" style={{ color: "#16A34A" }}>
                  −{Math.round((1 - Number(discountAmount) / listedPrice) * 100)}%
                </span>
              )}
            </div>
          )}
        </Section>

        {/* 3 ─ Placement + banner */}
        <Section title="Placement" step={3}>
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

          {isHero && (
            <div className="space-y-3 rounded-xl p-3" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--surface)" }}>
              <p className="text-[11px] font-semibold" style={{ color: "var(--medium-gray)" }}>
                Hero banner uses a full-bleed image or video. Leave empty to auto-build a card from the product.
              </p>

              {/* Live preview — exactly how the hero slide renders (16:9). */}
              <HeroPreview
                bannerImage={bannerPreview}
                videoUrl={bannerVideoUrl.trim() && !bannerBase64 ? bannerVideoUrl.trim() : undefined}
                poster={posterPreview}
                productImage={productDisplay?.image}
                title={title.trim() || productDisplay?.name || "Featured product"}
                subtitle={subtitle.trim()}
                ctaLabel={ctaLabel.trim() || "View product"}
                badge={badge.trim()}
                price={listedPrice}
                discount={useDiscount && Number(discountAmount) > 0 ? Number(discountAmount) : undefined}
                currency={productCurrency}
              />

              <Field label="Banner image (recommended 16:9)">
                {bannerPreview ? (
                  <div className="relative overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img loading="lazy" decoding="async" src={bannerPreview} alt="banner" className="h-28 w-full object-cover" />
                    <button type="button" onClick={() => { setBannerPreview(null); setBannerBase64(null); setAspectWarning(null); }}
                      className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white">Remove</button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center rounded-xl py-4 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--background)" }}>
                    + Upload banner image
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBanner(f); }} />
                  </label>
                )}
                {aspectWarning && (
                  <p className="mt-1 text-[11px] font-semibold" style={{ color: "#B45309" }}>⚠ {aspectWarning}</p>
                )}
              </Field>

              <Field label="…or banner video URL">
                <input value={bannerVideoUrl} onChange={(e) => setBannerVideoUrl(e.target.value)}
                  placeholder="https://… (used when no image is set)" type="url"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                {bannerVideoUrl.trim() && !bannerBase64 && (
                  <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--primary)" }}>▶ Video creative will be used.</p>
                )}
              </Field>

              {/* Poster — recommended for video so mobiles see an image before the video loads. */}
              {bannerVideoUrl.trim() && !bannerBase64 && (
                <Field label="Video poster image (data-saver fallback)">
                  {posterPreview ? (
                    <div className="relative overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async" src={posterPreview} alt="poster" className="h-24 w-full object-cover" />
                      <button type="button" onClick={() => { setPosterPreview(null); setPosterBase64(null); }}
                        className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white">Remove</button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                      style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--background)" }}>
                      + Upload poster image
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePoster(f); }} />
                    </label>
                  )}
                </Field>
              )}
            </div>
          )}
        </Section>

        {/* 4 ─ Audience */}
        <Section title="Audience" step={4}>
          <div className="grid grid-cols-2 gap-2">
            {AUDIENCE_PRESETS.map((a) => {
              const active = audience === a.key;
              return (
                <button key={a.key} type="button" onClick={() => setAudience(a.key)}
                  className="rounded-xl p-2.5 text-left transition-all"
                  style={{
                    border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                    backgroundColor: active ? "var(--primary-light)" : "var(--surface)",
                  }}>
                  <p className="text-xs font-bold" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>{a.icon} {a.label}</p>
                  <p className="mt-0.5 text-[10px] leading-tight" style={{ color: "var(--medium-gray)" }}>{a.hint}</p>
                </button>
              );
            })}
          </div>

          {audience === "specific_users" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Targeted users ({specificUserIds.length})</Label>
                <button type="button" onClick={() => setUserPickerOpen(true)} className="text-[11px] font-bold" style={{ color: "var(--primary)" }}>+ Add users</button>
              </div>
              {specificUserIds.length === 0 ? (
                <button type="button" onClick={() => setUserPickerOpen(true)}
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ border: "1px dashed var(--border)", color: "var(--primary)", backgroundColor: "var(--surface)" }}>
                  + Pick users to target
                </button>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {specificUserIds.map((id) => {
                    const u = specificUsers.find((x) => x.id === id);
                    return (
                      <span key={id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                        {u?.displayName || u?.email || `${id.slice(-6)}`}
                        <button type="button" onClick={() => setSpecificUserIds((prev) => prev.filter((x) => x !== id))} className="font-bold">✕</button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {audience === "shopper_category" && (
            <CategoryMultiSelect label="Target shopper categories" selected={shopperCategories}
              onToggle={(id) => toggleCat(shopperCategories, setShopperCategories, id)} />
          )}
          {audience === "buy_intent" && (
            <CategoryMultiSelect label="Buying-signal categories" selected={buyIntentCategories}
              onToggle={(id) => toggleCat(buyIntentCategories, setBuyIntentCategories, id)} />
          )}
          {audience === "same_category_listers" && (
            <p className="rounded-xl p-3 text-[11px]" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--medium-gray)" }}>
              Targets users who have active public listings in the promoted product&apos;s category.
            </p>
          )}

          {audience !== "everyone" && (
            <>
              <button type="button" onClick={() => setAdvancedOpen((v) => !v)} className="text-[11px] font-bold" style={{ color: "var(--primary)" }}>
                {advancedOpen ? "Hide advanced rules" : "Advanced rules"}
              </button>
              {advancedOpen && (
                <div className="space-y-3 rounded-xl p-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
                  <div>
                    <Label>Match mode</Label>
                    <div className="flex gap-2">
                      {(["any", "all"] as const).map((m) => (
                        <button key={m} type="button" onClick={() => setTargetingMode(m)}
                          className="flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all"
                          style={{
                            backgroundColor: targetingMode === m ? "var(--primary)" : "var(--background)",
                            color: targetingMode === m ? "#fff" : "var(--foreground)",
                            border: "1px solid var(--border)",
                          }}>
                          {m === "any" ? "Match ANY rule" : "Match ALL rules"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Signal lookback (days)">
                    <input type="number" min="1" max="365" value={lookbackDays}
                      onChange={(e) => setLookbackDays(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                  </Field>
                </div>
              )}
            </>
          )}
        </Section>

        {/* 5 ─ Delivery & schedule */}
        <Section title="Delivery & schedule" step={5}>
          <div>
            <div className="flex items-center justify-between">
              <Label>Priority</Label>
              <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{priorityLabel} · {priority}</span>
            </div>
            <input type="range" min={1} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full accent-[var(--primary)]" />
            <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Higher priority wins when several ads compete for the same slot.</p>
          </div>
          <Field label="Frequency cap / day">
            <input type="number" min="1" max="50" value={freqCap} onChange={(e) => setFreqCap(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <div className="flex items-center justify-between">
            <Label>Schedule</Label>
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
        </Section>

        {error && (
          <div className="rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>{error}</div>
        )}

        <div className="sticky bottom-0 -mx-5 flex gap-3 px-5 py-4" style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>Cancel</button>
          <button type="submit" disabled={!canSave || saving} title={validationError ?? undefined}
            className="flex-[2] rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)" }}>
            {saving ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save changes" : "Create as draft")}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {pickerOpen && (
          <ProductPicker onSelect={(p) => { setProduct(p); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />
        )}
        {userPickerOpen && (
          <UserPicker
            selectedIds={specificUserIds}
            onToggle={(u) => {
              setSpecificUsers((prev) => (prev.find((x) => x.id === u.id) ? prev : [...prev, u]));
              setSpecificUserIds((prev) => (prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id]));
            }}
            onClose={() => setUserPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </Drawer>
  );
};

// ── Hero banner live preview (mirrors the app HeroBannerCarousel) ───────────────

const HeroPreview = ({ bannerImage, videoUrl, poster, productImage, title, subtitle, ctaLabel, badge, price, discount, currency }: {
  bannerImage?: string | null; videoUrl?: string; poster?: string | null; productImage?: string;
  title: string; subtitle?: string; ctaLabel: string; badge?: string; price?: number; discount?: number; currency: string;
}) => {
  const fullBleed = bannerImage || poster || (videoUrl ? poster : null);
  const sym = currency === "INR" || !currency ? "₹" : `${currency} `;
  const showPrice = price != null;
  const advertised = discount && discount > 0 ? discount : price;
  return (
    <div>
      <Label>Live preview</Label>
      <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 9", border: "1px solid var(--border)", background: "linear-gradient(135deg,#1B1464,#2E3192,#0071BC)" }}>
        {fullBleed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={fullBleed} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : videoUrl ? (
          <video src={videoUrl} muted className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest text-white/80">AD</span>
              {badge && <span className="ml-1 inline-block rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-bold text-white">{badge}</span>}
              <p className="mt-1 truncate text-base font-extrabold text-white">{title}</p>
              {subtitle && <p className="truncate text-[11px] font-semibold text-white/70">{subtitle}</p>}
              {showPrice && (
                <p className="mt-1 text-sm font-extrabold" style={{ color: "#4ADE80" }}>
                  {discount && price && discount < price && <span className="mr-1.5 text-[11px] font-bold text-white/50 line-through">{sym}{price.toLocaleString("en-IN")}</span>}
                  {sym}{Number(advertised).toLocaleString("en-IN")}
                </p>
              )}
              <span className="mt-1.5 inline-block rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold" style={{ color: "#1B1464" }}>{ctaLabel}</span>
            </div>
            {productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={productImage} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl border-2 border-white/15 object-cover" />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border-2 border-white/15 bg-white/10 text-2xl">📦</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── User picker (specific-user targeting) ───────────────────────────────────────

const UserPicker = ({ selectedIds, onToggle, onClose }: { selectedIds: string[]; onToggle: (u: AdminUser) => void; onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await adminService.listUsers({ search: q || undefined, limit: 40, sort: "updatedAt:desc" });
      setResults(res.users ?? []);
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
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Target specific users · {selectedIds.length} selected</p>
          <button onClick={onClose} className="text-lg font-bold leading-none hover:opacity-60" style={{ color: "var(--medium-gray)" }}>✕</button>
        </div>
        <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus placeholder="Search by name, email, phone…"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--primary)" }} />
            </div>
          ) : !results.length ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--medium-gray)" }}>No users found.</p>
          ) : results.map((u) => {
            const active = selectedIds.includes(u.id);
            return (
              <button key={u.id} onClick={() => onToggle(u)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--background)]"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: active ? "var(--primary)" : "var(--background)", color: active ? "#fff" : "var(--medium-gray)" }}>
                  {active ? "✓" : (u.displayName || u.email || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{u.displayName || "Unnamed user"}</p>
                  <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>{u.email}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="w-full rounded-xl py-2.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>Done</button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Drawer form helpers ────────────────────────────────────────────────────────

const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
  <div className="rounded-2xl p-4 space-y-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>{step}</span>
      <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>{title}</p>
    </div>
    {children}
  </div>
);

const ToggleRow = ({ label, hint, on, onToggle }: { label: string; hint?: string; on: boolean; onToggle: () => void }) => (
  <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left"
    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
    <span>
      <span className="block text-xs font-bold" style={{ color: "var(--foreground)" }}>{label}</span>
      {hint && <span className="block text-[10px]" style={{ color: "var(--medium-gray)" }}>{hint}</span>}
    </span>
    <span className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
      style={{ backgroundColor: on ? "var(--primary)" : "var(--border)" }}>
      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }} />
    </span>
  </button>
);

const CategoryMultiSelect = ({ label, selected, onToggle }: { label: string; selected: string[]; onToggle: (id: string) => void }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex flex-wrap gap-1.5">
      {PRODUCT_CATEGORIES.map((c) => {
        const active = selected.includes(c.id);
        return (
          <button key={c.id} type="button" onClick={() => onToggle(c.id)}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all"
            style={{
              backgroundColor: active ? "var(--primary)" : "var(--surface)",
              color: active ? "#fff" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}>
            {c.icon} {c.title}
          </button>
        );
      })}
    </div>
  </div>
);

// ── Product Picker (marketplace scope) ─────────────────────────────────────────

const ProductPicker = ({ onSelect, onClose }: { onSelect: (p: Product) => void; onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (q: string) => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    setLoading(true);
    try {
      const res = await productService.list({ scope: "marketplace", search: q || undefined, limit: 40 }, controller.signal);
      setResults(res.products ?? []);
    } catch (err) {
      if (isAbortError(err)) return; // superseded/unmounted — ignore
      setResults([]);
    } finally {
      if (loadAbortRef.current === controller) setLoading(false);
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
                <img loading="lazy" decoding="async" src={p.images[0].url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
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

const INSIGHT_RANGES: { key: string; label: string; days: number | null }[] = [
  { key: "7",   label: "7d",  days: 7 },
  { key: "30",  label: "30d", days: 30 },
  { key: "90",  label: "90d", days: 90 },
  { key: "all", label: "All", days: null },
];

const InsightsDrawer = ({ campaign, onClose }: { campaign: AdCampaign; onClose: () => void }) => {
  const [insights, setInsights] = useState<AdInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const days = INSIGHT_RANGES.find((r) => r.key === rangeKey)?.days ?? null;
        const range = days ? { from: new Date(Date.now() - days * 86400000).toISOString() } : undefined;
        const data = await adService.getInsights(campaign.id, range);
        if (active) setInsights(data);
      } catch (err) {
        if (active) setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load insights");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [campaign.id, rangeKey]);

  const impressions = insights?.summary.impression?.count ?? 0;
  const clicks = insights?.summary.click?.count ?? 0;
  const dismisses = insights?.summary.dismiss?.count ?? 0;
  const dismissRate = insights?.dismissRate ?? 0;
  const fatigued = dismissRate >= 20;
  const attribution = insights?.attribution;
  const byPlacement = (insights?.byPlacement ?? []).filter((p) => p.impression + p.click + p.dismiss > 0);

  const cards = insights ? [
    { label: "Impressions", value: impressions.toLocaleString("en-IN"), sub: `${insights.summary.impression?.uniqueUsers ?? 0} users`, color: "var(--primary)" },
    { label: "Clicks",      value: clicks.toLocaleString("en-IN"),      sub: `${insights.summary.click?.uniqueUsers ?? 0} users`, color: "#16A34A" },
    { label: "CTR",         value: `${insights.ctr.toFixed(1)}%`, sub: "click-through", color: "#7C3AED" },
    { label: "Dismiss rate", value: `${dismissRate.toFixed(1)}%`, sub: fatigued ? "⚠ creative fatigue" : `${dismisses} dismisses`, color: fatigued ? "#DC2626" : "#92400E" },
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

  const placementLabel = (p: AdPlacement) => PLACEMENTS.find((x) => x.key === p)?.label ?? p;

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader title="Campaign insights" subtitle={campaign.creative?.title || campaign.name} onClose={onClose} />
      <div className="p-5 space-y-4">
        {/* Date range */}
        <div className="flex gap-1.5">
          {INSIGHT_RANGES.map((r) => (
            <button key={r.key} onClick={() => setRangeKey(r.key)}
              className="flex-1 rounded-lg py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: rangeKey === r.key ? "var(--primary)" : "var(--surface)",
                color: rangeKey === r.key ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {r.label}
            </button>
          ))}
        </div>

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

            {/* Lead attribution */}
            {attribution && attribution.clickers > 0 && (
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Lead attribution</p>
                  <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>{attribution.clickToLeadRate.toFixed(1)}% of clickers converted</p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Leads", value: attribution.leads, color: "#16A34A" },
                    { label: "Quotes", value: attribution.quotes, color: "var(--foreground)" },
                    { label: "Inquiries", value: attribution.inquiries, color: "var(--foreground)" },
                    { label: "Orders", value: attribution.orders, color: "#7C3AED" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-2" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                      <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] font-semibold" style={{ color: "var(--medium-gray)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px]" style={{ color: "var(--medium-gray)" }}>
                  Conversions on the promoted product by users who clicked this ad.
                </p>
              </div>
            )}

            {/* Per-placement breakdown */}
            {byPlacement.length > 0 && (
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>By placement</p>
                <div className="space-y-2">
                  {byPlacement.map((p) => (
                    <div key={p.placement} className="rounded-xl p-3" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{placementLabel(p.placement)}</p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>{p.ctr.toFixed(1)}% CTR</span>
                      </div>
                      <div className="mt-1.5 flex gap-4 text-[11px]" style={{ color: "var(--medium-gray)" }}>
                        <span>👁 {p.impression.toLocaleString("en-IN")}</span>
                        <span style={{ color: "#16A34A" }}>👆 {p.click.toLocaleString("en-IN")}</span>
                        <span style={{ color: "#DC2626" }}>✕ {p.dismiss.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTR donut + conversion funnel */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col items-center justify-center rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="mb-2 self-start text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Click-through</p>
                <DonutChart segments={ctrDonut} centerValue={`${insights.ctr.toFixed(1)}%`} centerLabel="CTR" size={120} thickness={14} />
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
