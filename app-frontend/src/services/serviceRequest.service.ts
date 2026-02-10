import { apiClient } from "./apiClient";

export type ServiceType = "machine_repair" | "worker" | "transport";
export type ServiceStatus = "pending" | "in_review" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type ServicePriority = "low" | "normal" | "high" | "urgent";

export type ContactDetails = {
  name?: string;
  email?: string;
  phone?: string;
  preferredChannel?: "phone" | "email" | "chat";
};

export type LocationDetails = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: { lat?: number; lng?: number };
};

export type AvailabilityWindow = {
  startDate?: string | Date;
  endDate?: string | Date;
  isFlexible?: boolean;
  notes?: string;
};

export type MachineRepairDetails = {
  machineType: string;
  machineName?: string;
  manufacturer?: string;
  model?: string;
  issueSummary: string;
  issueDetails?: string;
  severity?: "low" | "medium" | "high" | "critical";
  requiresDowntime?: boolean;
  warrantyStatus?: "in_warranty" | "out_of_warranty" | "unknown";
  preferredSchedule?: AvailabilityWindow;
};

export type WorkerRequestDetails = {
  industry: string;
  roles?: string[];
  headcount: number;
  experienceLevel?: "entry" | "mid" | "senior" | "expert";
  shiftType?: "day" | "night" | "rotational" | "flexible";
  contractType?: "one_time" | "short_term" | "long_term";
  startDate?: string | Date;
  durationWeeks?: number;
  skills?: string[];
  certifications?: string[];
  safetyClearances?: string[];
  languagePreferences?: string[];
  budgetPerWorker?: { amount?: number; currency?: string };
};

export type TransportDetails = {
  mode?: "road" | "rail" | "air" | "sea";
  pickupLocation?: LocationDetails;
  dropLocation?: LocationDetails;
  loadType?: string;
  loadWeightTons?: number;
  vehicleType?: string;
  requiresReturnTrip?: boolean;
  availability?: AvailabilityWindow;
  specialHandling?: string;
  insuranceNeeded?: boolean;
};

export type CreateServiceRequestInput = {
  serviceType: ServiceType;
  title: string;
  description?: string;
  priority?: ServicePriority;
  contact?: ContactDetails;
  location?: LocationDetails;
  schedule?: AvailabilityWindow;
  budget?: {
    estimatedCost?: number;
    currency?: string;
    notes?: string;
  };
  machineRepairDetails?: MachineRepairDetails;
  workerDetails?: WorkerRequestDetails;
  transportDetails?: TransportDetails;
  notes?: string;
};

export type ServiceRequest = {
  _id: string;
  serviceType: ServiceType;
  title: string;
  description?: string;
  status: ServiceStatus;
  priority: ServicePriority;
  company?: string;
  createdBy: string;
  createdByRole?: "admin" | "user";
  assignedTo?: string;
  contact?: ContactDetails;
  location?: LocationDetails;
  schedule?: AvailabilityWindow;
  budget?: {
    estimatedCost?: number;
    currency?: string;
    notes?: string;
  };
  machineRepairDetails?: MachineRepairDetails;
  workerDetails?: WorkerRequestDetails;
  transportDetails?: TransportDetails;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceRequestListFilters = {
  serviceType?: ServiceType;
  status?: ServiceStatus;
  priority?: ServicePriority;
  limit?: number;
  offset?: number;
  sort?: "newest" | "oldest" | "priority";
  companyId?: string;
  createdBy?: string;
  assignedTo?: string;
};

export type ServiceRequestListResponse = {
  services: ServiceRequest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

class ServiceRequestService {
  async create(payload: CreateServiceRequestInput): Promise<ServiceRequest> {
    const response = await apiClient.post<{ service: ServiceRequest }>("/services", payload);
    return response.service;
  }

  async list(filters?: ServiceRequestListFilters): Promise<ServiceRequestListResponse> {
    return apiClient.get<ServiceRequestListResponse>("/services", { params: filters });
  }

  async getById(serviceId: string): Promise<ServiceRequest> {
    const response = await apiClient.get<{ service: ServiceRequest }>(`/services/${serviceId}`);
    return response.service;
  }
}

export const serviceRequestService = new ServiceRequestService();
