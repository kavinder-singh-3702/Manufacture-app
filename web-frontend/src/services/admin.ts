import { httpClient, QueryParams } from "../lib/http-client";
import type { Product, ProductCategory, CreateProductInput } from "../types/product";

export type AdminInhouseProduct = Product;

// ── Pagination ────────────────────────────────────────────────────────────────

export type Pagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

// ── Stats / Overview ──────────────────────────────────────────────────────────

export type AdminStats = {
  users:         { total: number; active: number };
  companies:     { total: number; active: number };
  verifications: { pending: number; approved: number; rejected: number; total: number };
  today:         { newVerifications: number; newUsers: number };
};

export type AdminOverview = {
  stats: AdminStats;
  verificationAging: { lt24h: number; from24hTo72h: number; gt72h: number };
  notificationDispatchHealth: { last24h: number; delivered: number; failed: number; successRate: number };
  servicesQueue?: { pending: number; inProgress: number; overdue: number; unresolved: number };
  communications?: { conversationsLast24h: number; callsLast24h: number; totalCallDurationSeconds: number };
};

// ── Users ─────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  accountType?: string;
  verificationStatus?: string;
  lastLoginAt?: string;
  createdAt: string;
};

export type AdminUserRole = "super-admin" | "admin" | "user";

// ── Companies ─────────────────────────────────────────────────────────────────

export type AdminCompany = {
  id: string;
  displayName: string;
  legalName?: string;
  type: string;
  status: string;
  complianceStatus?: string;
  categories: string[];
  logoUrl?: string;
  owner: { id: string; displayName: string; email: string } | null;
  documentsRequestedAt?: string;
  archivedAt?: string;
  deactivatedReason?: string;
  createdAt: string;
  updatedAt: string;
};

// ── Ops Requests ──────────────────────────────────────────────────────────────

export type AdminOpsRequestActor = {
  id: string;
  displayName?: string;
  email?: string;
  role?: string;
};

export type AdminOpsRequest = {
  id: string;
  kind: "service" | "business_setup";
  title: string;
  status: string;
  priority: string;
  company?: { id: string; displayName?: string; status?: string; type?: string } | null;
  createdBy?: AdminOpsRequestActor | null;
  assignedTo?: AdminOpsRequestActor | null;
  createdAt: string;
  updatedAt: string;
  slaDueAt?: string;
  lastActionAt?: string;
  serviceType?: string;
  referenceCode?: string;
  preview?: {
    serviceType?: string;
    description?: string;
    businessType?: string;
    workModel?: string;
    location?: string;
    budgetRange?: string;
    startTimeline?: string;
    source?: string;
  };
};

export type AdminOpsCounts = {
  total: number;
  service: number;
  business_setup: number;
  open: number;
  closed: number;
  rejected: number;
  urgent: number;
  unassigned: number;
};

export type AdminOpsRequestTimelineEntry = {
  type: "status" | "assignment" | "note";
  at: string;
  entry: Record<string, unknown>;
};

// Full admin-detail shapes, returned only by the per-id endpoints
// (GET /admin/service-requests/:id, GET /admin/business-setup-requests/:id).
// The list endpoint (`listOpsRequests`) only ever returns `AdminOpsRequest`.
export type AdminServiceRequest = {
  id: string;
  serviceType: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  company?: { id: string; displayName?: string; status?: string; type?: string; complianceStatus?: string } | null;
  createdBy?: AdminOpsRequestActor | null;
  assignedTo?: AdminOpsRequestActor | null;
  lastUpdatedBy?: AdminOpsRequestActor | null;
  slaDueAt?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  lastActionAt?: string;
  createdAt: string;
  updatedAt: string;
  contact?: { phone?: string; email?: string; name?: string; preferredChannel?: string; [k: string]: unknown } | null;
  location?: { line1?: string; line2?: string; city?: string; state?: string; country?: string; postalCode?: string; [k: string]: unknown } | null;
  schedule?: { startDate?: string; endDate?: string; isFlexible?: boolean; notes?: string; [k: string]: unknown } | null;
  budget?: { estimatedCost?: number; currency?: string; notes?: string } | null;
  notes?: string;
  machineRepairDetails?: Record<string, unknown> | null;
  workerDetails?: Record<string, unknown> | null;
  transportDetails?: Record<string, unknown> | null;
  advertisementDetails?: Record<string, unknown> | null;
  timeline?: AdminOpsRequestTimelineEntry[];
  statusHistory?: Array<Record<string, unknown>>;
  assignmentHistory?: Array<Record<string, unknown>>;
  internalNotes?: Array<Record<string, unknown>>;
  allowedTransitions?: Array<{ status: string; isPrimary: boolean }>;
};

export type AdminBusinessSetupRequest = {
  id: string;
  referenceCode: string;
  title: string;
  businessType: string;
  workModel: string;
  location: string;
  budgetRange: string;
  startTimeline: string;
  supportAreas?: string[];
  founderExperience?: string;
  teamSize?: number;
  preferredContactChannel?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  source: "authenticated" | "guest";
  status: string;
  priority: string;
  company?: { id: string; displayName?: string; status?: string; type?: string; complianceStatus?: string } | null;
  createdBy?: AdminOpsRequestActor | null;
  assignedTo?: AdminOpsRequestActor | null;
  lastUpdatedBy?: AdminOpsRequestActor | null;
  slaDueAt?: string;
  lastActionAt?: string;
  createdAt: string;
  updatedAt: string;
  timeline?: AdminOpsRequestTimelineEntry[];
  statusHistory?: Array<Record<string, unknown>>;
  assignmentHistory?: Array<Record<string, unknown>>;
  internalNotes?: Array<Record<string, unknown>>;
  allowedTransitions?: Array<{ status: string; isPrimary: boolean }>;
};

// ── Audit Events ──────────────────────────────────────────────────────────────

export type AdminAuditEvent = {
  id: string;
  action: string;
  category?: string;
  label?: string;
  description?: string;
  actor?: { id: string; displayName?: string; email?: string; role?: string } | null;
  company?: { id: string; displayName?: string; status?: string } | null;
  companyName?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
};

// ── User Overview ─────────────────────────────────────────────────────────────

export type AdminUserOverview = {
  user: AdminUser;
  activity: {
    recent: Array<{ id: string; action?: string; label?: string; description?: string; createdAt?: string }>;
    total: number;
  };
  services: {
    recent: Array<{
      id: string;
      serviceType: string;
      title: string;
      status: string;
      priority: string;
      company?: { id: string; displayName?: string; status?: string } | null;
      createdAt?: string;
      updatedAt?: string;
    }>;
    total: number;
  };
  communications: {
    conversations: {
      total: number;
      recent: Array<{ id: string; lastMessage?: string; lastMessageAt?: string; updatedAt?: string }>;
    };
    calls: {
      total: number;
      recent: Array<{ id: string; durationSeconds: number; startedAt: string; notes?: string }>;
    };
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
  });
  return Object.keys(out).length ? out : undefined;
};

// ── Service ───────────────────────────────────────────────────────────────────

const getStats = () =>
  httpClient.get<{ stats: AdminStats }>("/admin/stats").then((r) => r.stats);

const getOverview = () =>
  httpClient.get<{ overview: AdminOverview }>("/admin/overview").then((r) => r.overview);

const listUsers = (params?: { status?: string; search?: string; role?: AdminUserRole; limit?: number; offset?: number; sort?: string }) =>
  httpClient.get<{ users: AdminUser[]; pagination: Pagination }>("/admin/users", { params: toQuery(params as Record<string, unknown>) });

const getUserOverview = (userId: string, params?: { limit?: number }) =>
  httpClient.get<{ overview: AdminUserOverview }>(`/admin/users/${userId}/overview`, { params: toQuery(params as Record<string, unknown>) })
    .then((r) => r.overview);

const listCompanies = (params?: { status?: string; search?: string; limit?: number; offset?: number; sort?: string }) =>
  httpClient.get<{ companies: AdminCompany[]; pagination: Pagination }>("/admin/companies", { params: toQuery(params as Record<string, unknown>) });

// Non-super-admins must echo the target company id as `contextCompanyId` for every
// company mutation (validateMutationContext on the backend). Super-admins may pass it
// too — it's validated to match — so we always send it and keep one code path.
const setCompanyStatus = (companyId: string, payload: { status: string; reason?: string }) =>
  httpClient.patch<{ company: AdminCompany }>(`/admin/companies/${companyId}/status`, {
    ...payload,
    contextCompanyId: companyId,
  });

const archiveCompany = (companyId: string, payload?: { reason?: string }) =>
  httpClient.post<{ company: AdminCompany }>(`/admin/companies/${companyId}/archive`, {
    ...payload,
    contextCompanyId: companyId,
  });

const hardDeleteCompany = (companyId: string, payload: { reason: string }) =>
  httpClient.post<{ job?: { id: string }; company?: AdminCompany }>(
    `/admin/companies/${companyId}/hard-delete`,
    { ...payload, contextCompanyId: companyId }
  );

const requestCompanyDocuments = (
  companyId: string,
  payload?: { message?: string; sendEmail?: boolean; sendNotification?: boolean }
) =>
  httpClient.post<{ company: AdminCompany }>(`/admin/companies/${companyId}/request-documents`, {
    ...payload,
    contextCompanyId: companyId,
  });

const setUserStatus = (userId: string, payload: { status: "active" | "inactive" | "suspended"; reason?: string }) =>
  httpClient.patch<{ user: AdminUser }>(`/admin/users/${userId}/status`, payload).then((r) => r.user);

const listOpsRequests = (params?: {
  kind?: "all" | "service" | "business_setup";
  statusBucket?: "all" | "open" | "closed" | "rejected";
  status?: string;
  priority?: string;
  serviceType?: string;
  companyId?: string;
  assignedTo?: string;
  createdBy?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}) =>
  httpClient.get<{ requests: AdminOpsRequest[]; counts: AdminOpsCounts; pagination: Pagination }>(
    "/admin/ops-requests",
    { params: toQuery(params as Record<string, unknown>) }
  );

const getServiceRequestById = (id: string) =>
  httpClient.get<{ request: AdminServiceRequest }>(`/admin/service-requests/${id}`).then((r) => r.request);

const getBusinessSetupRequestById = (id: string) =>
  httpClient.get<{ request: AdminBusinessSetupRequest }>(`/admin/business-setup-requests/${id}`).then((r) => r.request);

// Company-scoped admins must echo the request's company as `contextCompanyId`
// (ensureAdminContextScope on the backend). Super-admins may omit it; when present
// it is validated to match, so passing it is always safe. Callers should only
// include it when the request actually has a company — see AdminRequestActions'
// history: sending `undefined` where a company is required is fine, but a
// company-less request must NOT get a stray contextCompanyId either way.
type OpsWorkflowPayload = {
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  slaDueAt?: string | null;
  note?: string;
  reason: string;
  contextCompanyId?: string;
  expectedUpdatedAt?: string;
};

const updateServiceRequestWorkflow = (id: string, payload: OpsWorkflowPayload) =>
  httpClient.patch<{ request: AdminServiceRequest }>(`/admin/service-requests/${id}/workflow`, payload);

const updateBusinessSetupRequestWorkflow = (id: string, payload: OpsWorkflowPayload) =>
  httpClient.patch<{ request: AdminBusinessSetupRequest }>(`/admin/business-setup-requests/${id}/workflow`, payload);

const listAuditEvents = (params?: { userId?: string; companyId?: string; action?: string; limit?: number; offset?: number }) =>
  httpClient.get<{ events: AdminAuditEvent[]; pagination: Pagination }>(
    "/admin/audit-events",
    { params: toQuery(params as Record<string, unknown>) }
  );

// ── In-house products ─────────────────────────────────────────────────────────

const listInhouseProductCategories = () =>
  httpClient.get<{ categories: ProductCategory[] }>("/admin/inhouse-products/categories");

const listInhouseProducts = (params?: {
  status?: string;
  visibility?: "public" | "private";
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  includeVariantSummary?: boolean;
}) =>
  httpClient.get<{ products: AdminInhouseProduct[]; pagination: Pagination }>(
    "/admin/inhouse-products",
    { params: toQuery(params as Record<string, unknown>) }
  );

const getInhouseProduct = (productId: string) =>
  httpClient.get<{ product: AdminInhouseProduct }>(`/admin/inhouse-products/${productId}`).then((r) => r.product);

const createInhouseProduct = (payload: CreateProductInput) =>
  httpClient.post<{ product: AdminInhouseProduct }>("/admin/inhouse-products", payload).then((r) => r.product);

const updateInhouseProduct = (productId: string, payload: Partial<CreateProductInput>) =>
  httpClient.put<{ product: AdminInhouseProduct }>(`/admin/inhouse-products/${productId}`, payload).then((r) => r.product);

const adjustInhouseProductQuantity = (productId: string, adjustment: number) =>
  httpClient.patch<{ product: AdminInhouseProduct }>(`/admin/inhouse-products/${productId}/quantity`, { adjustment }).then((r) => r.product);

const deleteInhouseProduct = (productId: string) =>
  httpClient.delete<{ success: boolean }>(`/admin/inhouse-products/${productId}`);

export const adminService = {
  getStats,
  getOverview,
  listUsers,
  getUserOverview,
  listCompanies,
  setCompanyStatus,
  archiveCompany,
  hardDeleteCompany,
  requestCompanyDocuments,
  setUserStatus,
  listOpsRequests,
  getServiceRequestById,
  getBusinessSetupRequestById,
  updateServiceRequestWorkflow,
  updateBusinessSetupRequestWorkflow,
  listAuditEvents,
  listInhouseProductCategories,
  listInhouseProducts,
  getInhouseProduct,
  createInhouseProduct,
  updateInhouseProduct,
  adjustInhouseProductQuantity,
  deleteInhouseProduct,
};
