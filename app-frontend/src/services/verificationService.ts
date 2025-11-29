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
    form.append("gstCertificate", {
      uri: payload.gstCertificate.uri,
      name: payload.gstCertificate.fileName,
      type: payload.gstCertificate.mimeType,
    } as any);
    form.append("aadhaarCard", {
      uri: payload.aadhaarCard.uri,
      name: payload.aadhaarCard.fileName,
      type: payload.aadhaarCard.mimeType,
    } as any);
    if (payload.notes) {
      form.append("notes", payload.notes);
    }

    const response = await apiClient.post<VerificationRequest>(`/companies/${companyId}/verification`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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

  async listVerificationRequests(
    status?: "pending" | "approved" | "rejected"
  ): Promise<VerificationRequest[]> {
    const params = status ? { status } : {};
    // Backend wraps the array in { requests: [...] }
    const response = await apiClient.get<{ requests: VerificationRequest[] }>(
      "/verification-requests",
      { params }
    );
    // Return the requests array, or empty array if undefined
    return response.requests || [];
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
