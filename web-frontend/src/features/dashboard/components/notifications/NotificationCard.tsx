"use client";

import { motion } from "framer-motion";
import { formatRelativeTime } from "../user-dashboard/helpers";
import { tintBg } from "@/src/lib/color";
import { priorityMeta, type NotificationItem } from "./data";
import { NotificationTopicIcon } from "./NotificationIcons";
import { isExternalHref, resolveNotificationHref } from "./notificationAction";

const ActionPill = ({
  label,
  onClick,
  href,
  tone = "default",
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: "default" | "primary" | "muted";
}) => {
  const toneStyle =
    tone === "primary"
      ? { borderColor: "var(--primary)", backgroundColor: "var(--primary-light)", color: "var(--primary)" }
      : tone === "muted"
        ? { borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--medium-gray)" }
        : { borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)" };

  const className = "rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5";

  if (href) {
    return (
      <a href={href} target={isExternalHref(href) ? "_blank" : undefined} rel={isExternalHref(href) ? "noopener noreferrer" : undefined} className={className} style={toneStyle}>
        {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} style={toneStyle}>
      {label}
    </button>
  );
};

export const NotificationCard = ({
  item,
  archived,
  onMarkRead,
  onArchive,
  onUnarchive,
  onAcknowledge,
}: {
  item: NotificationItem;
  archived: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onAcknowledge: (id: string) => void;
}) => {
  const meta = priorityMeta[item.priority];
  const isUnread = item.status === "unread";
  const openHref = resolveNotificationHref(item.action, item.data);

  return (
    <motion.div
      layout
      initial={{ opacity: 0.8, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border p-4 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
      style={{
        backgroundColor: "var(--card)",
        borderColor: isUnread ? "var(--primary)" : "var(--border)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
        <NotificationTopicIcon topic={item.topic} color="var(--medium-gray)" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
          {item.topic}
        </p>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: tintBg(meta.color), color: meta.color }}
        >
          {meta.label}
        </span>
        {isUnread && (
          <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: tintBg("var(--accent)"), color: "var(--accent)" }}>
            New
          </span>
        )}
      </div>

      <p className="mt-2 text-base font-semibold" style={{ color: "var(--foreground)" }}>{item.title}</p>
      {item.body && <p className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>{item.body}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{formatRelativeTime(item.timestamp)}</p>

        <div className="flex flex-wrap items-center gap-2">
          {openHref && <ActionPill label={item.action?.label || "Open"} href={openHref} tone="default" />}
          {item.requiresAck && !item.ackAt && (
            <ActionPill label="Acknowledge" onClick={() => onAcknowledge(item.id)} tone="default" />
          )}
          {archived ? (
            <ActionPill label="Restore" onClick={() => onUnarchive(item.id)} tone="default" />
          ) : (
            <ActionPill label="Archive" onClick={() => onArchive(item.id)} tone="muted" />
          )}
          {isUnread && <ActionPill label="Mark read" onClick={() => onMarkRead(item.id)} tone="primary" />}
        </div>
      </div>
    </motion.div>
  );
};
