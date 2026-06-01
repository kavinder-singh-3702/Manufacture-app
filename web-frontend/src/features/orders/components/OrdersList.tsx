"use client";

import { useCallback, useEffect, useState } from "react";
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

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay },
});

const OrderCard = ({ order, index }: { order: ProductOrder; index: number }) => {
  const statusMeta = STATUS_META[order.status] ?? STATUS_META.processing;
  const firstItem = order.lineItems[0];
  const extraCount = order.lineItems.length - 1;

  return (
    <motion.div
      {...fade(index * 0.05)}
      whileHover={{ y: -2 }}
      className="overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Status bar */}
      <div className="h-1" style={{ backgroundColor: statusMeta.dot }} />

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold" style={{ color: "var(--medium-gray)" }}>
                #{order._id.slice(-8).toUpperCase()}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusMeta.dot }} />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--medium-gray)" }}>
              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              {formatCurrency(order.totals.total, order.totals.currency)}
            </p>
            <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
              {order.totals.itemCount} item{order.totals.itemCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {firstItem && (
          <div className="mt-4 space-y-1">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {firstItem.productName}
              {firstItem.variantTitle ? ` — ${firstItem.variantTitle}` : ""}
            </p>
            {extraCount > 0 && (
              <p className="text-xs" style={{ color: "var(--medium-gray)" }}>
                + {extraCount} more item{extraCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
          <div className="text-xs" style={{ color: "var(--medium-gray)" }}>
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </div>
          <Link
            href={`/dashboard/orders/detail?orderId=${order._id}`}
            className="rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(20,141,178,0.2)" }}
          >
            View details →
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export const OrdersList = () => {
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await ordersService.list({ limit: 20 });
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fade(0)} className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
            Purchase history
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>My Orders</h1>
        </div>
        <Link href="/dashboard/products"
          className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
          Shop more →
        </Link>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
          <span>{error}</span>
          <button type="button" onClick={load} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* Orders grid */}
      {!loading && !error && orders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders.map((order, i) => (
            <OrderCard key={order._id} order={order} index={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && orders.length === 0 && (
        <motion.div {...fade(0.1)}
          className="flex flex-col items-center gap-4 rounded-3xl p-12 text-center"
          style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}>
          <span className="text-4xl">📦</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No orders yet</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
              Products you purchase will appear here.
            </p>
          </div>
          <Link href="/dashboard/products"
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
            Browse products →
          </Link>
        </motion.div>
      )}
    </div>
  );
};
