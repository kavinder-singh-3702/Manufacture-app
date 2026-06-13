import { Metadata } from "next";
import { AdminInquiriesPanel } from "@/src/features/admin-inquiries/AdminInquiriesPanel";

export const metadata: Metadata = { title: "ARVANN Admin — Product Inquiries" };

export default function AdminProductInquiriesPage() {
  return <AdminInquiriesPanel />;
}
