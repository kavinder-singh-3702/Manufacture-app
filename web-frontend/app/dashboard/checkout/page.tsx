import { Metadata } from "next";
import { CheckoutContainer } from "@/src/features/checkout/components/CheckoutContainer";

export const metadata: Metadata = {
  title: "ARVANN — Checkout",
  description: "Complete your purchase securely via Razorpay.",
};

export default function CheckoutPage() {
  return <CheckoutContainer />;
}
