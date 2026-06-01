import { Metadata } from "next";
import { MyProductsContainer } from "@/src/features/product";

export const metadata: Metadata = {
  title: "Manufacture — My Products",
  description: "View and manage your company's product catalog.",
};

export default function MyProductsPage() {
  return <MyProductsContainer />;
}
