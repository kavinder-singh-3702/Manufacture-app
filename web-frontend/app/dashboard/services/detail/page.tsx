"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ServiceRequestDetail } from "@/src/features/services/components/ServiceRequestDetail";

const DetailContent = () => {
  const params = useSearchParams();
  return <ServiceRequestDetail serviceId={params.get("serviceId") ?? ""} />;
};

const DetailSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
    ))}
  </div>
);

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DetailContent />
    </Suspense>
  );
}
