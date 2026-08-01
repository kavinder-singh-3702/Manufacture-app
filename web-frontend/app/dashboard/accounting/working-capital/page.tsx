import { Metadata } from "next";
import { WorkingCapitalView } from "@/src/features/accounting/components/WorkingCapitalView";

export const metadata: Metadata = {
  title: "ARVANN — Working Capital",
  description: "Receivables vs payables for your company.",
};

export default function WorkingCapitalPage() {
  return <WorkingCapitalView />;
}
