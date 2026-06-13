import { Metadata } from "next";
import { GSTSummaryReport } from "@/src/features/accounting/components/GSTSummaryReport";

export const metadata: Metadata = {
  title: "ARVANN — GST Summary",
  description: "Input vs output GST analysis and net payable calculation.",
};

export default function GSTPage() {
  return <GSTSummaryReport />;
}
