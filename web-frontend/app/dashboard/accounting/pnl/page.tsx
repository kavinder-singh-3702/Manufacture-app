import { Metadata } from "next";
import { ProfitLossReport } from "@/src/features/accounting/components/ProfitLossReport";

export const metadata: Metadata = {
  title: "ARVANN — Profit & Loss",
  description: "Income vs expense analysis for your company.",
};

export default function ProfitLossPage() {
  return <ProfitLossReport />;
}
