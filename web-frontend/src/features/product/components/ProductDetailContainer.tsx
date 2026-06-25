"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { productService } from "@/src/services/product";
import { chatService } from "@/src/services/chat";
import { ApiError } from "@/src/lib/api-error";
import type { CreateProductInput, Product } from "@/src/types/product";
import { useToast } from "@/src/components/ui/Toast";
import type { PendingImage } from "./ProductImageUploader";
import { formatCurrency, getBuyerStock, getCategoryMeta, STATUS_COLORS, STOCK_STATUS_COLORS } from "../utils/categories";
import { ProductFormDrawer } from "./ProductFormDrawer";
import { ProductVariantsContainer } from "./ProductVariantsContainer";
import { ProductInquiryDrawer } from "./ProductInquiryDrawer";
import { VariantSelector, type SelectedVariant } from "./VariantSelector";
import { useAuth } from "@/src/hooks/useAuth";
import { useOptionalDashboardContext } from "@/src/features/dashboard/components/user-dashboard/context";

// ── Contact action button ─────────────────────────────────────────────────────

type ContactButtonProps = {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant?: "primary" | "outline" | "green" | "orange";
  disabled?: boolean;
  loading?: boolean;
};

const ContactButton = ({ icon, label, sublabel, onClick, variant = "outline", disabled, loading }: ContactButtonProps) => {
  const styles: Record<string, { bg: string; color: string; border?: string }> = {
    primary: { bg: "var(--primary)", color: "#fff" },
    green:   { bg: "#16A34A",        color: "#fff" },
    orange:  { bg: "#EA580C",        color: "#fff" },
    outline: { bg: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" },
  };
  const s = styles[variant];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className="flex flex-1 items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-opacity disabled:opacity-50"
      style={{ backgroundColor: s.bg, color: s.color, border: s.border ?? "none" }}
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
        ) : icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {sublabel && <p className="text-[11px] opacity-75">{sublabel}</p>}
      </div>
    </motion.button>
  );
};

// ── Auth gate toast ───────────────────────────────────────────────────────────

const AuthToast = ({ returnTo, onDismiss }: { returnTo: string; onDismiss: () => void }) => {
  const nextQ = `?next=${encodeURIComponent(returnTo)}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      className="fixed bottom-6 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl p-4 shadow-2xl"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Sign in to contact the seller</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
            Create a free account to chat, call or send inquiries.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href={`/signin${nextQ}`}
              className="inline-flex items-center rounded-xl px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--primary)" }}>
              Sign in
            </Link>
            <Link href={`/signup${nextQ}`}
              className="inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
              Create account
            </Link>
          </div>
        </div>
        <button onClick={onDismiss} className="flex-shrink-0 text-lg font-bold hover:opacity-60" style={{ color: "var(--medium-gray)" }}>✕</button>
      </div>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const ProductDetailContainer = ({ productId }: { productId: string }) => {
  const router = useRouter();
  const { user } = useAuth();
  const dashCtx = useOptionalDashboardContext();
  const activeCompany = dashCtx?.activeCompany ?? null;

  const isGuest = !user;
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirm" | "deleting">("idle");
  const [activeImage, setActiveImage] = useState(0);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const p = await productService.get(productId, { includeVariantSummary: true });
      setProduct(p);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load product");
    } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const handleAdjustQty = async (delta: number) => {
    if (!product) return;
    try {
      setAdjusting(true);
      const updated = await productService.adjustQuantity(product._id, delta);
      setProduct(updated);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Couldn't adjust quantity");
    } finally { setAdjusting(false); }
  };

  const handleSave = async (data: CreateProductInput, pendingImages: PendingImage[]) => {
    if (!product) return;
    const updated = await productService.update(product._id, data);
    for (const img of pendingImages) {
      try {
        const base64 = img.dataUrl.includes(",") ? img.dataUrl.split(",")[1] : img.dataUrl;
        await productService.uploadImage(product._id, {
          fileName: img.file.name,
          mimeType: img.file.type || "image/jpeg",
          content: base64 ?? "",
        });
      } catch { /* non-fatal */ }
    }
    setProduct(updated);
    setEditOpen(false);
    toast.success("Product saved", "Your changes have been applied.");
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      setDeleteState("deleting");
      await productService.remove(product._id);
      router.push("/dashboard/products");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Couldn't delete");
      setDeleteState("idle");
    }
  };

  const handleChat = async () => {
    if (isGuest) { setShowAuthToast(true); return; }
    if (!product) return;
    const sellerId = product.createdBy;
    if (!sellerId) { setChatError("Seller contact not available."); return; }
    try {
      setChatLoading(true); setChatError(null);
      await chatService.startConversation(sellerId);
      toast.success("Chat started", "Opening your conversation with the seller.");
      router.push("/dashboard/chat");
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "Couldn't start chat";
      setChatError(msg);
      toast.error("Chat failed", msg);
    } finally { setChatLoading(false); }
  };

  const handleCall = () => {
    if (isGuest) { setShowAuthToast(true); return; }
    const phone = product?.company?.contact?.phone;
    if (!phone) { setChatError("Seller phone number not available."); return; }
    window.open(`tel:${phone.replace(/[^\d+]/g, "")}`, "_self");
  };

  // Inquiry is a lead form (open to guests, mirrors the public marketplace).
  // Only direct contact — chat & call — requires sign-in.
  const handleInquiry = () => setInquiryOpen(true);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-3xl" style={{ backgroundColor: "var(--light-gray)" }} />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--light-gray)" }} />)}
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Product not found</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>{error ?? "It may have been deleted."}</p>
        <Link href="/dashboard/products"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
          ← Back to products
        </Link>
      </div>
    );
  }

  const cat = getCategoryMeta(product.category);
  const status = STATUS_COLORS[product.status] ?? STATUS_COLORS.draft;
  const stockStatus = product.stockStatus ? STOCK_STATUS_COLORS[product.stockStatus] : null;
  const images = product.images ?? [];
  const cover = images[activeImage]?.url ?? images[0]?.url;

  const canEdit = Boolean(
    !isGuest &&
    activeCompany &&
    product.company?._id &&
    product.company._id === activeCompany.id
  );

  const isOwnProduct = canEdit;
  const sellerPhone = product.company?.contact?.phone;
  const allowChat = product.contactPreferences?.allowChat !== false && !isOwnProduct;
  const allowCall = product.contactPreferences?.allowCall !== false && !!sellerPhone && !isOwnProduct;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/products" className="font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
          Products
        </Link>
        <span style={{ color: "var(--medium-gray)" }}>/</span>
        <span style={{ color: "var(--foreground)" }}>{product.name}</span>
      </motion.div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="grid gap-6 overflow-hidden rounded-3xl p-5 lg:grid-cols-[420px_1fr] lg:p-7"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>

        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl"
            style={{ background: cat ? `linear-gradient(135deg, ${cat.bg} 0%, ${cat.bg}cc 100%)` : "var(--background)" }}>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">{cat?.icon ?? "📦"}</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={img.url || i} type="button" onClick={() => setActiveImage(i)}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all"
                  style={{ border: i === activeImage ? "2px solid var(--primary)" : "1px solid var(--border)" }}>
                  {img.url && <img src={img.url} alt="" className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {/* Name + badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              {cat && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: cat.bg, color: cat.text }}>
                  <span>{cat.icon}</span>
                  {cat.title}{product.subCategory ? ` · ${product.subCategory}` : ""}
                </span>
              )}
              <h1 className="text-2xl font-bold leading-tight md:text-3xl" style={{ color: "var(--foreground)" }}>
                {product.name}
              </h1>
              {product.sku && <p className="text-xs font-mono" style={{ color: "var(--medium-gray)" }}>SKU · {product.sku}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{ backgroundColor: status.bg, color: status.text }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                {status.label}
              </span>
              {stockStatus && (
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold"
                  style={{ backgroundColor: stockStatus.bg, color: stockStatus.text }}>
                  {stockStatus.label}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, var(--primary-light) 0%, rgba(20,141,178,0.05) 100%)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>Price</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                {formatCurrency(product.price.amount, product.price.currency)}
              </span>
              {product.price.unit && (
                <span className="text-sm" style={{ color: "var(--medium-gray)" }}>/ {product.price.unit}</span>
              )}
            </div>
          </div>

          {/* Stock (shown for owners; hidden from guests to avoid showing internal data) */}
          {canEdit && (
            <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>Available</p>
                  <p className="mt-0.5 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                    {product.availableQuantity.toLocaleString("en-IN")}
                    {product.unit && <span className="ml-1 text-base font-medium" style={{ color: "var(--medium-gray)" }}>{product.unit}</span>}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--medium-gray)" }}>Reorder at {product.minStockQuantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleAdjustQty(-1)}
                    disabled={adjusting || product.availableQuantity <= 0}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold disabled:opacity-40"
                    style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>−</button>
                  <button type="button" onClick={() => handleAdjustQty(1)} disabled={adjusting}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--primary)" }}>+</button>
                </div>
              </div>
            </div>
          )}

          {/* Seller info for non-owners */}
          {!isOwnProduct && product.company?.displayName && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                {product.company.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{product.company.displayName}</p>
                <p className="text-[10px]" style={{ color: "var(--medium-gray)" }}>Seller</p>
              </div>
            </div>
          )}

          {/* ── Action buttons ──────────────────────────────────────────────────── */}
          {canEdit ? (
            // Owner actions
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--primary)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4h-7v16h16v-7M19 4l-9 9M14 4h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Edit product
              </button>
              <button type="button" onClick={() => setDeleteState("confirm")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delete
              </button>
            </div>
          ) : (
            // Buyer / guest contact actions
            <div className="space-y-3">
              {/* Variant selector for buyers */}
              {(product.variantSummary?.totalVariants ?? 0) > 0 && (
                <div className="rounded-2xl p-4"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                  <VariantSelector
                    productId={product._id}
                    onSelect={(sel) => setSelectedVariant(sel)}
                  />
                </div>
              )}

              {/* Primary: Inquire to buy */}
              <button type="button" onClick={handleInquiry}
                className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  💬
                </span>
                <div>
                  <p className="text-sm font-bold">Inquire to buy</p>
                  <p className="text-xs opacity-75">Ask for pricing, MOQ, delivery terms</p>
                </div>
              </button>

              {/* Secondary: Chat + Call side by side */}
              <div className="flex gap-2">
                {allowChat && (
                  <ContactButton
                    icon="💬"
                    label="Chat seller"
                    sublabel={isGuest ? "Sign in to chat" : "Start conversation"}
                    onClick={handleChat}
                    variant="green"
                    loading={chatLoading}
                  />
                )}
                {allowCall && (
                  <ContactButton
                    icon="📞"
                    label="Call seller"
                    sublabel={isGuest ? "Sign in to call" : sellerPhone}
                    onClick={handleCall}
                    variant="orange"
                  />
                )}
              </div>

              {chatError && (
                <p className="rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                  {chatError}
                </p>
              )}

              {/* Availability row — status only; buyers contact for exact quantity */}
              {(() => {
                const s = getBuyerStock(
                  selectedVariant ? undefined : product.stockStatus,
                  selectedVariant ? selectedVariant.variant.availableQuantity : product.availableQuantity
                );
                return (
                  <div className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
                    <span className="text-base leading-none">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold" style={{ color: s.fg }}>{s.label}</p>
                      <p className="text-[11px] leading-snug" style={{ color: "var(--medium-gray)" }}>{s.hint}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </motion.div>

      {/* Description */}
      {product.description && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl p-6"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>Description</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {product.description}
          </p>
        </motion.div>
      )}

      {/* Meta grid */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Visibility",    value: product.visibility },
          { label: "Created",       value: new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
          { label: "Last updated",  value: new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
          { label: "Currency",      value: product.price.currency },
          { label: "Variants",      value: product.variantSummary?.totalVariants ?? 0 },
          { label: "Company",       value: product.company?.displayName ?? "—" },
        ].map((row) => (
          <div key={row.label} className="rounded-2xl p-4"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--medium-gray)" }}>{row.label}</p>
            <p className="mt-1.5 text-sm font-semibold capitalize" style={{ color: "var(--foreground)" }}>{String(row.value)}</p>
          </div>
        ))}
      </motion.div>

      {/* Variants */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl p-6"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <ProductVariantsContainer productId={product._id} canEdit={canEdit} />
      </motion.div>

      {/* Drawers */}
      {canEdit && (
        <ProductFormDrawer open={editOpen} product={product} onClose={() => setEditOpen(false)} onSubmit={handleSave} />
      )}
      {!isOwnProduct && (
        <ProductInquiryDrawer
          open={inquiryOpen}
          product={product}
          user={user ?? undefined}
          selectedVariant={selectedVariant}
          onClose={() => setInquiryOpen(false)}
        />
      )}

      {/* Delete confirm */}
      {deleteState !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="m12 3 9 16H3l9-16zm0 6v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-bold" style={{ color: "var(--foreground)" }}>Delete this product?</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
              <strong style={{ color: "var(--foreground)" }}>{product.name}</strong> will be removed. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteState("idle")} disabled={deleteState === "deleting"}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleteState === "deleting"}
                className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--accent)" }}>
                {deleteState === "deleting" ? "Deleting…" : "Delete product"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Auth toast */}
      <AnimatePresence>
        {showAuthToast && <AuthToast returnTo={`/dashboard/products/detail?productId=${productId}`} onDismiss={() => setShowAuthToast(false)} />}
      </AnimatePresence>
    </div>
  );
};
