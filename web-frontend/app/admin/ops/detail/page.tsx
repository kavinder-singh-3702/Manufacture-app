import type { Metadata } from "next";
import { AdminOpsDetailPageClient } from "@/src/features/admin-ops/AdminOpsDetailPageClient";

export const metadata: Metadata = { title: "ARVANN Admin - Request Detail", robots: { index: false, follow: false } };

export default function AdminOpsDetailPage() {
  return <AdminOpsDetailPageClient />;
}
