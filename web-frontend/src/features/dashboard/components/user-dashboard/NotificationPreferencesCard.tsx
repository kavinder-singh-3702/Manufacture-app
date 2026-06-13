"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "./shared";
import {
  notificationService,
  type NotificationPreferences,
} from "@/src/services/notification";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const Toggle = ({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    className="relative h-6 w-12 flex-shrink-0 rounded-full transition disabled:opacity-50"
    style={{ backgroundColor: checked ? "var(--primary)" : "var(--light-gray)" }}
  >
    <span
      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
      style={{ left: checked ? "26px" : "2px" }}
    />
  </button>
);

const Row = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) => (
  <div
    className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
    style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
  >
    <div className="min-w-0">
      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{label}</p>
      <p className="text-xs" style={{ color: "var(--medium-gray)" }}>{description}</p>
    </div>
    <Toggle checked={checked} disabled={disabled} onChange={onChange} label={label} />
  </div>
);

/**
 * NotificationPreferencesCard — parity with the app's NotificationPreferences
 * screen. Reads/writes the real `/notifications/preferences` endpoint (master
 * switch, per-channel toggles, quiet hours) with optimistic updates.
 */
export const NotificationPreferencesCard = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    let active = true;
    notificationService
      .getPreferences()
      .then((data) => {
        if (active) setPrefs(data);
      })
      .catch((err) => {
        if (active) setLoadError(err?.message ?? "Failed to load notification preferences");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = async (patch: Partial<NotificationPreferences>, optimistic: NotificationPreferences) => {
    const previous = prefs;
    setPrefs(optimistic);
    setSaveStatus("saving");
    try {
      const updated = await notificationService.updatePreferences(patch);
      setPrefs(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch {
      setPrefs(previous);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const toggleField = (key: "masterEnabled" | "inAppEnabled" | "pushEnabled" | "emailEnabled" | "smsEnabled") => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    void persist({ [key]: next[key] }, next);
  };

  const toggleQuietHours = () => {
    if (!prefs) return;
    const next = { ...prefs, quietHours: { ...prefs.quietHours, enabled: !prefs.quietHours.enabled } };
    void persist({ quietHours: next.quietHours }, next);
  };

  const setQuietTime = (which: "start" | "end", value: string) => {
    if (!prefs) return;
    const next = { ...prefs, quietHours: { ...prefs.quietHours, [which]: value } };
    void persist({ quietHours: next.quietHours }, next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Notifications" subtitle="Channels & quiet hours" />
        {saveStatus === "saving" && (
          <span className="text-xs font-semibold" style={{ color: "var(--medium-gray)" }}>Saving…</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>✓ Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="text-xs font-semibold" style={{ color: "var(--error)" }}>Failed to save</span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
            />
          ))}
        </div>
      )}

      {!loading && loadError && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", color: "var(--medium-gray)" }}
        >
          {loadError}
        </div>
      )}

      {!loading && prefs && (
        <>
          <Row
            label="Enable notifications"
            description="Master switch for all channels."
            checked={prefs.masterEnabled}
            onChange={() => toggleField("masterEnabled")}
          />

          <div className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--medium-gray)" }}>
              Channels
            </p>
            <Row label="In-app" description="Show alerts inside the console." checked={prefs.inAppEnabled} disabled={!prefs.masterEnabled} onChange={() => toggleField("inAppEnabled")} />
            <Row label="Push" description="Browser / device push notifications." checked={prefs.pushEnabled} disabled={!prefs.masterEnabled} onChange={() => toggleField("pushEnabled")} />
            <Row label="Email" description="Updates sent to your inbox." checked={prefs.emailEnabled} disabled={!prefs.masterEnabled} onChange={() => toggleField("emailEnabled")} />
            <Row label="SMS" description="Text messages for key events." checked={prefs.smsEnabled} disabled={!prefs.masterEnabled} onChange={() => toggleField("smsEnabled")} />
          </div>

          <div className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--medium-gray)" }}>
              Quiet hours
            </p>
            <Row
              label="Enable quiet hours"
              description="Mute non-critical alerts during a window."
              checked={prefs.quietHours.enabled}
              disabled={!prefs.masterEnabled}
              onChange={toggleQuietHours}
            />
            {prefs.quietHours.enabled && (
              <div
                className="flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
              >
                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                  <span style={{ color: "var(--medium-gray)" }}>From</span>
                  <input
                    type="time"
                    value={prefs.quietHours.start}
                    onChange={(e) => setQuietTime("start", e.target.value)}
                    className="rounded-xl border px-2 py-1 text-sm focus:outline-none"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                  <span style={{ color: "var(--medium-gray)" }}>To</span>
                  <input
                    type="time"
                    value={prefs.quietHours.end}
                    onChange={(e) => setQuietTime("end", e.target.value)}
                    className="rounded-xl border px-2 py-1 text-sm focus:outline-none"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}
                  />
                </label>
                <span className="text-xs" style={{ color: "var(--medium-gray)" }}>
                  {prefs.quietHours.timezone}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
