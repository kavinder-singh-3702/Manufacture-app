import { Metadata } from "next";
import { CartPageContent } from "@/src/features/cart/components/CartPageContent";

export const metadata: Metadata = {
  title: "ARVANN — Cart",
  description: "Review your shortlisted and checkout-ready products.",
};

export default function CartPage() {
  return <CartPageContent />;
}
