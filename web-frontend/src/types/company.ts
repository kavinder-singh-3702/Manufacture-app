export type CompanyAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
};

export type CompanyContact = {
  email?: string;
  phone?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
};

export type CompanySocialLinks = {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
};

export type CompanyDocumentAttachment = {
  name?: string;
  url?: string;
  type?: string;
  verifiedAt?: string;
  uploadedAt?: string;
};

export type CompanyDocuments = {
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  registrationNumber?: string;
  attachments?: CompanyDocumentAttachment[];
};

export type CompanySummary = {
  id: string;
  displayName: string;
  status?: string;
  complianceStatus?: string;
  type?: string;
};

export type Company = {
  id: string;
  displayName: string;
  legalName?: string;
  type?: string;
  categories?: string[];
  status?: string;
  complianceStatus?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  foundedAt?: string;
  sizeBucket?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  contact?: CompanyContact;
  headquarters?: CompanyAddress;
  locations?: CompanyAddress[];
  socialLinks?: CompanySocialLinks;
  documents?: CompanyDocuments;
};

export type CreateCompanyPayload = {
  displayName: string;
  type?: string;
  categories?: string[];
  slug?: string;
  description?: string;
  foundedAt?: string;
  sizeBucket?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  contact?: CompanyContact;
  headquarters?: CompanyAddress;
  locations?: CompanyAddress[];
  socialLinks?: CompanySocialLinks;
};

export type UpdateCompanyPayload = Partial<CreateCompanyPayload> & {
  legalName?: string;
};

export type SwitchCompanyResponse = {
  activeCompany: string;
  company: Company;
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
