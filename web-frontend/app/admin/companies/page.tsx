import { Metadata } from "next";
import { AdminCompaniesPanel } from "@/src/features/admin-companies/AdminCompaniesPanel";

export const metadata: Metadata = { title: "ARVANN Admin — Companies" };

export default function AdminCompaniesPage() {
  return <AdminCompaniesPanel />;
}
