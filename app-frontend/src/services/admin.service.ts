import { apiClient } from "./apiClient";
import { PreferenceSummary } from "./preference.service";

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
  campaigns: {
    active: number;
    draft: number;
    expired: number;
    archived: number;
    total: number;
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
}

export const adminService = new AdminService();
