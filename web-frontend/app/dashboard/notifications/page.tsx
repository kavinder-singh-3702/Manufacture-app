import { Metadata } from "next";
import { DashboardNotifications } from "@/src/features/dashboard";

export const metadata: Metadata = {
  title: "Manufacture Command — Notifications",
  description: "All workspace alerts and notifications in one place.",
};

export default function DashboardNotificationsPage() {
  return <DashboardNotifications />;
}
