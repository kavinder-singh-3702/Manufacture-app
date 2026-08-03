import { Metadata } from "next";
import { AdminChatConsole } from "@/src/features/admin-chat/AdminChatConsole";

export const metadata: Metadata = { title: "ARVANN Admin — Chat" };

export default function AdminChatPage() {
  return <AdminChatConsole />;
}
