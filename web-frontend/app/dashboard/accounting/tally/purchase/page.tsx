import type { Metadata } from "next";
import { VoucherForm } from "@/src/features/accounting/components/VoucherForm";

export const metadata: Metadata = {
  title: "ARVANN — Purchase Bill",
  description: "Create a purchase bill voucher.",
};

// Dedicated route — app parity with PurchaseBillScreen. Was previously
// /dashboard/accounting/tally/new?type=purchase; that URL now redirects here.
export default function PurchaseBillPage() {
  return <VoucherForm typeKey="purchase" />;
}
