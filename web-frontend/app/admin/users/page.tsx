import { Metadata } from "next";
import { AdminUsersPanel } from "@/src/features/admin-users/AdminUsersPanel";

export const metadata: Metadata = { title: "ARVANN Admin — Users" };

export default function AdminUsersPage() {
  return <AdminUsersPanel />;
}
