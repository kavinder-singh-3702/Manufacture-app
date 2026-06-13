import { Metadata } from "next";
import { AdminOrdersBoard } from "@/src/features/admin-orders/AdminOrdersBoard";

export const metadata: Metadata = { title: "ARVANN Admin — Orders Pipeline" };

export default function AdminOrdersPage() {
  return <AdminOrdersBoard />;
}
