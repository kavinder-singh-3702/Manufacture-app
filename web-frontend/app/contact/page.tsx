import type { Metadata } from "next";
import { ContactPage } from "@/src/features/marketing";

export const metadata: Metadata = {
  title: "Contact ARVANN",
  description: "Get in touch with the ARVANN team for sales, onboarding, verification help, or partnerships.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return <ContactPage />;
}
