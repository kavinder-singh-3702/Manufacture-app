import { SectionHeader } from "./shared";

const initialPreferences = {
  alerts: true,
  weeklyDigest: false,
  autoReports: true,
};

export type PreferencesState = typeof initialPreferences;

export const defaultPreferences = initialPreferences;

export const SettingsSection = ({
  preferences,
  onToggle,
}: {
  preferences: PreferencesState;
  onToggle: (key: keyof PreferencesState) => void;
}) => (
  <div className="space-y-6">
    <SectionHeader title="Workspace preferences" subtitle="Settings" />
    <div className="space-y-3">
      {Object.entries(preferences).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-3xl border border-[var(--border-soft)] bg-white/90 px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-[#2e1f2c]">
              {key === "alerts" ? "Critical alerts" : key === "weeklyDigest" ? "Weekly digest" : "Auto reports"}
            </p>
            <p className="text-xs text-[#7a5d6b]">
              {key === "alerts"
                ? "Get notified when compliance states change."
                : key === "weeklyDigest"
                  ? "Snapshot sent every Monday."
                  : "Share weekly metrics with partners."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggle(key as keyof typeof preferences)}
            className={`relative h-6 w-12 rounded-full transition ${
              value ? "bg-[var(--color-plum)]" : "bg-[#d9c5cd]"
            }`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
      ))}
    </div>
  </div>
);
