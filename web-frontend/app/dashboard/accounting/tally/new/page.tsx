"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TYPE_ROUTES: Record<string, string> = {
  sales: "/dashboard/accounting/tally/sales",
  purchase: "/dashboard/accounting/tally/purchase",
  receipt: "/dashboard/accounting/tally/receipt",
  payment: "/dashboard/accounting/tally/payment",
};

// Legacy `?type=` entry point — now redirects to the dedicated voucher routes
// (D1) so old links/bookmarks to /tally/new?type=sales etc. keep working.
function RedirectInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const type = params.get("type") ?? "sales";
    router.replace(TYPE_ROUTES[type] ?? TYPE_ROUTES.sales);
  }, [params, router]);

  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    </div>
  );
}

export default function TallyNewPage() {
  return (
    <Suspense fallback={
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    }>
      <RedirectInner />
    </Suspense>
  );
}
