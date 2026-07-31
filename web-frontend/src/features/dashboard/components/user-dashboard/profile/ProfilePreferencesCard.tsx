"use client";

import { Card } from "@/src/components/ui/Surface";
import { useThemeMode, type ThemeMode } from "@/src/providers/ThemeProvider";
import { useDashboardContext } from "../context";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/**
 * Theme + locale/timezone — mirrors the app's ProfilePreferencesCard. The
 * app's "Change" button navigates to a separate Appearance screen; three
 * options don't warrant a whole extra web page, so this renders the same
 * System/Light/Dark choice as an inline segmented control instead. Locale/
 * timezone stay read-only, matching the app (no edit affordance there either).
 */
export const ProfilePreferencesCard = () => {
  const { user } = useDashboardContext();
  const { mode, setMode } = useThemeMode();

  return (
    <Card padding="md">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>Preferences</p>

      <div className="flex items-center justify-between gap-3 py-2">
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Theme</p>
        <div className="inline-flex rounded-full p-1" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
          {THEME_OPTIONS.map((opt) => {
            const active = mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                style={{ backgroundColor: active ? "var(--primary)" : "transparent", color: active ? "#fff" : "var(--medium-gray)" }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Locale</p>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{user.preferences?.locale || "en-IN"}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Timezone</p>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{user.preferences?.timezone || "UTC"}</p>
        </div>
      </div>
    </Card>
  );
};
