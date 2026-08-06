"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { OpsRequestDetail } from "./OpsRequestDetail";

/**
 * Below-`lg` counterpart to the desktop Sheet in AdminOpsPanel — a dedicated,
 * back-navigable page instead of an overlay, since ~40 fields of detail in a
 * bottom sheet on a phone would just move the scrolling problem rather than
 * solve it. Renders the exact same `OpsRequestDetail` body as the sheet, so
 * there is one implementation of the detail UI to maintain, not two.
 */
export const AdminOpsDetailPageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id")?.trim() ?? "";
  const kind = searchParams.get("kind");

  if (!id || (kind !== "service" && kind !== "business_setup")) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Request not found</p>
        <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>Missing or invalid request reference in the page link.</p>
        <Link href="/admin/ops" className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
          Back to Ops Console
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
      <OpsRequestDetail id={id} kind={kind} onClose={() => router.push("/admin/ops")} />
    </div>
  );
};
