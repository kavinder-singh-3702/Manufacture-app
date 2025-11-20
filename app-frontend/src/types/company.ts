// Company verification Statuses

export type CompanyStatus =
    | "pending-verification"
    | "active"
    | "inactive"
    | "suspended"
    | "archived";


export type ComplianceStatus =
    | "pending"
    | "submitted"
    | "approved"
    | "rejected";


export type VerificationStatus =
    | "pending"
    | "approved"
    | "rejected";

// Document Structure 

export type DocumentFile = {
    fileName: string;
    contentType: string;
    url: string;
    key: string;
    size: number;
    uploadedAt: string;

};

// Company Structure 

export type Company = {
    id: string;
    displayName: string;
    legalName?: string;
    type: "normal" | "trader" | "manufacturer";
    status: CompanyStatus;
    complianceStatus: ComplianceStatus;
    logoUrl?: string;
    createdAt: string;
    updatedAt: string;
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