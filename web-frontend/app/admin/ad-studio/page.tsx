import { Metadata } from "next";
import { AdStudioPanel } from "@/src/features/admin-ads/AdStudioPanel";

export const metadata: Metadata = { title: "ARVANN Admin — Ad Studio" };

export default function AdminAdStudioPage() {
  return <AdStudioPanel />;
}
