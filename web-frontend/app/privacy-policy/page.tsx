import type { Metadata } from "next";
import { LegalDocumentPage, privacyPolicyContent } from "@/src/features/legal";

export const metadata: Metadata = {
  title: "ARVANN Privacy Policy",
  description: "Public privacy policy for ARVANN and Manufacture Command.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage document={privacyPolicyContent} />;
}
