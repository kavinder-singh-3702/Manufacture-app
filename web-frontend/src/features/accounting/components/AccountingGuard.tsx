"use client";

import { type ReactNode } from "react";
import { useDashboardContext } from "@/src/features/dashboard/components/user-dashboard/context";
import { Card } from "@/src/components/ui/Surface";

/**
 * Company-required guard for the accounting surfaces — mirrors the app's
 * `CompanyRequiredCard`, which every one of its 8 accounting screens renders
 * in place of content when there's no active company. No web accounting file
 * checked `activeCompany` before this; all of them rendered financial data
 * with no company context.
 */
export const AccountingGuard = ({ children }: { children: ReactNode }) => {
  const { activeCompany } = useDashboardContext();

  if (!activeCompany) {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V8l8-4 8 4v12H4zm8-12v12M10 14h4M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Pick a company to see your books</p>
          <p className="max-w-xs text-xs" style={{ color: "var(--medium-gray)" }}>
            Accounting is scoped to a company. Use the company switcher in the sidebar, or create a company to get started.
          </p>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
};
