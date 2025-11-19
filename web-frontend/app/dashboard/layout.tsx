import { ReactNode } from "react";
import { DashboardFrame } from "@/src/features/dashboard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardFrame>{children}</DashboardFrame>;
}
