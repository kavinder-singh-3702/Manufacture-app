import { Metadata } from "next";
import { InventoryContainer } from "@/src/features/inventory";

export const metadata: Metadata = {
  title: "ARVANN — Inventory",
  description: "Track stock levels across your product catalogue.",
};

export default function InventoryPage() {
  return <InventoryContainer />;
}
