import type { Metadata } from "next";
import { SellerProfilePageClient } from "@/src/features/marketing/components/SellerProfilePageClient";

export const metadata: Metadata = {
  title: "ARVANN - Seller Profile",
  description: "Browse all products from this verified manufacturer on ARVANN marketplace.",
  alternates: { canonical: "/sellers/detail" },
};

export default function SellerDetailPage() {
  return <SellerProfilePageClient />;
}
