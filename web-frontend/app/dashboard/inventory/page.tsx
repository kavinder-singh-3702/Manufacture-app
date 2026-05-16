import { Metadata } from "next";
import { ComingSoon } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Inventory",
  description: "Track raw material and finished-goods stock across warehouses.",
};

export default function InventoryPage() {
  return (
    <ComingSoon
      eyebrow="Inventory"
      title="Live stock control is on the way"
      description="Track raw material, work-in-progress and finished goods across every warehouse with low-stock alerts and reorder suggestions."
      icon="📦"
      accent="#148DB2"
      bullets={[
        "Multi-warehouse stock ledger with batch & expiry tracking",
        "Auto-generated reorder points & low-stock alerts",
        "Sync inbound/outbound with Products and Quotes modules",
      ]}
    />
  );
}
