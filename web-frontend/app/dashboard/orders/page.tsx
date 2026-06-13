import { Metadata } from "next";
import { OrdersList } from "@/src/features/orders/components/OrdersList";

export const metadata: Metadata = {
  title: "ARVANN — My Orders",
  description: "View your order history and track shipments.",
};

export default function OrdersPage() {
  return <OrdersList />;
}
