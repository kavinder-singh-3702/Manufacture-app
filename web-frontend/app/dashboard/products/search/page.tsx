import { Metadata } from "next";
import { Suspense } from "react";
import { ProductSearchContainer } from "@/src/features/product";

export const metadata: Metadata = {
  title: "ARVANN — Search Products",
  description: "Search across the manufacturing marketplace by name, category, or SKU.",
};

export default function ProductSearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    }>
      <ProductSearchContainer />
    </Suspense>
  );
}
