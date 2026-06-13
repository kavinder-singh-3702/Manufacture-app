import { Metadata } from "next";
import { DashboardActivity } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "ARVANN — Activity",
  description: "Recent workspace activity for ARVANN",
};

export default function DashboardActivityPage() {
  return <DashboardActivity />;
}
