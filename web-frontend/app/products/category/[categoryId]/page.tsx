import { Metadata } from "next";
import { Suspense } from "react";
import { PublicMarketplace } from "@/src/features/marketing/components/PublicMarketplace";
import { MarketplaceSkeleton } from "@/src/features/marketing/components/MarketplaceSkeleton";
import { getCategoryMeta, LEGACY_CATEGORY_IDS } from "@/src/features/product/utils/categories";
import { getInitialListing } from "@/src/features/marketing/server/publicData";

// Regenerated hourly, matching the sitemap/product-detail cadence — a new
// listing in a category shows up in the server-rendered content (and hence to
// crawlers) without a full rebuild.
export const revalidate = 3600;

type Props = {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ q?: string }>;
};

// Only the 7 legacy catch-all buckets live at this URL now — next.config.ts
// permanently redirects every real industry id from here to /industries/[id],
// so pre-rendering those 20 here as well would just be generating pages the
// redirect intercepts before they're ever served.
export function generateStaticParams() {
  return [...LEGACY_CATEGORY_IDS].map((categoryId) => ({ categoryId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const cat = getCategoryMeta(categoryId);
  return {
    title: `ARVANN — ${cat?.title ?? "Category"} Products`,
    description: `Source ${cat?.title ?? categoryId} products from verified Indian manufacturers on the ARVANN marketplace.`,
    alternates: { canonical: `/products/category/${categoryId}` },
  };
}

export default async function PublicCategoryPage({ params, searchParams }: Props) {
  const { categoryId } = await params;
  const { q } = await searchParams;
  // Params here MUST mirror ListingResults' own default-mount fetch exactly
  // (no sort/price/stock filters — the client never seeds those from the
  // URL either) — see getInitialListing's doc comment.
  const initialListing = await getInitialListing({ category: categoryId, search: q || undefined });

  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <PublicMarketplace initialCategory={categoryId} initialListing={initialListing} />
    </Suspense>
  );
}
