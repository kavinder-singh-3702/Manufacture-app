import { Metadata } from "next";
import { DashboardSettings } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "ARVANN — Settings",
  description: "Workspace notification and preference controls",
};

export default function DashboardSettingsPage() {
  return <DashboardSettings />;
}
