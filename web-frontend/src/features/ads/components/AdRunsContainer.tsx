"use client";

/**
 * Seller-facing "Ad Runs" screen — the missing piece that let a seller see
 * an ad they'd requested at all. Built entirely from the seller's own
 * `serviceType: "advertisement"` service requests (web-only, no backend
 * changes): there is no `GET /api/ads/my/campaigns` endpoint today, only
 * admin-scoped `/api/ads/admin/campaigns`, so this deliberately does not
 * show impressions/clicks/CTR — those live behind the admin insights
 * endpoint. What it does show — status, creative, targeting, schedule — all
 * comes straight off the request the seller filed.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { serviceRequestService } from "@/src/services/serviceRequest";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { ServiceRequest, ServiceStatus } from "@/src/types/service";
import type { Product } from "@/src/types/product";
import { ServiceStatusBadge } from "@/src/features/services/components/ServiceStatusBadge";
import { PageHeader, Card } from "@/src/components/ui/Surface";
import { Sheet } from "@/src/components/ui/Sheet";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { fadeUp } from "@/src/components/ui/motion";
import { CreativePreview } from "./CreativePreview";

type AdRunAudience = "everyone" | "specific_users" | "shopper_category" | "buy_intent" | "same_category_listers";

const AUDIENCE_LABEL: Record<AdRunAudience, string> = {
  everyone: "Everyone",
  specific_users: "Specific users",
  shopper_category: "Shoppers browsing a category",
  buy_intent: "Users with a buying signal",
  same_category_listers: "Sellers in the same category",
};

// Mirrors AdStudioPanel's resolveAudiencePreset for the same field shape, so
// a request and the campaign it becomes read the same targeting summary.
const resolveAudience = (details: ServiceRequest["advertisementDetails"]): AdRunAudience => {
  if (!details) return "everyone";
  if ((details.targetUserIds?.length ?? 0) > 0) return "specific_users";
  if (details.requireListedProductInSameCategory) return "same_category_listers";
  if ((details.buyIntentCategories?.length ?? 0) > 0) return "buy_intent";
  if ((details.shopperCategories?.length ?? 0) > 0) return "shopper_category";
  return "everyone";
};

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null);

const STATUS_ORDER: ServiceStatus[] = ["pending", "in_review", "scheduled", "in_progress", "completed"];

export const AdRunsContainer = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServiceRequest | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceRequestService.list({ serviceType: "advertisement", limit: 50, sort: "newest" });
      const runs = res.services ?? [];
      setRequests(runs);

      // Hydrate the product name/image/price for each run — the request only
      // stores the product id (no populate on this endpoint), so pull the
      // handful of distinct products in parallel via the existing public
      // product-detail endpoint rather than adding a backend join.
      const ids = Array.from(new Set(runs.map((r) => r.advertisementDetails?.product).filter((id): id is string => Boolean(id))));
      const settled = await Promise.allSettled(ids.map((id) => productService.get(id, { scope: "company" })));
      const map: Record<string, Product> = {};
      settled.forEach((result, i) => {
        if (result.status === "fulfilled") map[ids[i]] = result.value;
      });
      setProductsById(map);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load ad runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = requests.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ad Runs"
        actions={
          <Link href="/dashboard/services/request?type=advertisement"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
            + Promote a product
          </Link>
        }
      />

      {/* Status pipeline strip */}
      {requests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <ServiceStatusBadge status={s} />
              <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{counts[s] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          <span>{error}</span>
          <button onClick={load} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--surface)" }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          type="empty"
          title="No ad runs yet"
          description="Promote a product to reach more buyers — every run you file shows up here."
          action={{ label: "Promote a product", onClick: () => router.push("/dashboard/services/request?type=advertisement") }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((run, i) => (
            <AdRunCard key={run._id} run={run} product={run.advertisementDetails?.product ? productsById[run.advertisementDetails.product] : undefined} delay={i * 0.04} onOpen={() => setDetail(run)} />
          ))}
        </div>
      )}

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? "Ad run"}>
        {detail && <AdRunDetail run={detail} product={detail.advertisementDetails?.product ? productsById[detail.advertisementDetails.product] : undefined} />}
      </Sheet>
    </div>
  );
};

const AdRunCard = ({ run, product, delay, onOpen }: { run: ServiceRequest; product?: Product; delay: number; onOpen: () => void }) => {
  const details = run.advertisementDetails;
  const audience = resolveAudience(details);
  const start = formatDate(details?.startAt);
  const end = formatDate(details?.endAt);

  return (
    <motion.div {...fadeUp(delay)}>
      <Card interactive onClick={onOpen} className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{run.title}</p>
          <ServiceStatusBadge status={run.status} />
        </div>

        <div className="flex items-center gap-2.5">
          {product?.images?.[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={product.images[0].url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--background)" }}>📦</div>
          )}
          <p className="min-w-0 truncate text-xs font-medium" style={{ color: "var(--medium-gray)" }}>
            {product?.name ?? "Product"}
          </p>
        </div>

        <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{AUDIENCE_LABEL[audience]}</p>

        {(start || end) && (
          <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
            {start ?? "—"} → {end ?? "Ongoing"}
          </p>
        )}

        <div className="mt-auto rounded-lg px-2.5 py-1.5 text-[11px]" style={{ backgroundColor: "var(--background)", color: "var(--medium-gray)" }}>
          Delivery metrics appear once this run goes live.
        </div>
      </Card>
    </motion.div>
  );
};

const AdRunDetail = ({ run, product }: { run: ServiceRequest; product?: Product }) => {
  const details = run.advertisementDetails;
  const audience = resolveAudience(details);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ServiceStatusBadge status={run.status} />
        <span className="text-xs" style={{ color: "var(--medium-gray)" }}>Filed {formatDate(run.createdAt)}</span>
      </div>

      <CreativePreview
        title={details?.headline || product?.name || run.title}
        subtitle={details?.subtitle}
        ctaLabel={details?.ctaLabel || "View product"}
        badge={details?.badge}
        productImage={product?.images?.[0]?.url}
        price={product?.price?.amount}
        discount={details?.priceOverride?.amount}
        currency={product?.price?.currency ?? "INR"}
      />

      {run.description && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{run.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Product" value={product?.name ?? "—"} />
        <DetailField label="Audience" value={AUDIENCE_LABEL[audience]} />
        <DetailField label="Starts" value={formatDate(details?.startAt) ?? "Immediately"} />
        <DetailField label="Ends" value={formatDate(details?.endAt) ?? "Ongoing"} />
        {details?.priceOverride?.amount != null && (
          <DetailField label="Discounted ad price" value={`₹${details.priceOverride.amount.toLocaleString("en-IN")}`} />
        )}
        {details?.objective && <DetailField label="Objective" value={details.objective} />}
      </div>

      {(details?.shopperCategories?.length || details?.buyIntentCategories?.length) ? (
        <div className="flex flex-wrap gap-1.5">
          {(details.shopperCategories ?? details.buyIntentCategories ?? []).map((c) => (
            <span key={c} className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>{c}</span>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl px-3.5 py-3 text-xs leading-relaxed" style={{ backgroundColor: "var(--background)", color: "var(--medium-gray)" }}>
        Impressions, clicks, and click-through rate become available once this run is approved and goes live — this view shows what you submitted, not live delivery data.
      </div>
    </div>
  );
};

const DetailField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>{label}</p>
    <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{value}</p>
  </div>
);
