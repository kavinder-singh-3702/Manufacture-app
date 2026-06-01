import { Metadata } from "next";
import { PartyOutstandingReport } from "@/src/features/accounting/components/PartyOutstandingReport";

export const metadata: Metadata = {
  title: "Manufacture Command — Party Outstanding",
  description: "Aged receivables and payables analysis.",
};

export default function OutstandingPage() {
  return <PartyOutstandingReport />;
}
