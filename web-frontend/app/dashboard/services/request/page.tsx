"use client";

import { Suspense } from "react";
import { ServiceRequestForm } from "@/src/features/services/components/ServiceRequestForm";

export default function ServiceRequestPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    }>
      <ServiceRequestForm />
    </Suspense>
  );
}
