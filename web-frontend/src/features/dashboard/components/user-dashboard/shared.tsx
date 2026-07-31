import type { ReactNode } from "react";

export const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
        {subtitle ?? "Workspace"}
      </p>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h2>
    </div>
    {action}
  </div>
);
