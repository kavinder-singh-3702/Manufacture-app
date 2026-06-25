"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "@/src/services/product";
import { chatService } from "@/src/services/chat";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import { formatCurrency, getCategoryMeta, getBuyerStock, STOCK_STATUS_COLORS } from "@/src/features/product/utils/categories";
import { VariantSelector, type SelectedVariant } from "@/src/features/product/components/VariantSelector";
import { ProductInquiryForm } from "@/src/features/product/components/ProductInquiryForm";
import { RelatedProducts } from "@/src/features/product/components/RelatedProducts";
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

// InquiryForm extracted to src/features/product/components/ProductInquiryForm.tsx

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
  const [activeImage, setActiveImage] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
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

  const handleChat = async () => {
    if (!user) { setAuthToast("chat with this seller"); return; }
    const sellerId = product?.createdBy;
    if (!sellerId) { toast.error("Chat unavailable", "Seller contact details not available."); return; }
    try {
      setChatLoading(true);
      await chatService.startConversation(sellerId);
      toast.info("Opening chat", "Navigating to your conversation…");
      router.push("/dashboard/chat");
    } catch (err) {
      toast.error("Chat failed", err instanceof Error ? err.message : "Couldn't start conversation");
    } finally { setChatLoading(false); }
  };

  const handleCall = () => {
    if (!user) { setAuthToast("call this seller"); return; }
    const phone = product?.company?.contact?.phone;
    if (!phone) { toast.error("Call unavailable", "Seller phone number is not available."); return; }
    window.open(`tel:${phone.replace(/[^\d+]/g, "")}`, "_self");
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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6 px-6 py-10 lg:px-10">
        <div className="h-8 w-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--light-gray)" }} />
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div className="aspect-[16/9] animate-pulse rounded-3xl" style={{ backgroundColor: "var(--light-gray)" }} />
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

  const cat = getCategoryMeta(product.category);
  const stockStatus = product.stockStatus ? STOCK_STATUS_COLORS[product.stockStatus] : null;
  const images = product.images ?? [];
  const cover = images[activeImage]?.url ?? images[0]?.url;
  const sellerPhone = product.company?.contact?.phone;
  const allowChat = product.contactPreferences?.allowChat !== false && !!product.createdBy;
  const allowCall = product.contactPreferences?.allowCall !== false && !!sellerPhone;
  const hasVariants = (product.variantSummary?.totalVariants ?? 0) > 0;

  // Active price: variant price if one is selected, else product base price
  const activePrice = selectedVariant?.price ?? product.price;
  const activeStock = selectedVariant
    ? selectedVariant.variant.availableQuantity
    : product.availableQuantity;
  const activeUnit = activePrice?.unit ?? product.price.unit;
  // Buyer-facing stock: status only (no exact quantity). Buyers contact the
  // seller to ask about quantity & pricing — mirrors the app's public listing.
  const buyerStock = getBuyerStock(
    selectedVariant ? undefined : product.stockStatus,
    activeStock
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-10">
      {/* Breadcrumb + Share */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/products" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
            Products
          </Link>
          {cat && (
            <>
              <span style={{ color: "var(--medium-gray)" }}>/</span>
              <Link href={`/products/category/${product.category}`}
                className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
                {cat.title}
              </Link>
            </>
          )}
          <span style={{ color: "var(--medium-gray)" }}>/</span>
          <span className="truncate max-w-[200px]" style={{ color: "var(--foreground)" }}>{product.name}</span>
        </nav>
        {/* Share button */}
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

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* ── Left: gallery + details ───────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Gallery */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <div className="relative overflow-hidden"
              style={{
                background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--light-gray)",
                aspectRatio: images.length > 0 ? "16/9" : "4/3",
              }}>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" decoding="async" src={cover} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-8xl min-h-[280px]">
                  {cat?.icon ?? "📦"}
                </div>
              )}
              {stockStatus && (
                <div className="absolute bottom-4 right-4">
                  <span className="rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm"
                    style={{ backgroundColor: stockStatus.bg, color: stockStatus.text }}>
                    {stockStatus.label}
                  </span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={img.url ?? i} type="button" onClick={() => setActiveImage(i)}
                    className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl transition-all"
                    style={{ border: i === activeImage ? "2px solid var(--primary)" : "1px solid var(--border)" }}>
                    {img.url && <img loading="lazy" decoding="async" src={img.url} alt="" className="h-full w-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Description */}
          {product.description && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="rounded-2xl p-6"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "var(--primary)" }}>Description</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {product.description}
              </p>
            </motion.div>
          )}

          {/* Specs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Category",    value: cat?.title ?? product.category },
              { label: "Sub-category", value: product.subCategory ?? "—" },
              { label: "SKU",          value: product.sku ?? "—" },
              { label: "Unit",         value: product.unit ?? "—" },
              { label: "Variants",     value: hasVariants ? `${product.variantSummary!.totalVariants} options` : "Base product" },
              { label: "Company",      value: product.company?.displayName ?? "—" },
            ].map((row) => (
              <div key={row.label} className="rounded-2xl p-4"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>{row.label}</p>
                <p className="mt-1.5 text-sm font-semibold capitalize truncate" style={{ color: "var(--foreground)" }}>{String(row.value)}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: sticky sidebar ─────────────────────────────────────────── */}
        <div>
          <div className="sticky top-20 space-y-4">
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              className="space-y-5 rounded-3xl p-6"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>

              {/* Name + seller */}
              <div>
                {cat && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide mb-2"
                    style={{ backgroundColor: cat.bg, color: cat.text }}>
                    {cat.icon} {cat.title}
                  </span>
                )}
                <h1 className="text-xl font-bold leading-snug" style={{ color: "var(--foreground)" }}>{product.name}</h1>
                {product.company?.displayName && (
                  <Link href={`/sellers/${encodeURIComponent(product.company._id)}`}
                    className="mt-2 flex items-center gap-2 transition-opacity hover:opacity-70">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: "var(--primary)" }}>
                      {product.company.displayName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>
                      by {product.company.displayName} →
                    </p>
                  </Link>
                )}
              </div>

              {/* Price — updates when variant is selected */}
              <motion.div layout key={selectedVariant?.variant._id ?? "base"}
                className="rounded-2xl p-4"
                style={{ background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.05) 100%)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: "var(--primary)" }}>
                  Price {selectedVariant && <span className="normal-case font-normal">· {selectedVariant.variant.name}</span>}
                </p>
                <motion.div layout className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black" style={{ color: "var(--foreground)" }}>
                    {formatCurrency(activePrice.amount, activePrice.currency)}
                  </span>
                  {activeUnit && (
                    <span className="text-sm" style={{ color: "var(--medium-gray)" }}>/ {activeUnit}</span>
                  )}
                </motion.div>
                {hasVariants && !selectedVariant && product.variantSummary?.minPrice != null && (
                  <p className="mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>
                    Variants from {formatCurrency(product.variantSummary.minPrice, product.variantSummary.currency ?? "INR")}
                  </p>
                )}
              </motion.div>

              {/* Variants selector */}
              {hasVariants && (
                <div className="rounded-2xl p-4 space-y-3"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <VariantSelector
                    productId={product._id}
                    onSelect={(sel) => setSelectedVariant(sel)}
                  />
                </div>
              )}

              {/* Availability — status only; buyers contact for exact quantity */}
              <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: buyerStock.bg, border: `1px solid ${buyerStock.border}` }}>
                <span className="leading-none">{buyerStock.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: buyerStock.fg }}>
                    {buyerStock.label}
                  </p>
                  <p className="text-[11px] leading-snug" style={{ color: "var(--medium-gray)" }}>
                    {buyerStock.hint}
                  </p>
                </div>
              </div>

              {/* Inquiry sent confirmation */}
              <AnimatePresence>
                {inquirySent && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="rounded-2xl p-4 text-center"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--success) 13%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                    }}>
                    <p className="text-2xl mb-1">✅</p>
                    <p className="text-sm font-bold" style={{ color: "var(--success)" }}>Inquiry sent!</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>
                      The seller will contact you soon.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              {!inquirySent && (
                <div className="space-y-3">
                  {/* Primary: Inquire */}
                  {!showInquiry ? (
                    <button type="button" onClick={() => setShowInquiry(true)}
                      className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "var(--primary)", boxShadow: "0 6px 20px rgba(20,141,178,0.35)" }}>
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>💬</span>
                      <div>
                        <p className="text-sm font-bold text-left">
                          {buyerStock.available ? "Inquire to buy" : "Ask about availability"}
                        </p>
                        <p className="text-xs opacity-75 text-left">
                          {selectedVariant
                            ? `For: ${selectedVariant.variant.name}`
                            : buyerStock.available
                              ? "Get quantity, pricing & delivery info"
                              : "Request quantity & restocking details"}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <ProductInquiryForm
                        product={product}
                        selectedVariant={selectedVariant}
                        user={user}
                        onSuccess={handleInquirySuccess}
                        onCancel={() => setShowInquiry(false)}
                      />
                    </motion.div>
                  )}

                  {/* Secondary: Chat + Call */}
                  {!showInquiry && (
                    <div className="flex gap-2">
                      {allowChat && (
                        <button type="button" onClick={handleChat} disabled={chatLoading}
                          className="flex flex-1 items-center gap-2 justify-center rounded-2xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ backgroundColor: "#16A34A" }}>
                          {chatLoading
                            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
                            : "💬"
                          }
                          Chat
                        </button>
                      )}
                      {allowCall && (
                        <button type="button" onClick={handleCall}
                          className="flex flex-1 items-center gap-2 justify-center rounded-2xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
                          style={{ backgroundColor: "#EA580C" }}>
                          📞 Call
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Sign-in nudge for guests */}
            {!user && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="rounded-2xl p-4 text-center"
                style={{
                  border: "1px solid color-mix(in srgb, var(--primary) 22%, transparent)",
                  background: "linear-gradient(135deg, var(--primary-light) 0%, color-mix(in srgb, var(--primary) 6%, transparent) 100%)",
                }}>
                <p className="text-xs font-semibold" style={{ color: "var(--primary-dark)" }}>
                  Sign in for faster checkout, order tracking & verified seller access
                </p>
                <div className="mt-2 flex gap-2 justify-center">
                  <Link href={`/signin?next=${encodeURIComponent(returnTo)}`} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--primary)" }}>Sign in</Link>
                  <Link href={`/signup?next=${encodeURIComponent(returnTo)}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)", color: "var(--primary-dark)" }}>Register free</Link>
                </div>
              </motion.div>
            )}
          </div>
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

      {/* Auth gate toast */}
      <AnimatePresence>
        {authToast && <AuthToast action={authToast} returnTo={returnTo} onDismiss={() => setAuthToast(null)} />}
      </AnimatePresence>
    </div>
  );
};
