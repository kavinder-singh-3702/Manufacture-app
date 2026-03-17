import { apiClient } from "./apiClient";
import { PreferenceSummary } from "./preference.service";
import { CreateProductInput, Product, ProductCategory, ProductImage } from "./product.service";
import { ProductVariant, ProductVariantStatus, ProductVariantUpsertInput } from "./productVariant.service";

// ============================================================
// ADMIN STATS TYPES
// ============================================================
// These types match what the backend returns from GET /api/admin/stats

export type AdminStats = {
  users: {
    total: number;
    active: number;
  };
  companies: {
    total: number;
    active: number;
  };
  verifications: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  today: {
    newVerifications: number;
    newUsers: number;
  };
};

// ============================================================
// ADMIN COMPANY TYPE
// ============================================================
export type AdminCompany = {
  id: string;
  displayName: string;
  legalName?: string;
  type: string;
  status: string;
  complianceStatus?: string;
  categories: string[];
  logoUrl?: string;
  owner: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  documentsRequestedAt?: string;
  archivedAt?: string;
  archivedBy?: string;
  deactivatedReason?: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// ADMIN USER TYPE
// ============================================================
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

// ============================================================
// PAGINATION TYPE
// ============================================================
export type Pagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type AdminOverview = {
  stats: AdminStats;
  verificationAging: {
    lt24h: number;
    from24hTo72h: number;
    gt72h: number;
  };
  notificationDispatchHealth: {
    last24h: number;
    delivered: number;
    failed: number;
    successRate: number;
  };
  servicesQueue?: {
    pending: number;
    inProgress: number;
    overdue: number;
    unresolved: number;
  };
  communications?: {
    conversationsLast24h: number;
    callsLast24h: number;
    totalCallDurationSeconds: number;
  };
};

export type AdminAuditEvent = {
  id: string;
  action: string;
  category?: string;
  label?: string;
  description?: string;
  actor?: {
    id: string;
    displayName?: string;
    email?: string;
    role?: string;
  } | null;
  company?: {
    id: string;
    displayName?: string;
    status?: string;
  } | null;
  companyName?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

export type AdminServiceRequestActor = {
  id: string;
  displayName?: string;
  email?: string;
  role?: string;
};

export type AdminServiceRequestTimelineEntry = {
  type: "status" | "assignment" | "note";
  at: string;
  entry: Record<string, any>;
};

export type AdminServiceRequest = {
  id: string;
  serviceType: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  company?: {
    id: string;
    displayName?: string;
    status?: string;
    type?: string;
    complianceStatus?: string;
  } | null;
  createdBy?: AdminServiceRequestActor | null;
  assignedTo?: AdminServiceRequestActor | null;
  lastUpdatedBy?: AdminServiceRequestActor | null;
  slaDueAt?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  lastActionAt?: string;
  createdAt: string;
  updatedAt: string;
  timeline?: AdminServiceRequestTimelineEntry[];
  statusHistory?: Array<Record<string, any>>;
  assignmentHistory?: Array<Record<string, any>>;
  internalNotes?: Array<Record<string, any>>;
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
  company?: {
    id: string;
    displayName?: string;
    status?: string;
    type?: string;
    complianceStatus?: string;
  } | null;
  createdBy?: AdminServiceRequestActor | null;
  assignedTo?: AdminServiceRequestActor | null;
  lastUpdatedBy?: AdminServiceRequestActor | null;
  createdAt: string;
  updatedAt: string;
  timeline?: AdminServiceRequestTimelineEntry[];
};

export type AdminOpsRequest = {
  id: string;
  kind: "service" | "business_setup";
  title: string;
  status: string;
  priority: string;
  company?: {
    id: string;
    displayName?: string;
    status?: string;
    type?: string;
    complianceStatus?: string;
  } | null;
  createdBy?: AdminServiceRequestActor | null;
  assignedTo?: AdminServiceRequestActor | null;
  createdAt: string;
  updatedAt: string;
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

export type AdminInhouseProduct = Product;
export type AdminInhouseVariant = ProductVariant;

export type AdminConversationQueueItem = {
  id: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participantIds: string[];
  otherParticipant?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    activeCompany?: string;
  } | null;
  linkedServiceRequest?: {
    id: string;
    title?: string;
    status?: string;
    priority?: string;
    updatedAt?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCallLog = {
  id: string;
  conversationId?: string | null;
  caller?: AdminServiceRequestActor | null;
  callee?: AdminServiceRequestActor | null;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

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
      assignedTo?: AdminServiceRequestActor | null;
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
      recent: AdminCallLog[];
    };
  };
};

// ============================================================
// ADMIN SERVICE
// ============================================================
// Service for admin-only API endpoints

class AdminService {
  /**
   * Get admin dashboard statistics
   * Requires admin role
   *
   * @returns Stats object with user counts, company counts, and verification counts
   */
  async getStats(): Promise<AdminStats> {
    // Backend returns { stats: {...} }
    const response = await apiClient.get<{ stats: AdminStats }>("/admin/stats");
    return response.stats;
  }

  async getOverview(): Promise<AdminOverview> {
    const response = await apiClient.get<{ overview: AdminOverview }>("/admin/overview");
    return response.overview;
  }

  /**
   * List all companies (admin only)
   * @param params - Optional filter params (status, search, limit, offset)
   * @returns Companies array and pagination info
   */
  async listCompanies(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sort?: "createdAt:desc" | "createdAt:asc" | "updatedAt:desc" | "updatedAt:asc";
  }): Promise<{ companies: AdminCompany[]; pagination: Pagination }> {
    const response = await apiClient.get<{
      companies: AdminCompany[];
      pagination: Pagination;
    }>("/admin/companies", { params });
    return response;
  }

  /**
   * List all users (admin only)
   * @param params - Optional filter params (status, search, limit, offset)
   * @returns Users array and pagination info
   */
  async listUsers(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sort?: "createdAt:desc" | "createdAt:asc" | "updatedAt:desc" | "updatedAt:asc";
    companyId?: string;
  }): Promise<{ users: AdminUser[]; pagination: Pagination }> {
    const response = await apiClient.get<{
      users: AdminUser[];
      pagination: Pagination;
    }>("/admin/users", { params });
    return response;
  }

  async getUserOverview(userId: string, params?: { limit?: number }): Promise<AdminUserOverview> {
    const response = await apiClient.get<{ overview: AdminUserOverview }>(`/admin/users/${userId}/overview`, { params });
    return response.overview;
  }

  /**
   * Delete a company (admin only)
   * @param companyId - The ID of the company to delete
   * @returns Success message and deleted company ID
   */
  async deleteCompany(companyId: string, payload?: { reason?: string; contextCompanyId?: string }): Promise<{
    success: boolean;
    message: string;
    deprecated?: boolean;
    company?: AdminCompany;
  }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
      deprecated?: boolean;
      company?: AdminCompany;
    }>(`/admin/companies/${companyId}`, { data: payload ?? {} } as any);
    return response;
  }

  async archiveCompany(
    companyId: string,
    payload?: { reason?: string; contextCompanyId?: string }
  ): Promise<{ success: boolean; message: string; company: AdminCompany }> {
    return apiClient.post<{ success: boolean; message: string; company: AdminCompany }>(
      `/admin/companies/${companyId}/archive`,
      payload ?? {}
    );
  }

  async setCompanyStatus(
    companyId: string,
    payload: { status: string; reason?: string; contextCompanyId?: string }
  ): Promise<{ success: boolean; message: string; company: AdminCompany }> {
    return apiClient.patch<{ success: boolean; message: string; company: AdminCompany }>(
      `/admin/companies/${companyId}/status`,
      payload
    );
  }

  async hardDeleteCompany(
    companyId: string,
    payload: { reason: string; contextCompanyId?: string }
  ): Promise<{ success: boolean; message: string; job: { id: string; status: string } }> {
    return apiClient.post<{ success: boolean; message: string; job: { id: string; status: string } }>(
      `/admin/companies/${companyId}/hard-delete`,
      payload
    );
  }

  /**
   * Request documents from a company for verification (admin only)
   * Sends an email and notification to the company owner requesting them to submit documents
   * @param companyId - The ID of the company to request documents from
   * @param payload - Optional message and notification preferences
   * @returns Success status and message
   */
  async requestDocuments(
    companyId: string,
    payload?: {
        message?: string;
        sendEmail?: boolean;
        sendNotification?: boolean;
        contextCompanyId?: string;
      }
  ): Promise<{
    success: boolean;
    message: string;
    emailSent?: boolean;
    notificationSent?: boolean;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      emailSent?: boolean;
      notificationSent?: boolean;
    }>(`/admin/companies/${companyId}/request-documents`, payload ?? {});
    return response;
  }

  /**
   * Get a summary of a user's product intent signals (admin only)
   */
  async getUserPreferences(userId: string, params?: { days?: number; limit?: number; companyId?: string }): Promise<PreferenceSummary> {
    const response = await apiClient.get<{ summary: PreferenceSummary }>(`/preferences/admin/users/${userId}`, {
      params,
    });
    return response.summary;
  }

  async listAuditEvents(params?: {
    userId?: string;
    companyId?: string;
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: AdminAuditEvent[]; pagination: Pagination }> {
    return apiClient.get<{ events: AdminAuditEvent[]; pagination: Pagination }>("/admin/audit-events", { params });
  }

  async listServiceRequests(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: "createdAt:desc" | "createdAt:asc" | "updatedAt:desc" | "updatedAt:asc" | "priority:desc" | "slaDueAt:asc";
    status?: string;
    priority?: string;
    serviceType?: string;
    companyId?: string;
    assignedTo?: string;
    createdBy?: string;
    from?: string;
    to?: string;
  }): Promise<{ requests: AdminServiceRequest[]; pagination: Pagination }> {
    return apiClient.get<{ requests: AdminServiceRequest[]; pagination: Pagination }>("/admin/service-requests", { params });
  }

  async listBusinessSetupRequests(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: "createdAt:desc" | "createdAt:asc" | "updatedAt:desc" | "updatedAt:asc" | "priority:desc" | "slaDueAt:asc";
    status?: string;
    priority?: string;
    source?: "authenticated" | "guest";
    companyId?: string;
    assignedTo?: string;
    createdBy?: string;
    from?: string;
    to?: string;
  }): Promise<{ requests: AdminBusinessSetupRequest[]; pagination: Pagination }> {
    return apiClient.get<{ requests: AdminBusinessSetupRequest[]; pagination: Pagination }>(
      "/admin/business-setup-requests",
      { params }
    );
  }

  async listOpsRequests(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: "createdAt:desc" | "createdAt:asc" | "updatedAt:desc" | "updatedAt:asc" | "priority:desc";
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
  }): Promise<{ requests: AdminOpsRequest[]; pagination: Pagination }> {
    return apiClient.get<{ requests: AdminOpsRequest[]; pagination: Pagination }>("/admin/ops-requests", { params });
  }

  async getServiceRequestById(serviceRequestId: string): Promise<AdminServiceRequest> {
    const response = await apiClient.get<{ request: AdminServiceRequest }>(`/admin/service-requests/${serviceRequestId}`);
    return response.request;
  }

  async getBusinessSetupRequestById(requestId: string): Promise<AdminBusinessSetupRequest> {
    const response = await apiClient.get<{ request: AdminBusinessSetupRequest }>(
      `/admin/business-setup-requests/${requestId}`
    );
    return response.request;
  }

  async updateServiceRequestWorkflow(
    serviceRequestId: string,
    payload: {
      status?: string;
      priority?: string;
      assignedTo?: string | null;
      slaDueAt?: string | null;
      note?: string;
      reason: string;
      contextCompanyId?: string;
      expectedUpdatedAt?: string;
    }
  ): Promise<{ request: AdminServiceRequest; message: string }> {
    return apiClient.patch<{ request: AdminServiceRequest; message: string }>(
      `/admin/service-requests/${serviceRequestId}/workflow`,
      payload
    );
  }

  async updateServiceRequestContent(
    serviceRequestId: string,
    payload: {
      updates: Record<string, unknown>;
      reason: string;
      contextCompanyId?: string;
      expectedUpdatedAt?: string;
    }
  ): Promise<{ request: AdminServiceRequest; message: string }> {
    return apiClient.patch<{ request: AdminServiceRequest; message: string }>(
      `/admin/service-requests/${serviceRequestId}/content`,
      payload
    );
  }

  async updateBusinessSetupRequestWorkflow(
    requestId: string,
    payload: {
      status?: string;
      priority?: string;
      assignedTo?: string | null;
      slaDueAt?: string | null;
      note?: string;
      reason: string;
      contextCompanyId?: string;
      expectedUpdatedAt?: string;
    }
  ): Promise<{ request: AdminBusinessSetupRequest; message: string }> {
    return apiClient.patch<{ request: AdminBusinessSetupRequest; message: string }>(
      `/admin/business-setup-requests/${requestId}/workflow`,
      payload
    );
  }

  async listConversations(params?: {
    search?: string;
    userId?: string;
    companyId?: string;
    sort?: "updatedAt:desc" | "updatedAt:asc" | "lastMessageAt:desc" | "lastMessageAt:asc";
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: AdminConversationQueueItem[]; pagination: Pagination }> {
    return apiClient.get<{ conversations: AdminConversationQueueItem[]; pagination: Pagination }>("/admin/conversations", { params });
  }

  async listCallLogs(params?: {
    userId?: string;
    companyId?: string;
    from?: string;
    to?: string;
    minDuration?: number;
    maxDuration?: number;
    sort?: "startedAt:desc" | "startedAt:asc" | "duration:desc" | "duration:asc";
    limit?: number;
    offset?: number;
  }): Promise<{ callLogs: AdminCallLog[]; pagination: Pagination }> {
    return apiClient.get<{ callLogs: AdminCallLog[]; pagination: Pagination }>("/admin/call-logs", { params });
  }

  async listInhouseProductCategories(): Promise<{ categories: ProductCategory[] }> {
    return apiClient.get<{ categories: ProductCategory[] }>("/admin/inhouse-products/categories");
  }

  async listInhouseProducts(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: "draft" | "active" | "inactive" | "archived";
    visibility?: "public" | "private";
    search?: string;
    sort?: "createdAt:desc" | "createdAt:asc" | "priceAsc" | "priceDesc" | "ratingDesc";
    minPrice?: number;
    maxPrice?: number;
    includeVariantSummary?: boolean;
  }): Promise<{ products: AdminInhouseProduct[]; pagination: Pagination }> {
    return apiClient.get<{ products: AdminInhouseProduct[]; pagination: Pagination }>("/admin/inhouse-products", { params });
  }

  async getInhouseProductById(productId: string, params?: { includeVariantSummary?: boolean }): Promise<AdminInhouseProduct> {
    const response = await apiClient.get<{ product: AdminInhouseProduct }>(`/admin/inhouse-products/${productId}`, { params });
    return response.product;
  }

  async createInhouseProduct(payload: CreateProductInput): Promise<AdminInhouseProduct> {
    const response = await apiClient.post<{ product: AdminInhouseProduct }>("/admin/inhouse-products", payload);
    return response.product;
  }

  async updateInhouseProduct(productId: string, payload: Partial<CreateProductInput>): Promise<AdminInhouseProduct> {
    const response = await apiClient.put<{ product: AdminInhouseProduct }>(`/admin/inhouse-products/${productId}`, payload);
    return response.product;
  }

  async adjustInhouseProductQuantity(productId: string, adjustment: number): Promise<AdminInhouseProduct> {
    const response = await apiClient.patch<{ product: AdminInhouseProduct }>(
      `/admin/inhouse-products/${productId}/quantity`,
      { adjustment }
    );
    return response.product;
  }

  async deleteInhouseProduct(productId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/admin/inhouse-products/${productId}`);
  }

  async uploadInhouseProductImage(
    productId: string,
    payload: { fileName: string; mimeType?: string; content: string }
  ): Promise<{ product: AdminInhouseProduct; image: ProductImage }> {
    return apiClient.post<{ product: AdminInhouseProduct; image: ProductImage }>(
      `/admin/inhouse-products/${productId}/images`,
      payload
    );
  }

  async listInhouseProductVariants(
    productId: string,
    params?: { limit?: number; offset?: number; status?: ProductVariantStatus }
  ): Promise<{ variants: AdminInhouseVariant[]; pagination: Pagination }> {
    return apiClient.get<{ variants: AdminInhouseVariant[]; pagination: Pagination }>(
      `/admin/inhouse-products/${productId}/variants`,
      { params }
    );
  }

  async getInhouseProductVariantById(productId: string, variantId: string): Promise<AdminInhouseVariant> {
    const response = await apiClient.get<{ variant: AdminInhouseVariant }>(
      `/admin/inhouse-products/${productId}/variants/${variantId}`
    );
    return response.variant;
  }

  async createInhouseProductVariant(productId: string, payload: ProductVariantUpsertInput): Promise<AdminInhouseVariant> {
    const response = await apiClient.post<{ variant: AdminInhouseVariant }>(
      `/admin/inhouse-products/${productId}/variants`,
      payload
    );
    return response.variant;
  }

  async updateInhouseProductVariant(
    productId: string,
    variantId: string,
    payload: Partial<ProductVariantUpsertInput>
  ): Promise<AdminInhouseVariant> {
    const response = await apiClient.put<{ variant: AdminInhouseVariant }>(
      `/admin/inhouse-products/${productId}/variants/${variantId}`,
      payload
    );
    return response.variant;
  }

  async adjustInhouseProductVariantQuantity(
    productId: string,
    variantId: string,
    adjustment: number
  ): Promise<AdminInhouseVariant> {
    const response = await apiClient.patch<{ variant: AdminInhouseVariant }>(
      `/admin/inhouse-products/${productId}/variants/${variantId}/quantity`,
      { adjustment }
    );
    return response.variant;
  }

  async deleteInhouseProductVariant(productId: string, variantId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/admin/inhouse-products/${productId}/variants/${variantId}`);
  }
}

export const adminService = new AdminService();
