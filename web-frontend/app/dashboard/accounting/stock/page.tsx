import { Metadata } from "next";
import { StockSignalsView } from "@/src/features/accounting/components/StockSignalsView";

export const metadata: Metadata = {
  title: "ARVANN — Stock Signals",
  description: "Low stock alerts and top-selling items for your company.",
};

export default function StockSignalsPage() {
  return <StockSignalsView />;
}
