import { Metadata } from "next";
import { AccountingDashboard } from "@/src/features/accounting/components/AccountingDashboard";

export const metadata: Metadata = {
  title: "ARVANN — Accounting",
  description: "GST-ready financial overview for Indian manufacturers.",
};

export default function AccountingPage() {
  return <AccountingDashboard />;
}
