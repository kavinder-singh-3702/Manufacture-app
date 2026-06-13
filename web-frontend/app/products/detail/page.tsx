import type { Metadata } from "next";
import { PublicProductDetailPageClient } from "@/src/features/marketing/components/PublicProductDetailPageClient";

export const metadata: Metadata = {
  title: "ARVANN — Product detail",
  description: "View product details, pricing, and contact the seller on ARVANN marketplace.",
  alternates: { canonical: "/products/detail" },
};

export default function PublicProductDetailPage() {
  return <PublicProductDetailPageClient />;
}
