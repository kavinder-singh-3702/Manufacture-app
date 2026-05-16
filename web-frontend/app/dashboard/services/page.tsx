import { Metadata } from "next";
import { ComingSoon } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Services",
  description: "Offer or hire job-work, finishing and logistics services.",
};

export default function ServicesPage() {
  return (
    <ComingSoon
      eyebrow="Services"
      title="Job-work & services marketplace"
      description="List the services your factory offers — finishing, packaging, transport — or discover trusted partners for your own production line."
      icon="🛠️"
      accent="#059669"
      bullets={[
        "Service catalog with capacity and turnaround time",
        "Verified partner network with compliance badges",
        "Track job-work orders end-to-end with milestones",
      ]}
    />
  );
}
