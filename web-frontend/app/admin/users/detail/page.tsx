import type { Metadata } from "next";
import { AdminUserDetailPageClient } from "@/src/features/admin-users/AdminUserDetailPageClient";

export const metadata: Metadata = { title: "ARVANN Admin - User Detail" };

export default function AdminUserDetailPage() {
  return <AdminUserDetailPageClient />;
}
