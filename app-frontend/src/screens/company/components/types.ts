import { BusinessAccountType } from "../../../constants/business";

export type CompanyEditorSection = "overview" | "contact" | "address" | null;

export type CompanyProfileFormState = {
  displayName: string;
  legalName: string;
  description: string;
  type: BusinessAccountType;
  categories: string;
  logoUrl: string;
  website: string;
  email: string;
  phone: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  youtube: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};
