"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/src/features/product/utils/categories";

export const OrderConfirmation = () => {
  const params = useSearchParams();
  const success = params.get("success") === "true";
  const orderId = params.get("orderId") ?? "";
  const paymentId = params.get("paymentId") ?? "";
  const amount = params.get("amount") ? parseFloat(params.get("amount")!) : null;
  const message = params.get("message") ? decodeURIComponent(params.get("message")!) : null;

  const shortOrderId = orderId ? orderId.slice(-8).toUpperCase() : "";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 24 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        {/* Status icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 20 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl"
          style={{
            backgroundColor: success ? "#DCFCE7" : "var(--accent-light)",
            border: `2px solid ${success ? "#bbf7d0" : "var(--accent)"}`,
          }}
        >
          {success ? "✅" : "❌"}
        </motion.div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="space-y-2">
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            {success ? "Order confirmed!" : "Payment failed"}
          </h1>
          <p className="text-base" style={{ color: "var(--medium-gray)" }}>
            {success
              ? "Your order has been placed. The seller will process it shortly."
              : (message ?? "Something went wrong with your payment. Please try again.")}
          </p>
        </motion.div>

        {/* Order details card */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-3xl p-6 text-left"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
              Order details
            </p>
            <div className="mt-4 space-y-3">
              {shortOrderId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--medium-gray)" }}>Order ID</span>
                  <span className="font-mono text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    #{shortOrderId}
                  </span>
                </div>
              )}
              {paymentId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--medium-gray)" }}>Payment ID</span>
                  <span className="font-mono text-xs" style={{ color: "var(--medium-gray)" }}>
                    {paymentId}
                  </span>
                </div>
              )}
              {amount !== null && (
                <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Amount paid</span>
                  <span className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                    {formatCurrency(amount, "INR")}
                  </span>
                </div>
              )}
            </div>

            {/* What happens next */}
            <div className="mt-5 space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--background)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
                What happens next
              </p>
              {[
                "Seller notified and starts processing",
                "You receive a confirmation email",
                "Track order status in My Orders",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--foreground)" }}>
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: "var(--primary)" }}>{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="flex flex-col gap-3"
        >
          {success ? (
            <>
              <Link href="/dashboard/orders"
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                View my orders →
              </Link>
              <Link href="/dashboard/products"
                className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                Continue shopping
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard/checkout"
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}>
                Try again
              </Link>
              <Link href="/dashboard/products"
                className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
                Back to products
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
