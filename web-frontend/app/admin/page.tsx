import { Metadata } from "next";
import { AdminOverview } from "@/src/features/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin — ARVANN",
  description: "Monitor company verification and compliance queues.",
};

export default function AdminPage() {
  return <AdminOverview />;
}
