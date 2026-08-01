import { Metadata } from "next";
import { Suspense } from "react";
import { PublicMarketplace } from "@/src/features/marketing/components/PublicMarketplace";
import { MarketplaceSkeleton } from "@/src/features/marketing/components/MarketplaceSkeleton";
import { getCategoryMeta, PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";

type Props = { params: Promise<{ categoryId: string }> };

export function generateStaticParams() {
  return PRODUCT_CATEGORIES.map((cat) => ({ categoryId: cat.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const cat = getCategoryMeta(categoryId);
  return {
    title: `ARVANN — ${cat?.title ?? "Category"} Products`,
    description: `Source ${cat?.title ?? categoryId} products from verified Indian manufacturers on the ARVANN marketplace.`,
  };
}

export default async function PublicCategoryPage({ params }: Props) {
  const { categoryId } = await params;
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <PublicMarketplace initialCategory={categoryId} />
    </Suspense>
  );
}
