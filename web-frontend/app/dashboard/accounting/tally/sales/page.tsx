import type { Metadata } from "next";
import { VoucherForm } from "@/src/features/accounting/components/VoucherForm";

export const metadata: Metadata = {
  title: "ARVANN — Sales Invoice",
  description: "Create a sales invoice voucher.",
};

// Dedicated route — app parity with SalesInvoiceScreen. Was previously
// /dashboard/accounting/tally/new?type=sales; that URL now redirects here.
export default function SalesInvoicePage() {
  return <VoucherForm typeKey="sales" />;
}
