import { Metadata } from "next";
import { InternalInventoryContainer } from "@/src/features/internalInventory/components/InternalInventoryContainer";

export const metadata: Metadata = {
  title: "ARVANN — Internal Inventory",
  description: "Track internal stock for analytics and operations — independent from marketplace listings.",
};

export default function InternalInventoryPage() {
  return <InternalInventoryContainer />;
}
