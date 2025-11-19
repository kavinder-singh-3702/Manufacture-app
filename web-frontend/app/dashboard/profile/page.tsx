import { Metadata } from "next";
import { DashboardProfile } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Profile",
  description: "Manage your Manufacture Command identity",
};

export default function DashboardProfilePage() {
  return <DashboardProfile />;
}
