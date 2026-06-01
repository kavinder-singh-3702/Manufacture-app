import { Metadata } from "next";
import { CategoryBrowseContainer } from "@/src/features/product";
import { getCategoryMeta, PRODUCT_CATEGORIES } from "@/src/features/product/utils/categories";

type Props = { params: Promise<{ categoryId: string }> };

export function generateStaticParams() {
  return PRODUCT_CATEGORIES.map((cat) => ({ categoryId: cat.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const cat = getCategoryMeta(categoryId);
  return {
    title: `Manufacture — ${cat?.title ?? "Category"} Products`,
    description: `Browse ${cat?.title ?? categoryId} products from verified Indian manufacturers.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoryId } = await params;
  return <CategoryBrowseContainer categoryId={categoryId} />;
}
