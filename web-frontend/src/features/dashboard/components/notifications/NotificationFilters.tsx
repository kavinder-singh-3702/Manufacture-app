"use client";

import { SearchInput } from "@/src/components/ui/Input";
import type { NotificationPriority } from "@/src/services/notification";

export type ViewMode = "unread" | "all" | "archived";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "unread", label: "Unread" },
  { key: "all", label: "All" },
  { key: "archived", label: "Archived" },
];

const PRIORITY_FILTERS: { key: NotificationPriority | "all"; label: string }[] = [
  { key: "all", label: "All priorities" },
  { key: "low", label: "Low" },
  { key: "normal", label: "Normal" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
];

/**
 * Segmented view-mode control + search + priority chips — mirrors the app's
 * NotificationsScreen controls block (segment row / search box / horizontal
 * priority chip scroll). Stacks vertically on mobile; collapses to one row
 * at `lg`, matching the app's compact vs. regular layout split.
 */
export const NotificationFilters = ({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: NotificationPriority | "all";
  onPriorityChange: (priority: NotificationPriority | "all") => void;
}) => (
  <div className="space-y-3 lg:flex lg:items-center lg:gap-3 lg:space-y-0">
    <div className="flex flex-wrap gap-2">
      {VIEW_MODES.map(({ key, label }) => {
        const isActive = viewMode === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onViewModeChange(key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>

    <SearchInput
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search notifications"
      className="w-full lg:max-w-xs"
    />

    <div className="flex flex-wrap gap-2 lg:ml-auto">
      {PRIORITY_FILTERS.map(({ key, label }) => {
        const isActive = priorityFilter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPriorityChange(key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  </div>
);
