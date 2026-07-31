import type { AdPrice, AdTargetingMode } from "../services/ad";

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
  /**
   * Mirrors the backend's AdvertisementDetailsSchema
   * (backend/src/models/serviceRequest.model.js) field-for-field — this had
   * drifted to a 4-field shape (productId/objective/headline/budget) that
   * didn't match the ~20-field backend schema at all: the required `product`
   * field was missing entirely (under the wrong name, `productId`) and
   * `budget` isn't a backend field, which is why submitting this service
   * request always 400'd.
   */
  advertisementDetails?: {
    product?: string;
    priceOverride?: AdPrice;
    objective?: string;
    targetingMode?: AdTargetingMode;
    targetUserIds?: string[];
    shopperCategories?: string[];
    shopperSubCategories?: string[];
    buyIntentCategories?: string[];
    buyIntentSubCategories?: string[];
    listedProductCategories?: string[];
    listedProductSubCategories?: string[];
    requireListedProductInSameCategory?: boolean;
    lookbackDays?: number;
    startAt?: string;
    endAt?: string;
    headline?: string;
    subtitle?: string;
    ctaLabel?: string;
    badge?: string;
    frequencyCapPerDay?: number;
    popupCooldownMinutes?: number;
    priority?: number;
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

// Field is `services` (not `requests`) to match what GET /services actually
// returns (backend/src/modules/services/services/serviceRequest.service.js's
// listServiceRequests → `{ services, pagination }`). The admin-scoped list
// function returns `{ requests, pagination }` instead — an inconsistency
// between the two backend functions — which is why this user-facing type
// must NOT reuse the admin shape. Reading `.requests` off this response was
// always `undefined`, crashing `ServicesOverview` the moment it tried to
// `.filter()` it.
export type ServiceListResponse = {
  services: ServiceRequest[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};
