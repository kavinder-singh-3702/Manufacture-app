import { Metadata } from "next";
import { CompanySwitcherSection } from "@/src/features/company/components/CompanySwitcherSection";
import { CompanyProfile } from "@/src/features/company";

export const metadata: Metadata = {
  title: "ARVANN — Company",
  description: "Manage and switch between your company workspaces.",
};

export default function CompanyPage() {
  return (
    <div className="space-y-10">
      <CompanySwitcherSection />
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem" }}>
        <CompanyProfile />
      </div>
    </div>
  );
}
