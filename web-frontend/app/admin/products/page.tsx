import { Metadata } from "next";
import { AdminProductsPanel } from "@/src/features/admin-products/AdminProductsPanel";

export const metadata: Metadata = { title: "ARVANN Admin — In-house Products" };

export default function AdminProductsPage() {
  return <AdminProductsPanel />;
}
