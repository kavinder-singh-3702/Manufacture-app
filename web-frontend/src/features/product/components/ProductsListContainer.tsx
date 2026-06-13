"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { CreateProductInput, Product, ProductStats } from "@/src/types/product";
import { useAuth } from "@/src/hooks/useAuth";
import { useOptionalDashboardContext } from "@/src/features/dashboard/components/user-dashboard/context";
import { useToast } from "@/src/components/ui/Toast";
import { ProductsStatsHero } from "./ProductsStatsHero";
import { ProductFilters, type FiltersState } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import { ProductFormDrawer } from "./ProductFormDrawer";
import type { PendingImage } from "./ProductImageUploader";

const PAGE_SIZE = 24;

const guestInitialFilters: FiltersState = {
  search: "", category: "", status: "", sort: "", scope: "marketplace",
};
const authInitialFilters: FiltersState = {
  search: "", category: "", status: "", sort: "", scope: "marketplace",
};

const isActiveCompanyRequired = (err: unknown) => {
  if (!(err instanceof ApiError)) return false;
  if (err.status !== 400) return false;
  const data = err.data as { code?: string } | undefined;
  if (data?.code === "ACTIVE_COMPANY_REQUIRED") return true;
  return /no active company/i.test((err as Error).message);
};

// ── Guest sign-in nudge shown when guest tries company scope ──────────────────
const GuestCompanyBanner = ({ onDismiss }: { onDismiss: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
    style={{ background: "linear-gradient(135deg, #EEF6FF 0%, #F5F0FF 100%)", border: "1px solid rgba(124,58,237,0.2)" }}>
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: "#7C3AED", color: "#fff" }}>🔒</span>
      <div>
        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Sign in to view your catalog</p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
          Create an account or sign in to manage your own product listings and inventory.
        </p>
      </div>
    </div>
    <div className="flex flex-shrink-0 gap-2">
      <button type="button" onClick={onDismiss}
        className="rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-70"
        style={{ border: "1px solid var(--border)", color: "var(--medium-gray)" }}>
        Browse marketplace
      </button>
      <Link href="/signin"
        className="rounded-xl px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-80"
        style={{ backgroundColor: "#7C3AED" }}>
        Sign in
      </Link>
    </div>
  </motion.div>
);

// ── No active company banner for auth'd users without a company ───────────────
const NoCompanyBanner = ({ onBrowseMarketplace }: { onBrowseMarketplace: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
    style={{ background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.04) 100%)", border: "1px solid rgba(20,141,178,0.2)" }}>
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Pick a company to see your catalog</p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
          Use the company switcher in the sidebar — or browse the marketplace below.
        </p>
      </div>
    </div>
    <button type="button" onClick={onBrowseMarketplace}
      className="flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "var(--primary)" }}>
      Browse marketplace →
    </button>
  </motion.div>
);

// ── Main Container ─────────────────────────────────────────────────────────────

export const ProductsListContainer = () => {
  const { user } = useAuth();
  const dashCtx = useOptionalDashboardContext();
  const activeCompany = dashCtx?.activeCompany ?? null;
  const isGuest = !user;
  const router = useRouter();
  const toast = useToast();

  const [filters, setFilters] = useState<FiltersState>(isGuest ? guestInitialFilters : authInitialFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [needsCompany, setNeedsCompany] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(false);

  // When user's auth state resolves, reset filters if needed
  useEffect(() => {
    if (!isGuest && filters.scope === "marketplace") return;
    if (isGuest && filters.scope === "company") {
      setFilters((f) => ({ ...f, scope: "marketplace" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  const loadStats = useCallback(async () => {
    if (isGuest) { setStatsLoading(false); return; }
    try {
      setStatsLoading(true);
      const s = await productService.stats();
      setStats(s);
    } catch { setStats(null); }
    finally { setStatsLoading(false); }
  }, [isGuest]);

  const loadProducts = useCallback(
    async (mode: "fresh" | "more" = "fresh") => {
      const isFresh = mode === "fresh";
      try {
        if (isFresh) setLoading(true);
        else setLoadingMore(true);
        setError(null);
        setNeedsCompany(false);
        const nextOffset = isFresh ? 0 : offset + PAGE_SIZE;
        const res = await productService.list({
          limit: PAGE_SIZE,
          offset: nextOffset,
          search: filters.search || undefined,
          category: filters.category || undefined,
          status: filters.status || undefined,
          sort: filters.sort || undefined,
          scope: filters.scope,
          includeVariantSummary: true,
        });
        setProducts((prev) => (isFresh ? res.products : [...prev, ...res.products]));
        setTotal(res.pagination.total);
        setHasMore(res.pagination.hasMore);
        setOffset(nextOffset);
      } catch (err) {
        if (isActiveCompanyRequired(err) && filters.scope === "company") {
          setNeedsCompany(true);
          setProducts([]);
          setTotal(0);
          setHasMore(false);
        } else {
          setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.search, filters.category, filters.status, filters.sort, filters.scope]
  );

  useEffect(() => {
    setOffset(0);
    loadProducts("fresh");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.status, filters.sort, filters.scope]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleScopeChange = (next: FiltersState) => {
    if (next.scope === "company" && isGuest) {
      setShowGuestBanner(true);
      return;
    }
    setShowGuestBanner(false);
    setFilters(next);
  };

  const handleCreate = async (data: CreateProductInput, pendingImages: PendingImage[]) => {
    const product = await productService.create(data);
    // Upload images sequentially after product is created
    for (const img of pendingImages) {
      try {
        const base64 = img.dataUrl.includes(",") ? img.dataUrl.split(",")[1] : img.dataUrl;
        await productService.uploadImage(product._id, {
          fileName: img.file.name,
          mimeType: img.file.type || "image/jpeg",
          content: base64 ?? "",
        });
      } catch { /* non-fatal: product was created, image upload failed */ }
    }
    setDrawerOpen(false);
    setOffset(0);
    toast.success("Product created", `"${product.name}" is now in your catalog.`);
    await Promise.all([loadProducts("fresh"), loadStats()]);
  };

  return (
    <div className="space-y-8">
      {/* Hero: only show stats to logged-in users */}
      {!isGuest ? (
        <ProductsStatsHero
          stats={stats}
          loading={statsLoading}
          onCreate={() => setDrawerOpen(true)}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ background: "var(--gradient-brand-deep)" }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
          <p className="relative text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Marketplace</p>
          <h1 className="relative mt-1 text-2xl font-bold text-white md:text-3xl">Browse Products</h1>
          <p className="relative mt-1 text-sm text-white/70">
            Discover products from manufacturers across India.
          </p>
          <div className="relative mt-4 flex flex-wrap gap-2">
            <Link href="/signin"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              Sign in to manage your catalog →
            </Link>
          </div>
        </motion.div>
      )}

      {/* Quick nav — only for logged-in users */}
      {!isGuest && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-2">
          {[
            { href: "/dashboard/products/search", label: "Search Products", icon: "🔍", desc: "Find by name, SKU, category" },
            { href: "/dashboard/products/mine", label: "My Catalog", icon: "🏷️", desc: "Manage your listings" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)", boxShadow: "var(--shadow-sm)" }}>
              <span className="text-base">{item.icon}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{item.label}</p>
                <p className="text-[10px]" style={{ color: "var(--medium-gray)" }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      <div className="space-y-5">
        <ProductFilters
          value={filters}
          onChange={handleScopeChange}
          totalResults={total}
          isGuest={isGuest}
        />

        {showGuestBanner && (
          <GuestCompanyBanner onDismiss={() => { setShowGuestBanner(false); setFilters((f) => ({ ...f, scope: "marketplace" })); }} />
        )}

        {needsCompany && !showGuestBanner && (
          <NoCompanyBanner onBrowseMarketplace={() => setFilters((f) => ({ ...f, scope: "marketplace" }))} />
        )}

        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          onCreate={!isGuest ? () => setDrawerOpen(true) : undefined}
          onRetry={() => loadProducts("fresh")}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => loadProducts("more")}
          scope={filters.scope}
          hasFilters={Boolean(filters.search || filters.category || filters.status)}
          onClearFilters={() => setFilters({ ...filters, scope: filters.scope, search: "", category: "", status: "", sort: "" })}
          onSwitchToMarketplace={() => { setShowGuestBanner(false); setFilters((f) => ({ ...f, scope: "marketplace" })); }}
          companyName={activeCompany?.displayName}
          buyerView={filters.scope === "marketplace"}
        />
      </div>

      {!isGuest && (
        <ProductFormDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
};
