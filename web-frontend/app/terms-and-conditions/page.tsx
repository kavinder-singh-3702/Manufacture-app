import type { Metadata } from "next";
import { LegalDocumentPage, termsAndConditionsContent } from "@/src/features/legal";

export const metadata: Metadata = {
  title: "ARVANN Terms & Conditions",
  description: "Public terms and conditions for ARVANN.",
  alternates: { canonical: "/terms-and-conditions" },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsAndConditionsPage() {
  return <LegalDocumentPage document={termsAndConditionsContent} />;
}
