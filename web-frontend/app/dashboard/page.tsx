import { Metadata } from "next";
import { DashboardOverview } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "ARVANN — Dashboard",
  description: "Personalized workspace overview for ARVANN users",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
