export type ServiceType = "machine_repair" | "worker" | "transport" | "advertisement";
export type ServiceStatus = "pending" | "in_review" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type ServicePriority = "low" | "normal" | "high" | "urgent";

export type ServiceRequest = {
  _id: string;
  serviceType: ServiceType;
  title: string;
  description?: string;
  status: ServiceStatus;
  priority: ServicePriority;
  company?: string;
  createdBy: string;
  contact?: { name?: string; email?: string; phone?: string };
  location?: { line1?: string; city?: string; state?: string; country?: string };
  schedule?: { start?: string; end?: string; flexible?: boolean; notes?: string };
  budget?: { estimatedCost?: number; currency?: string };
  machineRepairDetails?: {
    machineType?: string; machineName?: string; issueSummary?: string; severity?: string;
  };
  workerDetails?: {
    industry?: string; headcount?: number; roles?: string[]; contractType?: string;
  };
  transportDetails?: {
    pickupCity?: string; dropCity?: string; loadType?: string; vehicleType?: string;
  };
  advertisementDetails?: {
    productId?: string; objective?: string; headline?: string; budget?: number;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceRequestInput = {
  serviceType: ServiceType;
  title: string;
  description?: string;
  priority?: ServicePriority;
  contact?: ServiceRequest["contact"];
  location?: ServiceRequest["location"];
  schedule?: ServiceRequest["schedule"];
  budget?: { estimatedCost?: number; currency?: string };
  machineRepairDetails?: ServiceRequest["machineRepairDetails"];
  workerDetails?: ServiceRequest["workerDetails"];
  transportDetails?: ServiceRequest["transportDetails"];
  advertisementDetails?: ServiceRequest["advertisementDetails"];
  notes?: string;
};

export type ServiceListResponse = {
  requests: ServiceRequest[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};
