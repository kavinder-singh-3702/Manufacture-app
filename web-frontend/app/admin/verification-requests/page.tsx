import { Metadata } from "next";
import { VerificationRequestsPanel } from "@/src/features/admin-verification";

export const metadata: Metadata = {
  title: "Admin · Company Verification Requests",
  description: "Review and moderate company verification submissions.",
};

export default function VerificationRequestsPage() {
  return (
    <section className="space-y-6">
      <VerificationRequestsPanel />
    </section>
  );
}
