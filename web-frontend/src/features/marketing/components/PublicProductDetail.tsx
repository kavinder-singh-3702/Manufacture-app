"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "@/src/services/product";
import { startChatAndBuildHref } from "@/src/features/chat";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import { formatCurrency, getCategoryMeta, getCategoryHref, getBuyerStock, STOCK_STATUS_COLORS } from "@/src/features/product/utils/categories";
import { buildSpecRows, buildAdditionalInfoRows, buildCompanyRows, getMoq } from "@/src/features/product/utils/specs";
import { buildTrustBadges, formatCompanyLocation } from "@/src/features/product/utils/seller";
import { VariantSelector, type SelectedVariant } from "@/src/features/product/components/VariantSelector";
import { ProductInquiryForm } from "@/src/features/product/components/ProductInquiryForm";
import { QuoteRequestForm } from "@/src/features/product/components/QuoteRequestForm";
import { RelatedProducts } from "@/src/features/product/components/RelatedProducts";
import {
  PdpSection, SpecTable, ProductGallery, PriceBlock, TrustBadgeRow,
  SellerCard, RevealPhoneButton, SectionNav, InterestBand, ReviewsSection, StickyActionBar,
} from "@/src/features/product/components/pdp";
import { useAuth } from "@/src/hooks/useAuth";
import { useToast } from "@/src/components/ui/Toast";
import { useRouter } from "next/navigation";

// ── Auth gate toast ────────────────────────────────────────────────────────────
const AuthToast = ({ action, returnTo, onDismiss }: { action: string; returnTo: string; onDismiss: () => void }) => {
  const nextQ = `?next=${encodeURIComponent(returnTo)}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 16, x: "-50%" }}
      className="fixed bottom-6 left-1/2 z-50 w-[360px] overflow-hidden rounded-2xl shadow-2xl"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3 p-4">
        <span className="text-2xl flex-shrink-0">🔒</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Sign in to {action}</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
            Create a free account to contact sellers and track your inquiries.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href={`/signin${nextQ}`} className="inline-flex items-center rounded-xl px-4 py-2 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--primary)" }}>Sign in</Link>
            <Link href={`/signup${nextQ}`} className="inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>Register</Link>
          </div>
        </div>
        <button onClick={onDismiss} className="text-lg font-bold hover:opacity-60" style={{ color: "var(--medium-gray)" }}>✕</button>
      </div>
    </motion.div>
  );
};

// ── Main PublicProductDetail ──────────────────────────────────────────────────
export const PublicProductDetail = ({
  productId,
  initialProduct,
}: {
  productId: string;
  /** Server-rendered product (SSR/ISR) so the page paints instantly and is crawlable. */
  initialProduct?: Product;
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  // Where to send the user back after they sign in from a gated action.
  const returnTo = `/products/${productId}`;

  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [authToast, setAuthToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // When server data is present we still refresh on mount (silently) so volatile
  // fields like stock are current; otherwise we fetch with a full loading state.
  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const p = await productService.get(productId, { scope: "marketplace", includeVariantSummary: true });
      setProduct(p);
      setError(null);
    } catch (err) {
      if (!silent) setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load product");
    } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { load(Boolean(initialProduct)); }, [load, initialProduct]);

  const handleInquirySuccess = () => {
    setShowInquiry(false);
    setInquirySent(true);
    toast.success("Inquiry sent!", "The seller will contact you shortly.");
  };

  // Requesting a formal quote requires an authenticated buyer (backend POST
  // /quotes is auth-gated), so gate guests behind the sign-in toast.
  const handleRequestQuote = () => {
    if (!user) { setAuthToast("request a quote"); return; }
    setShowInquiry(false);
    setShowQuote(true);
  };

  const handleQuoteSuccess = () => {
    toast.success("Quote requested", "The seller will respond with pricing. Track it under your quotes.");
  };

  const handleChat = async () => {
    if (!user) { setAuthToast("chat with this seller"); return; }
    const sellerId = product?.createdBy;
    if (!sellerId) { toast.error("Chat unavailable", "Seller contact details not available."); return; }
    try {
      setChatLoading(true);
      // Previously discarded the conversationId and pushed a bare
      // /dashboard/chat, landing on whichever thread happened to load first
      // rather than this seller's (X5).
      const href = await startChatAndBuildHref(sellerId, product?._id);
      toast.info("Opening chat", "Navigating to your conversation…");
      router.push(href);
    } catch (err) {
      toast.error("Chat failed", err instanceof Error ? err.message : "Couldn't start conversation");
    } finally { setChatLoading(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: product?.name, url });
        return;
      } catch { /* user cancelled — fall through to clipboard */ }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    toast.success("Link copied!", "Share this product with anyone.");
    setTimeout(() => setCopied(false), 2500);
  };

  const openInquiry = () => {
    if (inquirySent) return;
    setShowQuote(false);
    setShowInquiry(true);
    document.getElementById("pdp-buy-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ── Derived display data (memoized so section components below don't recompute per render) ──
  const cat = product ? getCategoryMeta(product.category) : undefined;
  const specRows = useMemo(() => (product ? buildSpecRows(product) : []), [product]);
  const additionalInfoRows = useMemo(() => (product ? buildAdditionalInfoRows(product) : []), [product]);
  const companyRows = useMemo(() => buildCompanyRows(product?.company), [product]);
  const trustBadges = useMemo(() => buildTrustBadges(product?.company), [product]);
  const moq = product ? getMoq(product) : null;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-6 px-6 py-10 lg:px-10">
        <div className="h-8 w-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--light-gray)" }} />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="aspect-[4/3] animate-pulse rounded-3xl" style={{ backgroundColor: "var(--light-gray)" }} />
            <div className="grid gap-3 sm:grid-cols-2">
              {[1,2,3,4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--light-gray)" }} />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-3xl" style={{ backgroundColor: "var(--light-gray)" }} />
            <div className="h-32 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--light-gray)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-5xl">😕</div>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Product not found</p>
        <p className="text-sm" style={{ color: "var(--medium-gray)" }}>{error ?? "This product may have been removed."}</p>
        <Link href="/products" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--primary)" }}>← Browse products</Link>
      </div>
    );
  }

  const stockStatus = product.stockStatus ? STOCK_STATUS_COLORS[product.stockStatus] : null;
  const images = product.images ?? [];
  const sellerPhone = product.company?.contact?.phone;
  const allowChat = product.contactPreferences?.allowChat !== false && !!product.createdBy;
  const allowCall = product.contactPreferences?.allowCall !== false && !!sellerPhone;
  const hasVariants = (product.variantSummary?.totalVariants ?? 0) > 0;

  // Active price: variant price if one is selected, else product base price
  const activePrice = selectedVariant?.price ?? product.price;
  const activeStock = selectedVariant ? selectedVariant.variant.availableQuantity : product.availableQuantity;
  const activeUnit = activePrice?.unit ?? product.price.unit;
  // Buyer-facing stock: status only (no exact quantity). Buyers contact the
  // seller to ask about quantity & pricing — mirrors the app's public listing.
  const buyerStock = getBuyerStock(selectedVariant ? undefined : product.stockStatus, activeStock);

  const companyLocation = formatCompanyLocation(product.company);
  // ARVANN's own first-party catalog — a synthetic, hidden company, not a real seller.
  const isInhouseCatalog = product.createdByRole === "admin";

  // Anchor tabs — only sections that actually have content get a tab.
  const navItems = [
    { id: "pdp-details", label: "Product Details" },
    ...(companyRows.length > 0 || product.company?.description ? [{ id: "pdp-company", label: "Company Details" }] : []),
    { id: "pdp-reviews", label: "Reviews" }, // placeholder id retained even without data; ReviewsSection itself renders nothing
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 pb-24 lg:px-10 lg:pb-8">
      {/* Breadcrumb + Share */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/products" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
            Products
          </Link>
          {cat && (
            <>
              <span style={{ color: "var(--medium-gray)" }}>/</span>
              <Link href={getCategoryHref(product.category)}
                className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
                {cat.title}
              </Link>
            </>
          )}
          <span style={{ color: "var(--medium-gray)" }}>/</span>
          <span className="truncate max-w-[200px]" style={{ color: "var(--foreground)" }}>{product.name}</span>
        </nav>
        <motion.button type="button" onClick={handleShare}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
          style={{
            border: `1px solid ${copied ? "color-mix(in srgb, var(--success) 30%, transparent)" : "var(--border)"}`,
            backgroundColor: copied ? "color-mix(in srgb, var(--success) 13%, transparent)" : "var(--surface)",
            color: copied ? "var(--success)" : "var(--foreground)",
          }}>
          {copied ? "✓ Copied!" : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share
            </>
          )}
        </motion.button>
      </div>

      {/* ── Gallery | Buy box | Seller rail ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]">
          {/* Gallery — lg:h-full lets it stretch to match the buy box's height (grid row stretch) instead of leaving dead space below a short image frame */}
          <div className="lg:h-full">
            <ProductGallery
              images={images}
              productName={product.name}
              categoryMeta={cat}
              stockBadge={stockStatus ? { label: stockStatus.label, bg: stockStatus.bg, text: stockStatus.text } : null}
            />
          </div>

          {/* Buy box */}
          <motion.div id="pdp-buy-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-3xl p-5 sm:p-6"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
            <div>
              {cat && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide mb-2"
                  style={{ backgroundColor: cat.bg, color: cat.text }}>
                  {cat.icon} {cat.title}
                </span>
              )}
              <h1 className="text-xl font-bold leading-snug md:text-[22px]" style={{ color: "var(--foreground)" }}>{product.name}</h1>
              {product.company?.displayName && (
                <Link href={`/sellers/${encodeURIComponent(product.company._id)}`}
                  className="mt-1.5 inline-block text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--medium-gray)" }}>
                  by {product.company.displayName} →
                </Link>
              )}
            </div>

            <motion.div layout key={selectedVariant?.variant._id ?? "base"}>
              <PriceBlock
                amount={activePrice.amount}
                currency={activePrice.currency}
                unit={activeUnit}
                variantLabel={selectedVariant?.variant.name}
                fromHint={hasVariants && !selectedVariant && product.variantSummary?.minPrice != null
                  ? `Variants from ${formatCurrency(product.variantSummary.minPrice, product.variantSummary.currency ?? "INR")}`
                  : undefined}
                moq={moq}
              />
            </motion.div>

            {specRows.length > 0 && <SpecTable rows={specRows} twoColumn={false} collapseAfter={6} />}

            {hasVariants && (
              <div className="rounded-2xl p-4 space-y-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <VariantSelector productId={product._id} onSelect={setSelectedVariant} />
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: buyerStock.bg, border: `1px solid ${buyerStock.border}` }}>
              <span className="leading-none">{buyerStock.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: buyerStock.fg }}>{buyerStock.label}</p>
                <p className="text-[11px] leading-snug" style={{ color: "var(--medium-gray)" }}>{buyerStock.hint}</p>
              </div>
            </div>

            <AnimatePresence>
              {inquirySent && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl p-4 text-center"
                  style={{ backgroundColor: "color-mix(in srgb, var(--success) 13%, transparent)", border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)" }}>
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-sm font-bold" style={{ color: "var(--success)" }}>Inquiry sent!</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>The seller will contact you soon.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!inquirySent && (
              <div className="space-y-3">
                {showQuote ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <QuoteRequestForm product={product} selectedVariant={selectedVariant} user={user} onSuccess={handleQuoteSuccess} onCancel={() => setShowQuote(false)} />
                  </motion.div>
                ) : (
                  <>
                    {!showInquiry ? (
                      <button type="button" onClick={openInquiry}
                        className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>⚡</span>
                        <div>
                          <p className="text-sm font-bold text-left">{buyerStock.available ? "Get Best Price" : "Ask about availability"}</p>
                          <p className="text-xs opacity-75 text-left">
                            {selectedVariant ? `For: ${selectedVariant.variant.name}` : buyerStock.available ? "Get quantity, pricing & delivery info" : "Request quantity & restocking details"}
                          </p>
                        </div>
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <ProductInquiryForm product={product} selectedVariant={selectedVariant} user={user} onSuccess={handleInquirySuccess} onCancel={() => setShowInquiry(false)} />
                      </motion.div>
                    )}

                    {!showInquiry && (
                      <button type="button" onClick={handleRequestQuote}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-opacity hover:opacity-80"
                        style={{ border: "1.5px solid var(--accent)", color: "var(--accent-dark)", backgroundColor: "var(--accent-light)" }}>
                        📞 Request Callback
                      </button>
                    )}

                    {!showInquiry && allowChat && (
                      <button type="button" onClick={handleChat} disabled={chatLoading}
                        className="flex w-full items-center gap-2 justify-center rounded-2xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ backgroundColor: "#16A34A" }}>
                        {chatLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" /> : "💬"}
                        Chat with Supplier
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Seller rail (sticky on lg+, band on mobile) ───────────────────── */}
        <div>
          <div className="space-y-4 lg:sticky lg:top-20">
            {isInhouseCatalog ? (
              // ARVANN's own catalog isn't a third-party seller — no seller
              // card, phone reveal or profile link for a synthetic company.
              <div className="rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)" }}>
                📦 Sold directly by ARVANN
              </div>
            ) : product.company?.displayName && (
              <SellerCard
                companyId={product.company._id}
                displayName={product.company.displayName}
                logoUrl={product.company.logoUrl}
                location={companyLocation || undefined}
                variant="rail">
                <TrustBadgeRow badges={trustBadges} />
                {allowCall && sellerPhone && (
                  <RevealPhoneButton phone={sellerPhone} isAuthed={!!user} onRequireAuth={() => setAuthToast("call this seller")} />
                )}
                <Link href={`/sellers/${encodeURIComponent(product.company._id)}`}
                  className="block w-full rounded-xl py-2.5 text-center text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ border: "1px solid var(--primary)", color: "var(--primary)" }}>
                  View Seller Profile
                </Link>
              </SellerCard>
            )}

            {!user && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="rounded-2xl p-4 text-center"
                style={{ border: "1px solid color-mix(in srgb, var(--primary) 22%, transparent)", background: "linear-gradient(135deg, var(--primary-light) 0%, color-mix(in srgb, var(--primary) 6%, transparent) 100%)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--primary-dark)" }}>
                  Sign in for faster checkout, order tracking & verified seller access
                </p>
                <div className="mt-2 flex gap-2 justify-center">
                  <Link href={`/signin?next=${encodeURIComponent(returnTo)}`} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>Sign in</Link>
                  <Link href={`/signup?next=${encodeURIComponent(returnTo)}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)", color: "var(--primary-dark)" }}>Register free</Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Anchor tabs ──────────────────────────────────────────────────────── */}
      <div className="mt-8">
        <SectionNav items={navItems} />
      </div>

      {/* ── Product Details ─────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-6">
        <PdpSection id="pdp-details" icon="📋" title="Product Details">
          <div className="space-y-5">
            {product.description && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{product.description}</p>
            )}
            {additionalInfoRows.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Additional Information</p>
                <SpecTable rows={additionalInfoRows} />
              </div>
            )}
            {specRows.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Specifications</p>
                <SpecTable rows={specRows} collapseAfter={8} />
              </div>
            )}
          </div>
        </PdpSection>

        {/* ── Interest band ────────────────────────────────────────────────── */}
        {!inquirySent && (
          <InterestBand
            title="Interested in this product?"
            subtitle="Get the best price directly from the seller"
            primaryLabel="Get Best Price"
            onPrimary={openInquiry}
            secondaryLabel="Request Callback"
            onSecondary={handleRequestQuote}
          />
        )}

        {/* ── Company Details ─────────────────────────────────────────────── */}
        {(companyRows.length > 0 || product.company?.description) && (
          <PdpSection id="pdp-company" icon="🏭" title="Company Details">
            <div className="space-y-5">
              {product.company?.description && (
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>About the Company</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{product.company.description}</p>
                </div>
              )}
              {companyRows.length > 0 && <SpecTable rows={companyRows} />}
            </div>
          </PdpSection>
        )}

        {/* ── Reviews (renders nothing until a review model exists) ────────── */}
        <div id="pdp-reviews">
          <ReviewsSection aggregate={null} />
        </div>
      </div>

      {/* Related products */}
      <div className="mt-12">
        <RelatedProducts
          productId={product._id}
          companyId={product.company?._id}
          companyName={product.company?.displayName}
          category={product.category}
          routePrefix="/products"
        />
      </div>

      {/* Mobile sticky action bar */}
      {!inquirySent && (
        <div className="lg:hidden">
          <StickyActionBar amount={activePrice.amount} currency={activePrice.currency} unit={activeUnit} primaryLabel="Get Best Price" onPrimary={openInquiry} />
        </div>
      )}

      {/* Auth gate toast */}
      <AnimatePresence>
        {authToast && <AuthToast action={authToast} returnTo={returnTo} onDismiss={() => setAuthToast(null)} />}
      </AnimatePresence>
    </div>
  );
};
