import type { Metadata } from "next";
import { InhouseShop } from "@/src/features/inhouse";

export const metadata: Metadata = {
  title: "ARVANN — In-house Catalog",
  description:
    "Shop ARVANN Select: curated, quality-checked products sourced directly by ARVANN. Ready to ship across India.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return <InhouseShop />;
}
