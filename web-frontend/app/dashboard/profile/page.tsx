import { Metadata } from "next";
import { DashboardProfile } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "ARVANN — Profile",
  description: "Manage your ARVANN identity",
};

export default function DashboardProfilePage() {
  return <DashboardProfile />;
}
