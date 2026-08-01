import { Metadata } from "next";
import { EditMyProductContainer } from "@/src/features/product";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "ARVANN — Edit product",
  description: "Edit a product in your company's catalog.",
};

export default async function EditMyProductPage({ params }: Props) {
  const { id } = await params;
  return <EditMyProductContainer productId={id} />;
}
