"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/src/providers/CartProvider";
import { useDashboardContext } from "@/src/features/dashboard/components/user-dashboard/context";
import { checkoutService } from "@/src/services/checkout";
import { ApiError } from "@/src/lib/api-error";
import { useRazorpay } from "@/src/hooks/useRazorpay";
import { AddressForm, emptyAddress, validateAddress } from "./AddressForm";
import { CartSummary } from "@/src/features/cart/components/CartSummary";
import { CartItemRow } from "@/src/features/cart/components/CartItemRow";
import type { CheckoutAddressInput } from "@/src/types/cart";

type CheckoutStep = "address" | "payment" | "processing";

const STEP_LABELS: Record<CheckoutStep, string> = {
  address: "Shipping address",
  payment: "Review & pay",
  processing: "Processing",
};

export const CheckoutContainer = () => {
  const router = useRouter();
  const { items, eligibleItems, totalValue, removeManyFromCart } = useCart();
  const { user } = useDashboardContext();
  const { openCheckout } = useRazorpay();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [address, setAddress] = useState<CheckoutAddressInput>(emptyAddress);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof CheckoutAddressInput, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Pre-fill address from user if available
  useEffect(() => {
    if (user.address) {
      setAddress({
        line1: user.address.line1 ?? "",
        line2: user.address.line2 ?? "",
        city: user.address.city ?? "",
        state: user.address.state ?? "",
        postalCode: user.address.postalCode ?? "",
        country: user.address.country ?? "India",
      });
    }
  }, [user]);

  const eligibleValue = useMemo(
    () => eligibleItems.reduce((s, i) => s + (i.variant?.price?.amount ?? i.product.price.amount) * i.quantity, 0),
    [eligibleItems]
  );

  const handleAddressContinue = () => {
    const errs = validateAddress(address);
    if (Object.keys(errs).length > 0) { setAddressErrors(errs); return; }
    setAddressErrors({});
    setStep("payment");
  };

  const handlePay = async () => {
    if (eligibleItems.length === 0) { setError("No items available for checkout."); return; }
    setError(null);
    setProcessing(true);
    setStep("processing");

    try {
      // 1. Create checkout intent
      const intent = await checkoutService.createCheckoutIntent({
        source: "cart",
        lines: eligibleItems.map((item) => ({
          lineKey: item.lineKey,
          productId: item.product._id,
          variantId: item.variant?.id,
          quantity: item.quantity,
          productName: item.product.name,
          unitPrice: item.variant?.price?.amount ?? item.product.price.amount,
          currency: "INR",
        })),
        shippingAddress: address,
        clientRequestId: `web-${Date.now()}`,
      });

      // 2. Open Razorpay
      await openCheckout({
        keyId: intent.payment.keyId,
        orderId: intent.payment.razorpayOrderId,
        amount: intent.payment.amount,
        currency: intent.payment.currency,
        name: "ARVANN",
        description: `Order ${intent.order._id.slice(-8).toUpperCase()}`,
        prefill: {
          name: user.displayName ?? undefined,
          email: user.email,
          contact: user.phone ?? undefined,
        },
        onSuccess: async (response) => {
          try {
            const verification = await checkoutService.verifyPayment({
              orderId: intent.order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            removeManyFromCart(eligibleItems.map((i) => i.lineKey));

            const dest = verification.success
              ? `/dashboard/orders/confirmation?orderId=${verification.orderId ?? intent.order._id}&success=true&paymentId=${response.razorpay_payment_id}&amount=${eligibleValue}`
              : `/dashboard/orders/confirmation?orderId=${intent.order._id}&success=false&message=${encodeURIComponent(verification.message ?? "Payment could not be verified")}`;

            router.push(dest);
          } catch (err) {
            const msg = err instanceof ApiError || err instanceof Error ? err.message : "Verification failed";
            router.push(`/dashboard/orders/confirmation?orderId=${intent.order._id}&success=false&message=${encodeURIComponent(msg)}`);
          }
        },
        onDismiss: () => {
          setProcessing(false);
          setStep("payment");
          setError("Payment was cancelled. You can try again.");
        },
      });
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "Checkout failed";
      setError(msg);
      setProcessing(false);
      setStep("payment");
    }
  };

  // Empty cart redirect
  if (items.length === 0 && !processing) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl" style={{ backgroundColor: "var(--primary-light)" }}>🛒</div>
        <div className="space-y-1">
          <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Your cart is empty</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>Add products before checking out.</p>
        </div>
        <Link href="/dashboard/products"
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--medium-gray)" }}>
          <Link href="/dashboard/products" className="transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>Products</Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)" }}>Checkout</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Checkout</h1>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {(["address", "payment"] as CheckoutStep[]).map((s, i) => {
          const done = s === "address" && step !== "address";
          const active = step === s || (step === "processing" && s === "payment");
          return (
            <div key={s} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={{ backgroundColor: done || active ? "var(--primary)" : "var(--border)", color: done || active ? "#fff" : "var(--medium-gray)" }}>
                  {done ? "✓" : i + 1}
                </div>
                <span className="text-xs font-semibold"
                  style={{ color: active ? "var(--primary)" : done ? "var(--foreground)" : "var(--medium-gray)" }}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i === 0 && <div className="mx-3 flex-1 h-px" style={{ backgroundColor: done ? "var(--primary)" : "var(--border)" }} />}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: main content */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {step === "address" && (
              <motion.div key="addr"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="rounded-3xl p-6"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
              >
                <AddressForm value={address} onChange={setAddress} errors={addressErrors} />
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={handleAddressContinue}
                    className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                    Continue to payment →
                  </button>
                </div>
              </motion.div>
            )}

            {(step === "payment" || step === "processing") && (
              <motion.div key="pay"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {/* Address review card */}
                <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                        Delivering to
                      </p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {[address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
                          .filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <button type="button" onClick={() => { setStep("address"); setError(null); }}
                      className="flex-shrink-0 text-xs font-semibold transition-opacity hover:opacity-70"
                      style={{ color: "var(--primary)" }}>
                      Change
                    </button>
                  </div>
                </div>

                {/* Cart items review */}
                <div className="rounded-2xl p-4 space-y-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                    Items in this order ({eligibleItems.length})
                  </p>
                  {eligibleItems.map((item) => (
                    <CartItemRow key={item.lineKey} item={item} />
                  ))}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                    {error}
                  </motion.div>
                )}

                {step === "processing" ? (
                  <div className="flex items-center justify-center gap-3 rounded-2xl py-6"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      Opening payment gateway…
                    </p>
                  </div>
                ) : (
                  <button type="button" onClick={handlePay} disabled={processing}
                    className="w-full rounded-2xl py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}>
                    <span className="flex items-center justify-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM2 9h20M8 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Pay ₹{eligibleValue.toLocaleString("en-IN")} via Razorpay
                    </span>
                  </button>
                )}

                <p className="text-center text-xs" style={{ color: "var(--medium-gray)" }}>
                  Secured by Razorpay · UPI, cards, net banking, wallets
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: order summary */}
        <div className="space-y-4">
          <CartSummary
            items={eligibleItems}
            totalValue={totalValue}
            eligibleValue={eligibleValue}
            showCheckoutCta={false}
          />
          {items.length > eligibleItems.length && (
            <div className="rounded-2xl p-4 text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
              <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                {items.length - eligibleItems.length} shortlisted item{items.length - eligibleItems.length !== 1 ? "s" : ""} not included
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
                Contact sellers directly for items without checkout enabled.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
