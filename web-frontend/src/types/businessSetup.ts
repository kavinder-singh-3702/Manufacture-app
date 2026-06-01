export type BusinessWorkModel = "manufacturing" | "trading" | "services" | "online" | "hybrid" | "other";
export type BusinessBudgetRange = "under_5_lakh" | "5_10_lakh" | "10_25_lakh" | "25_50_lakh" | "50_lakh_1_cr" | "above_1_cr" | "undisclosed";
export type BusinessStartTimeline = "immediately" | "within_1_month" | "1_3_months" | "3_6_months" | "6_plus_months";
export type BusinessSupportArea = "business_plan" | "company_registration" | "licenses" | "factory_setup" | "vendor_sourcing" | "finance_funding" | "compliance_tax" | "hiring_training" | "technology_setup" | "go_to_market";
export type BusinessFounderExperience = "first_time" | "under_2_years" | "2_to_5_years" | "5_plus_years";
export type BusinessContactChannel = "phone" | "email" | "whatsapp" | "chat";

export type CreateBusinessSetupRequestInput = {
  businessType: string;
  workModel: BusinessWorkModel;
  location: string;
  budgetRange: BusinessBudgetRange;
  startTimeline: BusinessStartTimeline;
  supportAreas?: BusinessSupportArea[];
  founderExperience?: BusinessFounderExperience;
  teamSize?: number;
  preferredContactChannel?: BusinessContactChannel;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

export type BusinessSetupRequest = {
  _id: string;
  trackingReference: string;
  businessType: string;
  workModel: BusinessWorkModel;
  location: string;
  budgetRange: BusinessBudgetRange;
  startTimeline: BusinessStartTimeline;
  supportAreas: BusinessSupportArea[];
  status: "new" | "contacted" | "planning" | "onboarding" | "launched" | "closed" | "rejected";
  createdAt: string;
};
