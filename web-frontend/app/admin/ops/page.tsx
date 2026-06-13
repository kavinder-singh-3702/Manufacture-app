import { Metadata } from "next";
import { AdminOpsPanel } from "@/src/features/admin-ops/AdminOpsPanel";

export const metadata: Metadata = { title: "ARVANN Admin — Ops Console" };

export default function AdminOpsPage() {
  return <AdminOpsPanel />;
}
