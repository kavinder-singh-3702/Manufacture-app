import { Metadata } from "next";
import { CompanyProfile } from "@/src/features/company";

export const metadata: Metadata = {
  title: "Manufacture Command — Company Profile",
  description: "View and edit your active company profile",
};

export default function CompanyProfilePage() {
  return <CompanyProfile />;
}
