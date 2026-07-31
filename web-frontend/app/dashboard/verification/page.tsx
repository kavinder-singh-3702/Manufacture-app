import { Metadata } from "next";
import { CompanyVerificationSection } from "@/src/features/dashboard/components/user-dashboard/CompanyVerificationSection";

export const metadata: Metadata = {
  title: "ARVANN — Verification",
  description: "Submit GST + Aadhaar documents to earn your company's verified trust badge.",
};

export default function VerificationPage() {
  return <CompanyVerificationSection />;
}
