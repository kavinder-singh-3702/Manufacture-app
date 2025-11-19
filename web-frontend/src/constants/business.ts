export const BUSINESS_ACCOUNT_TYPES = ["normal", "trader", "manufacturer"] as const;

export type BusinessAccountType = (typeof BUSINESS_ACCOUNT_TYPES)[number];

export const COMPANY_VERIFICATION_ACCOUNT_TYPES = ["trader", "manufacturer"] as const;
export type CompanyVerificationAccountType = (typeof COMPANY_VERIFICATION_ACCOUNT_TYPES)[number];

export const BUSINESS_CATEGORIES = [
  "printing",
  "manufacturing",
  "packaging",
  "logistics",
  "textiles",
  "machinery",
  "other",
] as const;
