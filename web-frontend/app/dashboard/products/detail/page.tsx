import type { Metadata } from "next";
import { ProductDetailPageClient } from "@/src/features/product";

export const metadata: Metadata = {
  title: "ARVANN — Product detail",
};

export default function ProductDetailPage() {
  return <ProductDetailPageClient />;
}
