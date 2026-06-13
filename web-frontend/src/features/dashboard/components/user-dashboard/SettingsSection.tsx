import { SectionHeader } from "./shared";
import { ThemeSwitcher } from "@/src/components/ui/ThemeSwitcher";
import { NotificationPreferencesCard } from "./NotificationPreferencesCard";

/**
 * SettingsSection — workspace settings surface. Composes the appearance control
 * (system/light/dark) and the notification preferences card (channels + quiet
 * hours), mirroring the app's Appearance + NotificationPreferences screens.
 */
export const SettingsSection = () => (
  <div className="space-y-8">
    <div>
      <SectionHeader title="Appearance" subtitle="Theme" />
      <p className="mb-3 mt-1 text-xs" style={{ color: "var(--medium-gray)" }}>
        Theme mode for the whole console.
      </p>
      <ThemeSwitcher />
    </div>

    <NotificationPreferencesCard />
  </div>
);
