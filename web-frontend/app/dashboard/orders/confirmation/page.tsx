"use client";

import { Suspense } from "react";
import { OrderConfirmation } from "@/src/features/checkout/components/OrderConfirmation";

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    }>
      <OrderConfirmation />
    </Suspense>
  );
}
