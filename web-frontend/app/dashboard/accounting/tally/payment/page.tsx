import type { Metadata } from "next";
import { VoucherForm } from "@/src/features/accounting/components/VoucherForm";

export const metadata: Metadata = {
  title: "ARVANN — Payment",
  description: "Record a payment voucher.",
};

// Dedicated route — app parity with ReceiptPaymentScreen{type:'payment'}. Was
// previously /dashboard/accounting/tally/new?type=payment; that URL now
// redirects here.
export default function PaymentPage() {
  return <VoucherForm typeKey="payment" />;
}
