import { httpClient } from "../lib/http-client";
import {
  CompanyVerificationDocumentUpload,
  CompanyVerificationLatestResponse,
  CompanyVerificationRequest,
} from "../types/company";

type ListRequestsResponse = {
  requests: CompanyVerificationRequest[];
};

type DecideRequestPayload = {
  action: "approve" | "reject";
  notes?: string;
  rejectionReason?: string;
};

type SubmitVerificationPayload = {
  gstCertificate: CompanyVerificationDocumentUpload;
  aadhaarCard: CompanyVerificationDocumentUpload;
  notes?: string;
};

const list = (params?: { status?: string }) =>
  httpClient.get<ListRequestsResponse>("/verification-requests", { params });

const decide = (requestId: string, payload: DecideRequestPayload) =>
  httpClient.patch<{ request: CompanyVerificationRequest }>(`/verification-requests/${requestId}`, payload);

const getLatest = (companyId: string) =>
  httpClient.get<CompanyVerificationLatestResponse>(`/companies/${companyId}/verification`);

const submit = (companyId: string, payload: SubmitVerificationPayload) =>
  httpClient.post<{ request: CompanyVerificationRequest }>(`/companies/${companyId}/verification`, payload);

export const companyVerificationService = {
  list,
  decide,
  getLatest,
  submit,
};
