// Company verification Statuses
export type CompanyStatus = "pending-verification" | "active" | "inactive" | "suspended" | "archived";

export type ComplianceStatus = "pending" | "submitted" | "approved" | "rejected";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type CompanyAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
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
  github?: string;
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

export type Company = {
  id: string;
  displayName: string;
  legalName?: string;
  type: "normal" | "trader" | "manufacturer";
  categories?: string[];
  status?: CompanyStatus;
  complianceStatus?: ComplianceStatus;
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

export type CompanySummary = {
  id: string;
  displayName: string;
  status?: CompanyStatus;
  complianceStatus?: ComplianceStatus;
  type?: Company["type"];
};

export type CreateCompanyPayload = {
  displayName: string;
  type?: Company["type"];
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

export type UploadCompanyFilePayload = {
  fileName: string;
  mimeType?: string;
  content: string;
  purpose?: "logo" | "cover" | "asset";
};

// Document Structure
export type DocumentFile = {
  fileName: string;
  contentType: string;
  url: string;
  key: string;
  size: number;
  uploadedAt: string;
};

// User reference in verification requests
export type UserReference = {
  id: string;
  displayName: string;
  email: string;
};

// Verification Request Structure
export type VerificationRequest = {
  id: string;
  company: Company;
  status: VerificationStatus;
  documents: {
    gstCertificate?: DocumentFile;
    aadhaarCard?: DocumentFile;
  };
  notes?: string;
  requestedBy: UserReference;
  decidedBy?: UserReference;
  decidedAt?: string;
  decisionNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

// PayLoad for submitting a verification Request
export type SubmitVerificationPayload = {
  gstCertificate: {
    fileName: string;
    mimeType: string;
    content: string; // base64 encoded
  };

  aadhaarCard: {
    fileName: string;
    mimeType: string;
    content: string; // base64 encoded
  };
  notes?: string;
};

// Response for getting verification status
export type VerificationStatusResponse = {
  company: Company;
  request: VerificationRequest | null;
};

// Payload for admin decision
export type VerificationDecisionPayload = {
  action: "approve" | "reject";
  notes?: string;
  rejectionReason?: string;
};
