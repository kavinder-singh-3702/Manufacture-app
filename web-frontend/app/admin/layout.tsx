import { ReactNode } from "react";
import { AdminFrame } from "@/src/features/admin-dashboard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
