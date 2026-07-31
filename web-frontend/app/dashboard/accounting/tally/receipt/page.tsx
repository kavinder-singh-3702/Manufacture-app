import type { Metadata } from "next";
import { VoucherForm } from "@/src/features/accounting/components/VoucherForm";

export const metadata: Metadata = {
  title: "ARVANN — Receipt",
  description: "Record a receipt voucher.",
};

// Dedicated route — app parity with ReceiptPaymentScreen{type:'receipt'}. Was
// previously /dashboard/accounting/tally/new?type=receipt; that URL now
// redirects here.
export default function ReceiptPage() {
  return <VoucherForm typeKey="receipt" />;
}
