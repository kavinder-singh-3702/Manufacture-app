import { Metadata } from "next";
import { Suspense } from "react";
import { InternalInventoryContainer } from "@/src/features/internalInventory/components/InternalInventoryContainer";

export const metadata: Metadata = {
  title: "ARVANN — Internal Inventory",
  description: "Track internal stock for analytics and operations — independent from marketplace listings.",
};

// InternalInventoryContainer reads `useSearchParams()` (for the `?action=add-stock`
// deep link from Quick Entry), which requires a Suspense boundary in the app router.
export default function InternalInventoryPage() {
  return (
    <Suspense fallback={
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    }>
      <InternalInventoryContainer />
    </Suspense>
  );
}
