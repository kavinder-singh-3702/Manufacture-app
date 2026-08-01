import { Metadata } from "next";
import { InternalStockPage } from "@/src/features/accounting/components/InternalStockPage";

export const metadata: Metadata = {
  title: "ARVANN — Internal Stock",
  description: "Internal stock tracked independently from marketplace listings.",
};

export default function InternalStockRoute() {
  return <InternalStockPage />;
}
