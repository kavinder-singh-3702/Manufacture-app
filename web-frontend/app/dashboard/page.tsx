import { Metadata } from "next";
import { UserDashboard } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Dashboard",
  description: "Personalized workspace overview for Manufacture Command users",
};

export default function DashboardPage() {
  return <UserDashboard />;
}
