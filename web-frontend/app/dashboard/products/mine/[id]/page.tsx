import { Metadata } from "next";
import { MyProductDetailContainer } from "@/src/features/product";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "ARVANN — Product",
  description: "View a product from your company's catalog.",
};

export default async function MyProductDetailPage({ params }: Props) {
  const { id } = await params;
  return <MyProductDetailContainer productId={id} />;
}
