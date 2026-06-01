"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ordersService } from "@/src/services/orders";
import { ApiError } from "@/src/lib/api-error";
import { formatCurrency } from "@/src/features/product/utils/categories";
import type { ProductOrder, ProductOrderStatus } from "@/src/types/order";

const STATUS_META: Record<ProductOrderStatus, { label: string; bg: string; text: string; dot: string }> = {
  payment_pending: { label: "Awaiting payment", bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  payment_authorized: { label: "Payment authorized", bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  paid: { label: "Paid", bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  processing: { label: "Processing", bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6" },
  shipped: { label: "Shipped", bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  delivered: { label: "Delivered", bg: "#DCFCE7", text: "#15803D", dot: "#16A34A" },
  cancelled: { label: "Cancelled", bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  refunded: { label: "Refunded", bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF" },
};

export const OrderDetailPageClient = () => {
  const params = useSearchParams();
  const orderId = params.get("orderId") ?? "";
  const [order, setOrder] = useState<ProductOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orderId) { setError("No order ID provided."); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const res = await ordersService.get(orderId);
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Order not found</p>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>{error ?? "This order could not be loaded."}</p>
        <Link href="/dashboard/orders"
          className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--primary)" }}>
          ← Back to orders
        </Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[order.status] ?? STATUS_META.processing;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm" style={{ color: "var(--medium-gray)" }}>
        <Link href="/dashboard/orders" className="transition-opacity hover:opacity-70" style={{ color: "var(--primary)" }}>
          Orders
        </Link>
        <span>/</span>
        <span style={{ color: "var(--foreground)" }}>#{order._id.slice(-8).toUpperCase()}</span>
      </motion.div>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="overflow-hidden rounded-3xl"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}>
        <div className="h-1" style={{ backgroundColor: statusMeta.dot }} />
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-xl font-bold" style={{ color: "var(--foreground)" }}>
                #{order._id.slice(-8).toUpperCase()}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusMeta.dot }} />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
              Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
              {formatCurrency(order.totals.total, order.totals.currency)}
            </p>
            <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
              {order.totals.itemCount} item{order.totals.itemCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left: Line items */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-3 rounded-2xl p-5"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
            Items ordered
          </p>
          {order.lineItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-xl p-3"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{item.productName}</p>
                {item.variantTitle && <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{item.variantTitle}</p>}
                {item.productSku && <p className="font-mono text-[11px]" style={{ color: "var(--medium-gray)" }}>SKU: {item.productSku}</p>}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                  {formatCurrency(item.lineTotal, item.currency)}
                </p>
                <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                  {formatCurrency(item.unitPrice, item.currency)} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Right: Meta */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-5 space-y-3"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
              Delivery address
            </p>
            <p className="text-sm" style={{ color: "var(--foreground)" }}>
              {[order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city,
                order.shippingAddress.state, order.shippingAddress.postalCode, order.shippingAddress.country]
                .filter(Boolean).join(", ")}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-5 space-y-3"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
              Payment summary
            </p>
            <div className="space-y-2">
              {[
                { label: "Subtotal", value: formatCurrency(order.totals.subtotal, order.totals.currency) },
                { label: "Total", value: formatCurrency(order.totals.total, order.totals.currency), bold: true },
                { label: "Payment", value: order.paymentStatus, capitalize: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span style={{ color: "var(--medium-gray)" }}>{row.label}</span>
                  <span className={row.bold ? "font-bold" : "font-semibold"}
                    style={{ color: "var(--foreground)", textTransform: row.capitalize ? "capitalize" : undefined }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
