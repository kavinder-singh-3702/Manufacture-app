export type CompanySummary = {
  id: string;
  displayName: string;
  status?: string;
  complianceStatus?: string;
  type?: string;
};

export type CompanyVerificationStatus = "pending" | "approved" | "rejected";

export type CompanyVerificationDocument = {
  fileName?: string;
  contentType?: string;
  url?: string;
  uploadedAt?: string;
  size?: number;
  key?: string;
};

export type CompanyVerificationDocumentUpload = {
  fileName: string;
  mimeType: string;
  content: string;
};

export type CompanyVerificationAuditEntry = {
  action: "submitted" | "approved" | "rejected";
  at?: string;
  by?: {
    id?: string;
    displayName?: string;
    email?: string;
  };
  notes?: string;
};

export type CompanyVerificationRequest = {
  id: string;
  status: CompanyVerificationStatus;
  notes?: string;
  decisionNotes?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  decidedAt?: string;
  company?: CompanySummary;
  requestedBy?: {
    id: string;
    displayName?: string;
    email?: string;
  };
  decidedBy?: {
    id: string;
    displayName?: string;
    email?: string;
  };
  documents?: {
    gstCertificate?: CompanyVerificationDocument;
    aadhaarCard?: CompanyVerificationDocument;
  };
  auditTrail?: CompanyVerificationAuditEntry[];
};

export type CompanyVerificationLatestResponse = {
  company: CompanySummary;
  request: CompanyVerificationRequest | null;
};
