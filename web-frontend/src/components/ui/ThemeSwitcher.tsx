"use client";

import { useThemeMode, type ThemeMode } from "@/src/providers/ThemeProvider";

type Option = { id: ThemeMode; title: string; subtitle: string; icon: ReactIcon };
type ReactIcon = (props: { color: string }) => React.ReactElement;

const SystemIcon: ReactIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2" stroke={color} strokeWidth="1.8" />
    <path d="M8 20h8M12 16v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LightIcon: ReactIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const DarkIcon: ReactIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const OPTIONS: Option[] = [
  { id: "system", title: "System", subtitle: "Follows your device appearance", icon: SystemIcon },
  { id: "light", title: "Light", subtitle: "Bright interface for daylight", icon: LightIcon },
  { id: "dark", title: "Dark", subtitle: "Low-glare interface for focus", icon: DarkIcon },
];

/**
 * ThemeSwitcher — appearance control (system / light / dark), mirroring the
 * app's AppearanceScreen. Reusable across settings surfaces.
 */
export const ThemeSwitcher = () => {
  const { mode, resolvedMode, setMode } = useThemeMode();

  return (
    <div className="space-y-2">
      {OPTIONS.map((option) => {
        const isActive = mode === option.id;
        const iconColor = isActive ? "var(--primary)" : "var(--medium-gray)";
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            aria-pressed={isActive}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors"
            style={{
              backgroundColor: isActive ? "var(--primary-light)" : "var(--card)",
              border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
            }}
          >
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: isActive ? "rgba(20,141,178,0.12)" : "var(--background)" }}
            >
              <option.icon color={iconColor} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {option.title}
                {option.id === "system" && (
                  <span className="ml-2 text-[11px] font-medium" style={{ color: "var(--medium-gray)" }}>
                    ({resolvedMode})
                  </span>
                )}
              </span>
              <span className="block text-xs" style={{ color: "var(--medium-gray)" }}>{option.subtitle}</span>
            </span>
            <span
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
              style={{ border: `2px solid ${isActive ? "var(--primary)" : "var(--border)"}` }}
            >
              {isActive && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />}
            </span>
          </button>
        );
      })}
    </div>
  );
};
