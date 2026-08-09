import type { Metadata } from "next";
import { ContactPage } from "@/src/features/marketing";
import { SUPPORT_PHONE_DISPLAY } from "@/src/lib/contact";

export const metadata: Metadata = {
  title: "Contact ARVANN",
  description: `Get in touch with the ARVANN team for sales, onboarding, verification help, or partnerships. Call ${SUPPORT_PHONE_DISPLAY}.`,
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return <ContactPage />;
}
