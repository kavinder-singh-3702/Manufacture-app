import { Metadata } from "next";
import { BusinessSetupForm } from "@/src/features/business-setup/components/BusinessSetupForm";

export const metadata: Metadata = {
  title: "ARVANN — Business Setup",
  description: "Get expert help launching your manufacturing or trading business.",
};

export default function BusinessSetupPage() {
  return <BusinessSetupForm />;
}
