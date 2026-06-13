import type { Metadata } from "next";
import { PublicMarketplacePageClient } from "@/src/features/marketing/components/PublicMarketplacePageClient";

export const metadata: Metadata = {
  title: "ARVANN — Products Marketplace",
  description: "Browse products from thousands of verified Indian manufacturers. Source raw materials, finished goods and more.",
};

export default function ProductsPage() {
  return <PublicMarketplacePageClient />;
}
