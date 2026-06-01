"use client";

import { Suspense } from "react";
import { OrderDetailPageClient } from "@/src/features/orders/components/OrderDetailPageClient";

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    }>
      <OrderDetailPageClient />
    </Suspense>
  );
}
