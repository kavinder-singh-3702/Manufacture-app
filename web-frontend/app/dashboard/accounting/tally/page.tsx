import { Metadata } from "next";
import { TallyDashboard } from "@/src/features/tally/components/TallyDashboard";

export const metadata: Metadata = {
  title: "ARVANN — Tally",
  description: "Accounting overview and quick voucher entry — sales invoices, purchase bills, receipts and payments.",
};

export default function TallyPage() {
  return <TallyDashboard />;
}
