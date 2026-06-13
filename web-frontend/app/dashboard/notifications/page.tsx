import { Metadata } from "next";
import { DashboardNotifications } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "ARVANN — Notifications",
  description: "All workspace alerts and notifications in one place.",
};

export default function DashboardNotificationsPage() {
  return <DashboardNotifications />;
}
