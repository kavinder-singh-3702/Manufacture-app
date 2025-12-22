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
  async deleteCompany(companyId: string): Promise<{
    success: boolean;
    message: string;
    deletedCompanyId: string;
  }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
      deletedCompanyId: string;
    }>(`/admin/companies/${companyId}`);
    return response;
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
}

export const adminService = new AdminService();
