import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicMarketplace } from "@/src/features/marketing/components/PublicMarketplace";
import { MarketplaceSkeleton } from "@/src/features/marketing/components/MarketplaceSkeleton";
import { getInitialListing } from "@/src/features/marketing/server/publicData";

// Regenerated hourly so the server-rendered product list crawlers see stays
// fresh without a full rebuild (matches the category-page cadence).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ARVANN — Products Marketplace",
  description: "Browse products from thousands of verified Indian manufacturers. Source raw materials, finished goods and more.",
  alternates: { canonical: "/products" },
};

type Props = { searchParams: Promise<{ category?: string; q?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const { category, q } = await searchParams;
  const initialCategory = category?.trim() ?? "";
  // Params here MUST mirror ListingResults' own default-mount fetch exactly
  // (no sort/price/stock filters — the client never seeds those from the
  // URL either) — see getInitialListing's doc comment.
  const initialListing = await getInitialListing({ category: initialCategory || undefined, search: q || undefined });

  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <PublicMarketplace initialCategory={initialCategory} initialListing={initialListing} />
    </Suspense>
  );
}
