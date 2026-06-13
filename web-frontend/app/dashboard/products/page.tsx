import type { Metadata } from "next";
import { ProductsListContainer } from "@/src/features/product";

export const metadata: Metadata = {
  title: "ARVANN — Products",
  description: "Manage your product catalog and stock levels.",
};

export default function ProductsPage() {
  return <ProductsListContainer />;
}
