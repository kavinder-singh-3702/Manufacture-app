import { Metadata } from "next";
import { ComingSoon } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Accounting",
  description: "Invoices, GST returns and ledgers tuned for Indian manufacturers.",
};

export default function AccountingPage() {
  return (
    <ComingSoon
      eyebrow="Accounting"
      title="Books that match how factories run"
      description="Generate GST-ready invoices, reconcile payments and pull P&L reports without juggling spreadsheets or duplicate entries."
      icon="📊"
      accent="#4F46E5"
      bullets={[
        "GST-compliant invoices, e-way bills and purchase entries",
        "Auto bank reconciliation with payment notifications",
        "Real-time P&L, balance sheet and aged receivables",
      ]}
    />
  );
}
