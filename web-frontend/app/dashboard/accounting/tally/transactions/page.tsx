import { Metadata } from "next";
import { TransactionList } from "@/src/features/tally/components/TransactionList";

export const metadata: Metadata = {
  title: "ARVANN — Transactions",
  description: "All accounting vouchers — sales invoices, purchase bills, receipts and payments.",
};

export default function TransactionsPage() {
  return <TransactionList />;
}
