import { Metadata } from "next";
import { NotificationStudio } from "@/src/features/admin-notifications/NotificationStudio";

export const metadata: Metadata = { title: "ARVANN Admin — Notification Studio" };

export default function AdminNotificationsPage() {
  return <NotificationStudio />;
}
