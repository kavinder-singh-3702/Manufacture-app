import { Metadata } from "next";
import { QuickEntryView } from "@/src/features/accounting/components/QuickEntryView";

export const metadata: Metadata = {
  title: "ARVANN — Quick Entry",
  description: "Create vouchers directly for your company.",
};

export default function QuickEntryPage() {
  return <QuickEntryView />;
}
