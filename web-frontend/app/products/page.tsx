import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicMarketplacePageClient } from "@/src/features/marketing/components/PublicMarketplacePageClient";
import { MarketplaceSkeleton } from "@/src/features/marketing/components/MarketplaceSkeleton";

export const metadata: Metadata = {
  title: "ARVANN — Products Marketplace",
  description: "Browse products from thousands of verified Indian manufacturers. Source raw materials, finished goods and more.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <PublicMarketplacePageClient />
    </Suspense>
  );
}
