import type { AdPrice, AdTargetingMode } from "../services/ad";

export type ServiceType = "machine_repair" | "worker" | "transport" | "advertisement";
export type ServiceStatus = "pending" | "in_review" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type ServicePriority = "low" | "normal" | "high" | "urgent";

export type ServiceLocation = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

export type ServiceAvailabilityWindow = {
  startDate?: string;
  endDate?: string;
  isFlexible?: boolean;
  notes?: string;
};

export type ServiceContact = {
  name?: string;
  email?: string;
  phone?: string;
  preferredChannel?: "phone" | "email" | "chat";
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
  contact?: ServiceContact;
  location?: ServiceLocation;
  schedule?: ServiceAvailabilityWindow;
  budget?: { estimatedCost?: number; currency?: string; notes?: string };
  statusHistory?: Array<{ from?: ServiceStatus; to: ServiceStatus; at: string; reason?: string; note?: string }>;
  // Mirrors backend/src/models/serviceRequest.model.js's MachineRepairDetailsSchema
  // field-for-field. `machineType` is a fixed id (see
  // src/constants/services.ts MACHINE_TYPE_IDS) — never free text.
  machineRepairDetails?: {
    machineType?: string;
    machineName?: string;
    manufacturer?: string;
    model?: string;
    issueSummary?: string;
    issueDetails?: string;
    severity?: "low" | "medium" | "high" | "critical";
    requiresDowntime?: boolean;
    warrantyStatus?: "in_warranty" | "out_of_warranty" | "unknown";
    preferredSchedule?: ServiceAvailabilityWindow;
  };
  // Mirrors WorkerRequestDetailsSchema. `industry` is a fixed id (see
  // WORKER_INDUSTRY_IDS) — never free text.
  workerDetails?: {
    industry?: string;
    roles?: string[];
    headcount?: number;
    experienceLevel?: "entry" | "mid" | "senior" | "expert";
    shiftType?: "day" | "night" | "rotational" | "flexible";
    contractType?: "one_time" | "short_term" | "long_term";
    startDate?: string;
    durationWeeks?: number;
    skills?: string[];
    certifications?: string[];
    safetyClearances?: string[];
    languagePreferences?: string[];
    budgetPerWorker?: { amount?: number; currency?: string };
  };
  // Mirrors TransportDetailsSchema — `pickupLocation`/`dropLocation` are
  // nested location objects, NOT flat `pickupCity`/`dropCity` strings. The
  // web form previously sent the flat shape; express-validator doesn't
  // reject unknown keys, so it passed validation and Mongoose silently
  // dropped the route data on save.
  transportDetails?: {
    mode?: "road" | "rail" | "air" | "sea";
    pickupLocation?: ServiceLocation;
    dropLocation?: ServiceLocation;
    loadType?: string;
    loadWeightTons?: number;
    vehicleType?: string;
    requiresReturnTrip?: boolean;
    availability?: ServiceAvailabilityWindow;
    specialHandling?: string;
    insuranceNeeded?: boolean;
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
  budget?: ServiceRequest["budget"];
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
