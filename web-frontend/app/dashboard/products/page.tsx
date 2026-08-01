import type { Metadata } from "next";
import { ProductsListContainer } from "@/src/features/product";

export const metadata: Metadata = {
  title: "ARVANN — Products",
  description: "Browse and buy products from verified suppliers.",
};

export default function ProductsPage() {
  return <ProductsListContainer />;
}
