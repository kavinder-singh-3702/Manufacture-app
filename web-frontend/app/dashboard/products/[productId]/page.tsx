import type { Metadata } from "next";
import { ProductDetailContainer } from "@/src/features/product";

export const metadata: Metadata = {
  title: "Manufacture — Product detail",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductDetailContainer productId={productId} />;
}
