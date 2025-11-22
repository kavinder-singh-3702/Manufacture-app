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

  async listVerificationRequests(
    status?: "pending" | "approved" | "rejected"
  ): Promise<VerificationRequest[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<VerificationRequest[]>(
      "/verification-requests",
      { params }
    );
    return response;
  }

  //Admin: Approve or reject a verification request
  
  async decideVerification(
    requestId: string,
    payload: VerificationDecisionPayload
  ): Promise<VerificationRequest> {
    const response = await apiClient.patch<VerificationRequest>(
      `/verification-requests/${requestId}`,
      payload
    );
    return response;
  }
}

export const verificationService = new VerificationService();
