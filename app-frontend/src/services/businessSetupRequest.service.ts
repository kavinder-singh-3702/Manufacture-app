import { apiClient } from "./apiClient";

export type BusinessWorkModel =
  | "manufacturing"
  | "trading"
  | "services"
  | "online"
  | "hybrid"
  | "other";

export type BusinessBudgetRange =
  | "under_5_lakh"
  | "5_10_lakh"
  | "10_25_lakh"
  | "25_50_lakh"
  | "50_lakh_1_cr"
  | "above_1_cr"
  | "undisclosed";

export type BusinessStartTimeline =
  | "immediately"
  | "within_1_month"
  | "1_3_months"
  | "3_6_months"
  | "6_plus_months";

export type BusinessSupportArea =
  | "business_plan"
  | "company_registration"
  | "licenses"
  | "factory_setup"
  | "vendor_sourcing"
  | "finance_funding"
  | "compliance_tax"
  | "hiring_training"
  | "technology_setup"
  | "go_to_market";

export type BusinessSetupStatus =
  | "new"
  | "contacted"
  | "planning"
  | "onboarding"
  | "launched"
  | "closed"
  | "rejected";

export type BusinessSetupPriority = "low" | "normal" | "high" | "urgent";

export type CreateBusinessSetupRequestInput = {
  title?: string;
  businessType: string;
  workModel: BusinessWorkModel;
  location: string;
  budgetRange: BusinessBudgetRange;
  startTimeline: BusinessStartTimeline;
  supportAreas?: BusinessSupportArea[];
  founderExperience?: "first_time" | "under_2_years" | "2_to_5_years" | "5_plus_years";
  teamSize?: number;
  preferredContactChannel?: "phone" | "email" | "whatsapp" | "chat";
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

export type BusinessSetupRequest = {
  id: string;
  referenceCode: string;
  title: string;
  businessType: string;
  workModel: BusinessWorkModel;
  location: string;
  budgetRange: BusinessBudgetRange;
  startTimeline: BusinessStartTimeline;
  supportAreas: BusinessSupportArea[];
  founderExperience?: "first_time" | "under_2_years" | "2_to_5_years" | "5_plus_years";
  teamSize?: number;
  preferredContactChannel?: "phone" | "email" | "whatsapp" | "chat";
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  source: "authenticated" | "guest";
  status: BusinessSetupStatus;
  priority: BusinessSetupPriority;
  createdAt: string;
  updatedAt: string;
};

export type BusinessSetupListResponse = {
  requests: BusinessSetupRequest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

class BusinessSetupRequestService {
  async create(payload: CreateBusinessSetupRequestInput): Promise<{ request: BusinessSetupRequest; message: string; trackingReference: string }> {
    return apiClient.post<{ request: BusinessSetupRequest; message: string; trackingReference: string }>(
      "/business-setup-requests",
      payload
    );
  }

  async listMine(params?: {
    status?: BusinessSetupStatus;
    sort?: "newest" | "oldest";
    limit?: number;
    offset?: number;
  }): Promise<BusinessSetupListResponse> {
    return apiClient.get<BusinessSetupListResponse>("/business-setup-requests/me", { params });
  }
}

export const businessSetupRequestService = new BusinessSetupRequestService();
