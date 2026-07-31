import { Metadata } from "next";
import { CompanySwitcherSection } from "@/src/features/company/components/CompanySwitcherSection";
import { CompanyProfile } from "@/src/features/company";
import { WorkspaceStatCards } from "@/src/features/dashboard/components/user-dashboard/overview/WorkspaceStatCards";

export const metadata: Metadata = {
  title: "ARVANN — Company",
  description: "Manage and switch between your company workspaces.",
};

export default function CompanyPage() {
  return (
    <div className="space-y-10">
      <WorkspaceStatCards />
      <CompanySwitcherSection />
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem" }}>
        <CompanyProfile />
      </div>
    </div>
  );
}
