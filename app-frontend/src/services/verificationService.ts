import { apiClient } from "./apiClient";
import {
  VerificationRequest,
  VerificationStatusResponse,
  VerificationDecisionPayload,
} from "../types/company";
import { PickedDocument } from "../components/company/DocumentUploader";

class VerificationService {

    //Submit verification request for a company
  
  async submitVerification(companyId: string, payload: { gstCertificate: PickedDocument; aadhaarCard: PickedDocument; notes?: string }): Promise<VerificationRequest> {
    const form = new FormData();

    console.log("GST Document:", JSON.stringify(payload.gstCertificate));
    console.log("Aadhaar Document:", JSON.stringify(payload.aadhaarCard));

    // React Native requires this specific format for file uploads
    const gstFile = {
      uri: payload.gstCertificate.uri,
      type: payload.gstCertificate.mimeType || "application/octet-stream",
      name: payload.gstCertificate.fileName || "gst-certificate",
    };

    const aadhaarFile = {
      uri: payload.aadhaarCard.uri,
      type: payload.aadhaarCard.mimeType || "application/octet-stream",
      name: payload.aadhaarCard.fileName || "aadhaar-card",
    };

    console.log("Appending GST file:", JSON.stringify(gstFile));
    console.log("Appending Aadhaar file:", JSON.stringify(aadhaarFile));

    form.append("gstCertificate", gstFile as unknown as Blob);
    form.append("aadhaarCard", aadhaarFile as unknown as Blob);

    if (payload.notes) {
      form.append("notes", payload.notes);
    }

    console.log("Submitting verification for company:", companyId);
    const response = await apiClient.post<VerificationRequest>(`/companies/${companyId}/verification`, form);
    return response;
  }

//Get verification status for a company


  async getVerificationStatus(
    companyId: string
  ): Promise<VerificationStatusResponse> {
    const response = await apiClient.get<VerificationStatusResponse>(
      `/companies/${companyId}/verification`
    );
    return response;
  }

  //Admin: List all verification requests
  // Backend returns { requests: [...] } so we need to extract the array

  async listVerificationRequests(params?: {
    status?: "pending" | "approved" | "rejected";
    search?: string;
    limit?: number;
    offset?: number;
    sort?: "createdAt:desc" | "createdAt:asc" | "updatedAt:desc" | "updatedAt:asc";
    companyId?: string;
  }): Promise<{
    requests: VerificationRequest[];
    pagination?: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    const response = await apiClient.get<{
      requests: VerificationRequest[];
      pagination?: { total: number; limit: number; offset: number; hasMore: boolean };
    }>("/verification-requests", { params });
    return {
      requests: response.requests || [],
      pagination: response.pagination,
    };
  }

  //Admin: Approve or reject a verification request
  // Backend returns { request: {...} } so we need to extract the object

  async decideVerification(
    requestId: string,
    payload: VerificationDecisionPayload
  ): Promise<VerificationRequest> {
    // Backend wraps the response in { request: {...} }
    const response = await apiClient.patch<{ request: VerificationRequest }>(
      `/verification-requests/${requestId}`,
      payload
    );
    return response.request;
  }
}

export const verificationService = new VerificationService();
