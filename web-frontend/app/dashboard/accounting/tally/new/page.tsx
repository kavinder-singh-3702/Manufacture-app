"use client";

import { Suspense } from "react";
import { VoucherFormPage } from "../VoucherFormPage";

export default function TallyNewPage() {
  return (
    <Suspense fallback={
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    }>
      <VoucherFormPage />
    </Suspense>
  );
}
