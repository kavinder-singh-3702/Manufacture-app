"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  notificationService,
  AdminDispatchPayload,
  NotificationPriority,
  NotificationChannel,
  NotificationAudience,
} from "@/src/services/notification";
import { ApiError } from "@/src/lib/api-error";
import { useToast } from "@/src/components/ui/Toast";
import { UserRecipientPicker, CompanyRecipientPicker } from "./RecipientPicker";

const AUDIENCES: { key: NotificationAudience; label: string; hint: string }[] = [
  { key: "broadcast", label: "Broadcast", hint: "Every active user" },
  { key: "user", label: "Users", hint: "Pick specific people" },
  { key: "company", label: "Company", hint: "All members of one company" },
];

const PRIORITIES: NotificationPriority[] = ["low", "normal", "high", "critical"];
const ALL_CHANNELS: NotificationChannel[] = ["in_app", "push", "email", "sms"];
const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: "In-app", push: "Push", email: "Email", sms: "SMS", webhook: "Webhook",
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
    {children}
  </label>
);

const textInputStyle: React.CSSProperties = {
  backgroundColor: "var(--background)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
};

const DEFAULT_EVENT_KEY = "admin.broadcast";

/**
 * Notification composer — now audience-complete (broadcast/company both
 * actually dispatch instead of 400ing, W1), with real recipient pickers
 * instead of a raw ObjectId text box (W2), and eventKey/topic/schedule/
 * acknowledgement fields for parity with the app studio (W3, W4).
 */
export const ComposerPanel = ({ onDispatched }: { onDispatched: () => void }) => {
  const toast = useToast();

  const [audience, setAudience] = useState<NotificationAudience>("broadcast");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventKey, setEventKey] = useState(DEFAULT_EVENT_KEY);
  const [topic, setTopic] = useState("admin");
  const [priority, setPriority] = useState<NotificationPriority>("normal");
  const [channels, setChannels] = useState<NotificationChannel[]>(["in_app", "push"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleChannel = (ch: NotificationChannel) =>
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));

  const toggleUser = (id: string) =>
    setUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const canSend =
    title.trim() &&
    body.trim() &&
    eventKey.trim() &&
    channels.length > 0 &&
    (audience === "broadcast" || (audience === "user" && userIds.length > 0) || (audience === "company" && companyId));

  const resetComposer = () => {
    setTitle("");
    setBody("");
    setEventKey(DEFAULT_EVENT_KEY);
    setScheduledAt("");
    setRequiresAck(false);
    setUserIds([]);
    setCompanyId("");
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setFormError(null);
    try {
      const payload: AdminDispatchPayload = {
        audience,
        title: title.trim(),
        body: body.trim(),
        eventKey: eventKey.trim(),
        topic: topic.trim() || "system",
        priority,
        channels,
        requiresAck,
        ...(audience === "user" ? { userIds } : {}),
        ...(audience === "company" ? { companyId } : {}),
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      };
      const res = await notificationService.dispatch(payload);
      const count = res.count ?? 1;
      toast.success("Notification dispatched", `Sent to ${count} recipient${count !== 1 ? "s" : ""}.`);
      resetComposer();
      onDispatched();
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Dispatch failed";
      setFormError(message);
      toast.error("Dispatch failed", message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-2xl p-5 self-start"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>Compose</p>

      <div>
        <Label>Audience</Label>
        <div className="grid grid-cols-3 gap-2">
          {AUDIENCES.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAudience(a.key)}
              className="rounded-xl py-2 text-center transition-all"
              style={{
                backgroundColor: audience === a.key ? "var(--primary)" : "var(--surface)",
                color: audience === a.key ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs font-bold">{a.label}</div>
              <div className="text-[10px] opacity-70">{a.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {audience === "user" && (
        <div>
          <Label>Recipients</Label>
          <UserRecipientPicker selectedIds={userIds} onToggle={toggleUser} />
        </div>
      )}

      {audience === "company" && (
        <div>
          <Label>Company</Label>
          <CompanyRecipientPicker selectedId={companyId} onSelect={setCompanyId} />
        </div>
      )}

      {audience === "broadcast" && (
        <p className="rounded-xl px-3 py-2 text-xs italic" style={{ backgroundColor: "var(--surface)", color: "var(--medium-gray)" }}>
          Sent to every active, non-admin user.
        </p>
      )}

      <div>
        <Label>Title</Label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
          placeholder="Notification title"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={textInputStyle} />
      </div>

      <div>
        <Label>Body</Label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={500}
          placeholder="Notification message…"
          className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none" style={textInputStyle} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Event key</Label>
          <input value={eventKey} onChange={(e) => setEventKey(e.target.value)}
            placeholder="admin.broadcast"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={textInputStyle} />
        </div>
        <div>
          <Label>Topic</Label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="admin"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={textInputStyle} />
        </div>
      </div>

      <div>
        <Label>Priority</Label>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className="flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all"
              style={{
                backgroundColor: priority === p ? "var(--primary-light)" : "var(--surface)",
                color: priority === p ? "var(--primary)" : "var(--medium-gray)",
                border: priority === p ? "1px solid var(--primary)" : "1px solid var(--border)",
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Channels</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_CHANNELS.map((ch) => (
            <button key={ch} type="button" onClick={() => toggleChannel(ch)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: channels.includes(ch) ? "var(--primary)" : "var(--surface)",
                color: channels.includes(ch) ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {CHANNEL_LABEL[ch]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Schedule (optional)</Label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={textInputStyle} />
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-xs font-semibold" style={{ color: "var(--foreground)" }}>
          <input type="checkbox" checked={requiresAck} onChange={(e) => setRequiresAck(e.target.checked)} />
          Requires acknowledgement
        </label>
      </div>

      {formError && (
        <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>⚠ {formError}</p>
      )}

      <button onClick={handleSend} disabled={!canSend || sending}
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ backgroundColor: "var(--primary)" }}>
        {sending ? "Dispatching…" : "Dispatch notification"}
      </button>
    </motion.div>
  );
};
