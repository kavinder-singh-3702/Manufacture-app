import { Metadata } from "next";
import { DashboardActivity } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Activity",
  description: "Recent workspace activity for Manufacture Command",
};

export default function DashboardActivityPage() {
  return <DashboardActivity />;
}
