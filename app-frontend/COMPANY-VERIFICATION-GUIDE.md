# 🎓 Company Verification System - Frontend Implementation Guide

> **For Beginners**: This guide will help you understand and build the BlaBlaCar-style company verification UI in your React Native app.

---

## 📖 Table of Contents

1. [What We're Building](#what-were-building)
2. [Backend API Overview](#backend-api-overview)
3. [Frontend Requirements](#frontend-requirements)
4. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)
5. [Code Examples & Patterns](#code-examples--patterns)
6. [Testing Guide](#testing-guide)

---

## 🎯 What We're Building

### The Goal
Create a **BlaBlaCar-style verification system** where:
- Companies can submit verification requests with GST certificate and Aadhaar documents
- Profile pictures/avatars show a **colored border** indicating verification status
- Admins can review and approve/reject verification requests
- Full audit trail of all verification activities

### Visual Indicators

```
Company Status → Border Color
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
unverified           → 🟡 Yellow (#F59E0B)
pending             → 🔵 Blue   (#3B82F6)
verified/approved   → 🟢 Green  (#11A440) - Your brand color!
rejected            → 🔴 Red    (#DC2626)
```

---

## 🔌 Backend API Overview

### Your Backend is FULLY READY! ✅

All these endpoints are already implemented and working:

#### 1. **Submit Verification Request** (User)
```http
POST /api/companies/:companyId/verification
Authorization: Bearer {token}
Content-Type: application/json

{
  "gstCertificate": {
    "fileName": "gst-cert.pdf",
    "mimeType": "application/pdf",
    "content": "base64_encoded_file_content_here"
  },
  "aadhaarCard": {
    "fileName": "aadhaar.jpg",
    "mimeType": "image/jpeg",
    "content": "base64_encoded_file_content_here"
  },
  "notes": "Please verify my company for trader account"
}
```

**Response:**
```json
{
  "id": "req_123",
  "company": {
    "id": "comp_456",
    "displayName": "My Manufacturing Co.",
    "status": "pending-verification",
    "complianceStatus": "submitted"
  },
  "status": "pending",
  "documents": {
    "gstCertificate": {
      "url": "https://s3.amazonaws.com/...",
      "fileName": "gst-cert.pdf",
      "uploadedAt": "2025-01-20T10:30:00.000Z"
    },
    "aadhaarCard": {
      "url": "https://s3.amazonaws.com/...",
      "fileName": "aadhaar.jpg",
      "uploadedAt": "2025-01-20T10:30:00.000Z"
    }
  },
  "requestedBy": {
    "id": "user_789",
    "displayName": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2025-01-20T10:30:00.000Z"
}
```

---

#### 2. **Get Verification Status** (User)
```http
GET /api/companies/:companyId/verification
Authorization: Bearer {token}
```

**Response:**
```json
{
  "company": {
    "id": "comp_456",
    "displayName": "My Manufacturing Co.",
    "status": "pending-verification",
    "complianceStatus": "submitted",
    "type": "trader"
  },
  "request": {
    "id": "req_123",
    "status": "pending",
    "documents": { ... },
    "createdAt": "2025-01-20T10:30:00.000Z",
    "decidedBy": null,
    "decidedAt": null,
    "rejectionReason": null
  }
}
```

---

#### 3. **List Pending Verifications** (Admin Only)
```http
GET /api/verification-requests?status=pending
Authorization: Bearer {admin_token}
```

**Response:**
```json
[
  {
    "id": "req_123",
    "company": {
      "id": "comp_456",
      "displayName": "My Manufacturing Co.",
      "status": "pending-verification",
      "type": "trader"
    },
    "status": "pending",
    "documents": {
      "gstCertificate": {
        "url": "https://...",
        "fileName": "gst-cert.pdf"
      },
      "aadhaarCard": {
        "url": "https://...",
        "fileName": "aadhaar.jpg"
      }
    },
    "requestedBy": {
      "id": "user_789",
      "displayName": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2025-01-20T10:30:00.000Z"
  }
]
```

---

#### 4. **Approve/Reject Verification** (Admin Only)
```http
PATCH /api/verification-requests/:requestId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "approve",
  "notes": "All documents verified successfully"
}

OR

{
  "action": "reject",
  "rejectionReason": "GST certificate is not clear, please resubmit",
  "notes": "Documents need to be more legible"
}
```

**Response on Approval:**
```json
{
  "id": "req_123",
  "company": {
    "id": "comp_456",
    "displayName": "My Manufacturing Co.",
    "status": "active",
    "complianceStatus": "approved"
  },
  "status": "approved",
  "decidedBy": {
    "id": "admin_001",
    "displayName": "Admin User",
    "email": "admin@example.com"
  },
  "decidedAt": "2025-01-20T14:30:00.000Z",
  "decisionNotes": "All documents verified successfully"
}
```

---

## 📱 Frontend Requirements

### What You Need to Build

#### 1. **Type Definitions** (TypeScript)
Create types for company and verification data.

#### 2. **API Service**
A service to communicate with the backend endpoints.

#### 3. **UI Components**
- **CompanyAvatar** - Shows company logo with colored border
- **VerificationBadge** - Green checkmark for verified companies
- **VerificationStatusCard** - Display current status
- **DocumentPicker** - Upload GST/Aadhaar documents
- **VerificationForm** - Complete submission form

#### 4. **Screens**
- **CompanyProfileScreen** - Shows verification status
- **VerificationSubmitScreen** - Form to submit documents
- **AdminVerificationScreen** - Admin review panel (optional for now)

---

## 🗺️ Step-by-Step Implementation Plan

### **Phase 1: Foundation (Setup Types & Services)**

#### Step 1.1: Create Company Types
**File:** `src/types/company.ts`

```typescript
// Company Verification Statuses
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

// Document structure
export type DocumentFile = {
  fileName: string;
  contentType: string;
  url: string;
  key: string;
  size: number;
  uploadedAt: string;
};

// Company structure
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

// Verification Request structure
export type VerificationRequest = {
  id: string;
  company: Company;
  status: VerificationStatus;
  documents: {
    gstCertificate?: DocumentFile;
    aadhaarCard?: DocumentFile;
  };
  notes?: string;
  requestedBy: {
    id: string;
    displayName: string;
    email: string;
  };
  decidedBy?: {
    id: string;
    displayName: string;
    email: string;
  };
  decidedAt?: string;
  decisionNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

// Payload for submitting verification
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
```

---

#### Step 1.2: Create API Service
**File:** `src/services/verification.service.ts`

```typescript
import { apiClient } from './apiClient';
import {
  VerificationRequest,
  SubmitVerificationPayload,
  Company
} from '../types/company';

class VerificationService {
  /**
   * Submit verification request for a company
   */
  async submitVerification(
    companyId: string,
    payload: SubmitVerificationPayload
  ): Promise<VerificationRequest> {
    const response = await apiClient.post(
      `/companies/${companyId}/verification`,
      payload
    );
    return response.data;
  }

  /**
   * Get verification status for a company
   */
  async getVerificationStatus(companyId: string): Promise<{
    company: Company;
    request: VerificationRequest | null;
  }> {
    const response = await apiClient.get(
      `/companies/${companyId}/verification`
    );
    return response.data;
  }

  /**
   * Admin: List all verification requests
   */
  async listVerificationRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<VerificationRequest[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/verification-requests', { params });
    return response.data;
  }

  /**
   * Admin: Approve or reject a verification request
   */
  async decideVerification(
    requestId: string,
    action: 'approve' | 'reject',
    notes?: string,
    rejectionReason?: string
  ): Promise<VerificationRequest> {
    const response = await apiClient.patch(
      `/verification-requests/${requestId}`,
      { action, notes, rejectionReason }
    );
    return response.data;
  }
}

export const verificationService = new VerificationService();
```

---

### **Phase 2: Build UI Components**

#### Step 2.1: Create CompanyAvatar with Colored Border
**File:** `src/components/company/CompanyAvatar.tsx`

```typescript
import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Company } from '../../types/company';

type Props = {
  company: Company;
  size?: number;
  style?: ViewStyle;
};

const getStatusColor = (status: Company['complianceStatus']): string => {
  switch (status) {
    case 'pending':
      return '#F59E0B'; // Yellow - Not verified
    case 'submitted':
      return '#3B82F6'; // Blue - Under review
    case 'approved':
      return '#11A440'; // Green - Verified (your brand color!)
    case 'rejected':
      return '#DC2626'; // Red - Rejected
    default:
      return '#9CA3AF'; // Gray - Unknown
  }
};

export const CompanyAvatar: React.FC<Props> = ({
  company,
  size = 80,
  style
}) => {
  const borderColor = getStatusColor(company.complianceStatus);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
        style,
      ]}
    >
      {company.logoUrl ? (
        <Image
          source={{ uri: company.logoUrl }}
          style={[
            styles.image,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
          ]}
        >
          <Text style={styles.placeholderText}>
            {company.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Verified Badge */}
      {company.complianceStatus === 'approved' && (
        <View style={[styles.badge, { bottom: 0, right: 0 }]}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6B7280',
  },
  badge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#11A440',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

---

#### Step 2.2: Create Verification Status Card
**File:** `src/components/company/VerificationStatusCard.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Company, VerificationRequest } from '../../types/company';

type Props = {
  company: Company;
  request?: VerificationRequest | null;
  onVerifyPress?: () => void;
};

const getStatusInfo = (status: Company['complianceStatus']) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Not Verified',
        color: '#F59E0B',
        message: 'Get verified to unlock all features',
        action: 'Start Verification',
      };
    case 'submitted':
      return {
        label: 'Under Review',
        color: '#3B82F6',
        message: 'Your documents are being reviewed by our team',
        action: 'View Status',
      };
    case 'approved':
      return {
        label: 'Verified',
        color: '#11A440',
        message: 'Your company is verified',
        action: null,
      };
    case 'rejected':
      return {
        label: 'Verification Rejected',
        color: '#DC2626',
        message: 'Please resubmit with correct documents',
        action: 'Resubmit',
      };
    default:
      return {
        label: 'Unknown',
        color: '#9CA3AF',
        message: '',
        action: null,
      };
  }
};

export const VerificationStatusCard: React.FC<Props> = ({
  company,
  request,
  onVerifyPress,
}) => {
  const statusInfo = getStatusInfo(company.complianceStatus);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.indicator, { backgroundColor: statusInfo.color }]} />
        <Text style={styles.label}>{statusInfo.label}</Text>
      </View>

      <Text style={styles.message}>{statusInfo.message}</Text>

      {request?.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
          <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
        </View>
      )}

      {statusInfo.action && onVerifyPress && (
        <TouchableOpacity style={styles.button} onPress={onVerifyPress}>
          <Text style={styles.buttonText}>{statusInfo.action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  rejectionBox: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#991B1B',
  },
  button: {
    backgroundColor: '#11A440',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

### **Phase 3: Document Upload & Form**

#### Step 3.1: Install Document Picker
You'll need to install a package to pick documents:

```bash
cd app-frontend
npx expo install expo-document-picker expo-file-system
```

---

#### Step 3.2: Create Document Picker Component
**File:** `src/components/company/DocumentUploader.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

type DocumentType = 'gstCertificate' | 'aadhaarCard';

type PickedDocument = {
  fileName: string;
  mimeType: string;
  base64: string;
  size: number;
};

type Props = {
  type: DocumentType;
  label: string;
  onDocumentPicked: (doc: PickedDocument) => void;
  pickedDocument?: PickedDocument;
};

export const DocumentUploader: React.FC<Props> = ({
  type,
  label,
  onDocumentPicked,
  pickedDocument,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const pickDocument = async () => {
    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];

      // Check file size (max 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 5MB');
        setIsLoading(false);
        return;
      }

      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const pickedDoc: PickedDocument = {
        fileName: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
        base64,
        size: file.size || 0,
      };

      onDocumentPicked(pickedDoc);
      setIsLoading(false);
    } catch (error) {
      console.error('Document picking error:', error);
      Alert.alert('Error', 'Failed to pick document');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.uploadButton,
          pickedDocument && styles.uploadButtonSuccess,
        ]}
        onPress={pickDocument}
        disabled={isLoading}
      >
        <Text style={styles.uploadButtonText}>
          {isLoading
            ? 'Loading...'
            : pickedDocument
            ? `✓ ${pickedDocument.fileName}`
            : 'Choose File'}
        </Text>
      </TouchableOpacity>

      {pickedDocument && (
        <Text style={styles.fileInfo}>
          Size: {(pickedDocument.size / 1024).toFixed(2)} KB
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadButtonSuccess: {
    borderColor: '#11A440',
    backgroundColor: '#F0FDF4',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  fileInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
```

---

#### Step 3.3: Create Verification Submit Screen
**File:** `src/screens/verification/VerificationSubmitScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DocumentUploader } from '../../components/company/DocumentUploader';
import { verificationService } from '../../services/verification.service';
import { SubmitVerificationPayload } from '../../types/company';

type PickedDocument = {
  fileName: string;
  mimeType: string;
  base64: string;
  size: number;
};

export const VerificationSubmitScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { companyId } = route.params as { companyId: string };

  const [gstDocument, setGstDocument] = useState<PickedDocument | null>(null);
  const [aadhaarDocument, setAadhaarDocument] = useState<PickedDocument | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!gstDocument) {
      Alert.alert('Missing Document', 'Please upload GST certificate');
      return;
    }

    if (!aadhaarDocument) {
      Alert.alert('Missing Document', 'Please upload Aadhaar card');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: SubmitVerificationPayload = {
        gstCertificate: {
          fileName: gstDocument.fileName,
          mimeType: gstDocument.mimeType,
          content: gstDocument.base64,
        },
        aadhaarCard: {
          fileName: aadhaarDocument.fileName,
          mimeType: aadhaarDocument.mimeType,
          content: aadhaarDocument.base64,
        },
        notes: notes.trim() || undefined,
      };

      await verificationService.submitVerification(companyId, payload);

      Alert.alert(
        'Success',
        'Your verification request has been submitted. Our team will review it shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Verification submission error:', error);
      Alert.alert(
        'Submission Failed',
        error.response?.data?.error || 'Failed to submit verification request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Company Verification</Text>
        <Text style={styles.subtitle}>
          Upload your GST certificate and Aadhaar card to verify your company
        </Text>

        <DocumentUploader
          type="gstCertificate"
          label="GST Certificate *"
          onDocumentPicked={setGstDocument}
          pickedDocument={gstDocument || undefined}
        />

        <DocumentUploader
          type="aadhaarCard"
          label="Aadhaar Card *"
          onDocumentPicked={setAadhaarDocument}
          pickedDocument={aadhaarDocument || undefined}
        />

        <View style={styles.notesContainer}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Add any additional information..."
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!gstDocument || !aadhaarDocument || isSubmitting) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!gstDocument || !aadhaarDocument || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          * Required fields. Your documents will be reviewed within 2-3 business days.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  notesContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#11A440',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
```

---

## 🧪 Testing Guide

### Step 1: Test the API First
Before building UI, test your backend with Postman:

1. **Login** to get auth token
2. **Create a company** (if you don't have one)
3. **Submit verification** with test documents
4. **Check status**
5. **Admin approve** the request

### Step 2: Test UI Components
Test each component individually:

```typescript
// Test CompanyAvatar with different statuses
<CompanyAvatar
  company={{
    ...mockCompany,
    complianceStatus: 'approved'
  }}
/>
```

### Step 3: Integration Testing
Test the full flow:
1. User sees "Not Verified" status
2. User clicks "Start Verification"
3. User uploads documents
4. User submits
5. Status changes to "Under Review"
6. Admin approves
7. Status changes to "Verified" with green border

---

## 📚 Learning Resources

### React Native Basics
- **Components**: Building blocks of UI
- **State**: Data that changes over time (`useState`)
- **Props**: Data passed from parent to child
- **Styling**: StyleSheet for CSS-like styling

### Key Concepts You'll Use
1. **File Upload**: Converting files to base64
2. **API Calls**: Sending HTTP requests with axios/fetch
3. **Navigation**: Moving between screens
4. **Form Validation**: Checking inputs before submit
5. **Error Handling**: try/catch and user feedback

---

## 🎯 Next Steps

### Start Here:
1. ✅ Read this entire guide
2. ✅ Create the type definitions (`src/types/company.ts`)
3. ✅ Create the API service (`src/services/verification.service.ts`)
4. ✅ Build CompanyAvatar component
5. ✅ Build VerificationStatusCard component
6. ✅ Install document picker packages
7. ✅ Build DocumentUploader component
8. ✅ Build VerificationSubmitScreen
9. ✅ Test with your backend

### When You Get Stuck:
- Check the API response in console.log
- Test API endpoints in Postman first
- Break down complex components into smaller pieces
- Ask for help with specific errors

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property 'complianceStatus' of undefined"
**Solution**: Check if company data is loaded before rendering
```typescript
if (!company) return <ActivityIndicator />;
```

### Issue: "File upload fails"
**Solution**: Check file size (<5MB) and base64 encoding

### Issue: "Unauthorized error"
**Solution**: Make sure auth token is included in API requests

### Issue: "Navigation error"
**Solution**: Ensure screen is registered in navigation stack

---

## 💡 Tips for Beginners

1. **Start Small**: Build one component at a time
2. **Use Console.log**: Debug by printing values
3. **Copy Existing Patterns**: Look at how auth screens are built
4. **Test Often**: Run the app after each change
5. **Don't Panic**: Errors are normal, read them carefully
6. **Ask Questions**: Be specific about what's not working

---

## 📖 Glossary

- **Base64**: Way to encode files as text
- **Payload**: Data sent to the API
- **Props**: Properties passed to components
- **State**: Data that changes in your component
- **API**: Interface to communicate with backend
- **TypeScript**: JavaScript with types
- **Async/Await**: Handle asynchronous operations

---

## ✅ Checklist

### Backend (Already Done)
- [x] Models created
- [x] API endpoints working
- [x] AWS S3 configured
- [x] Authentication working

### Frontend (To Do)
- [ ] Create type definitions
- [ ] Create verification service
- [ ] Build CompanyAvatar component
- [ ] Build VerificationStatusCard
- [ ] Install document picker
- [ ] Build DocumentUploader
- [ ] Build VerificationSubmitScreen
- [ ] Add navigation
- [ ] Test end-to-end

---

## 🎉 Final Notes

Your backend is **100% ready**! All the hard work of handling documents, verification logic, and admin workflows is done. Now you just need to build a beautiful UI to interact with it.

Take it step by step, test frequently, and don't hesitate to ask for help when you need it. You've got this! 💪

**Good luck with your implementation!** 🚀
