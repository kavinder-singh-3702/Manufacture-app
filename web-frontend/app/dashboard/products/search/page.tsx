import { Metadata } from "next";
import { ProductSearchContainer } from "@/src/features/product";

export const metadata: Metadata = {
  title: "Manufacture — Search Products",
  description: "Search across the manufacturing marketplace by name, category, or SKU.",
};

export default function ProductSearchPage() {
  return <ProductSearchContainer />;
}
