"use client";

import type { AdminNotificationBatch, NotificationChannel, NotificationDeliveryStatus } from "@/src/services/notification";

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: "In-app",
  push: "Push",
  email: "Email",
  sms: "SMS",
  webhook: "Webhook",
};

const STATUS_STYLE: Record<NotificationDeliveryStatus, { label: string; color: string; bg: string }> = {
  delivered: { label: "delivered", color: "#059669", bg: "#D1FAE5" },
  sent: { label: "sent", color: "#059669", bg: "#D1FAE5" },
  queued: { label: "queued", color: "#92400E", bg: "#FEF3C7" },
  sending: { label: "sending", color: "#1D4ED8", bg: "#DBEAFE" },
  failed: { label: "failed", color: "#991B1B", bg: "#FEE2E2" },
  cancelled: { label: "cancelled", color: "#6B7280", bg: "#F3F4F6" },
};

/**
 * Per-channel delivery rollup for one dispatch batch — e.g.
 * "In-app: 214 delivered · Push: 190 delivered, 24 failed". Backed by
 * `AdminNotificationBatch.deliveryRollup`
 * (backend/src/services/notification.service.js `fetchDeliveryRollups`),
 * which the old single-recipient history view had no equivalent of.
 */
export const DeliveryStatusChips = ({ deliveryRollup }: { deliveryRollup: AdminNotificationBatch["deliveryRollup"] }) => {
  const channels = Object.keys(deliveryRollup) as NotificationChannel[];
  if (!channels.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {channels.map((channel) => {
        const statuses = deliveryRollup[channel] || {};
        const entries = Object.entries(statuses) as [NotificationDeliveryStatus, number][];
        if (!entries.length) return null;
        return (
          <div key={channel} className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>
              {CHANNEL_LABEL[channel] || channel}
            </span>
            {entries.map(([status, count]) => {
              const style = STATUS_STYLE[status] || STATUS_STYLE.queued;
              return (
                <span
                  key={status}
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: style.bg, color: style.color }}
                  title={`${count} ${style.label}`}
                >
                  {count} {style.label}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
