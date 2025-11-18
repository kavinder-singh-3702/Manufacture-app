import { httpClient } from "../lib/http-client";
import { CompanyVerificationRequest } from "../types/company";

type ListRequestsResponse = {
  requests: CompanyVerificationRequest[];
};

type DecideRequestPayload = {
  action: "approve" | "reject";
  notes?: string;
  rejectionReason?: string;
};

const list = (params?: { status?: string }) =>
  httpClient.get<ListRequestsResponse>("/verification-requests", { params });

const decide = (requestId: string, payload: DecideRequestPayload) =>
  httpClient.patch<{ request: CompanyVerificationRequest }>(`/verification-requests/${requestId}`, payload);

export const companyVerificationService = {
  list,
  decide,
};
