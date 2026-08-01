import { Metadata } from "next";
import { NewMyProductContainer } from "@/src/features/product";

export const metadata: Metadata = {
  title: "ARVANN — New product",
  description: "Add a product to your company's catalog.",
};

export default function NewMyProductPage() {
  return <NewMyProductContainer />;
}
