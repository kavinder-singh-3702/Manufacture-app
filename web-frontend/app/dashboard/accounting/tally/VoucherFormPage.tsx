"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { VoucherForm } from "@/src/features/accounting/components/VoucherForm";

function Inner() {
  const params = useSearchParams();
  const type = params.get("type") ?? "sales";
  return <VoucherForm typeKey={type} />;
}

export function VoucherFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: "var(--medium-gray)" }}>Loading…</div>}>
      <Inner />
    </Suspense>
  );
}
