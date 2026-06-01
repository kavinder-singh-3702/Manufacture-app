import { Metadata } from "next";
import { ServicesOverview } from "@/src/features/services/components/ServicesOverview";

export const metadata: Metadata = {
  title: "Manufacture Command — Services",
  description: "Job-work, logistics, and operations services marketplace.",
};

export default function ServicesPage() {
  return <ServicesOverview />;
}
