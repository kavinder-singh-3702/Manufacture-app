import type { Metadata } from "next";
import { InhouseShop } from "@/src/features/inhouse";

export const metadata: Metadata = {
  title: "ARVANN — Shop",
  description: "Curated, quality-checked products sourced directly by ARVANN.",
};

// Dashboard-shell counterpart to the public /shop page — same InhouseShop
// component, rendered inside the dashboard frame so the mobile tab rail's
// "Shop" tab (which mirrors the app's in-house catalog) doesn't drop the
// user out of the dashboard into the marketing layout.
export default function DashboardShopPage() {
  return <InhouseShop />;
}
