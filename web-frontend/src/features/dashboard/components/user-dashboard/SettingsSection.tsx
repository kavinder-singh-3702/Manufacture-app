import { PageHeader } from "@/src/components/ui/Surface";
import { ThemeSwitcher } from "@/src/components/ui/ThemeSwitcher";
import { NotificationPreferencesCard } from "./NotificationPreferencesCard";

/**
 * SettingsSection — workspace settings surface. Composes the appearance control
 * (system/light/dark) and the notification preferences card (channels + quiet
 * hours), mirroring the app's Appearance + NotificationPreferences screens.
 */
export const SettingsSection = () => (
  <div className="mx-auto w-full max-w-3xl space-y-8">
    <div>
      <PageHeader title="Appearance" />
      <ThemeSwitcher />
    </div>

    <NotificationPreferencesCard />
  </div>
);
