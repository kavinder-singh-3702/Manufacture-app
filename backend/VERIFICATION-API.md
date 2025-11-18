# 🔐 User Verification System API Documentation

## Overview

This verification system allows users to submit GST and bank account details for marketplace trust verification, similar to BlaBlaCar's verification flow.

---

## 📊 Database Schema

### User Model Updates

```javascript
verificationStatus: {
  type: String,
  enum: ["unverified", "pending", "verified", "rejected"],
  default: "unverified"
}

verificationData: {
  gstNumber: String,
  accountNumber: String,
  ifscCode: String,
  accountHolderName: String,
  gstDocumentUrl: String,        
  bankProofUrl: String,          
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId (ref: User),
  rejectionReason: String
}
```

---

## 🔗 API Endpoints

### User Endpoints

#### 1. Get Verification Status
```http
GET /api/verification/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "unverified",
    "submittedAt": null,
    "reviewedAt": null,
    "rejectionReason": null
  }
}
```

---

#### 2. Submit Verification Request
```http
POST /api/verification/submit
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "gstNumber": "22AAAAA0000A1Z5",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "accountHolderName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification request submitted successfully",
  "data": {
    "status": "pending",
    "submittedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

#### 3. Upload Verification Document
```http
POST /api/verification/upload
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "documentType": "gst",  // or "bank"
  "documentUrl": "https://storage.example.com/documents/gst-certificate.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "documentType": "gst",
    "documentUrl": "https://storage.example.com/documents/gst-certificate.pdf"
  }
}
```

---

### Admin Endpoints

#### 4. Get All Pending Verifications
```http
GET /api/verification/admin/pending
Authorization: Bearer {admin-token}
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "displayName": "John D",
      "verificationStatus": "pending",
      "verificationData": {
        "gstNumber": "22AAAAA0000A1Z5",
        "accountNumber": "1234567890",
        "ifscCode": "SBIN0001234",
        "accountHolderName": "John Doe",
        "gstDocumentUrl": "https://...",
        "bankProofUrl": "https://...",
        "submittedAt": "2025-01-15T10:30:00.000Z"
      },
      "avatarUrl": "https://..."
    }
  ]
}
```

---

#### 5. Approve Verification
```http
POST /api/verification/admin/approve/:userId
Authorization: Bearer {admin-token}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification approved successfully",
  "data": {
    "userId": "user123",
    "status": "verified",
    "reviewedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

---

#### 6. Reject Verification
```http
POST /api/verification/admin/reject/:userId
Authorization: Bearer {admin-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "GST number is invalid or document is not clear"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification rejected",
  "data": {
    "userId": "user123",
    "status": "rejected",
    "reviewedAt": "2025-01-15T12:00:00.000Z",
    "rejectionReason": "GST number is invalid or document is not clear"
  }
}
```

---

#### 7. Get Verification Statistics
```http
GET /api/verification/admin/stats
Authorization: Bearer {admin-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unverified": 1250,
    "pending": 35,
    "verified": 580,
    "rejected": 15
  }
}
```

---

## 🎯 User Flow

### User Side:
1. User sees yellow border on profile (unverified status)
2. Clicks "Verify Account" button
3. Fills form with:
   - GST Number
   - Bank Account Number
   - IFSC Code
   - Account Holder Name
4. Uploads documents (GST certificate, Bank proof)
5. Submits → Status changes to "pending"
6. Receives notification when admin reviews
7. If approved → Status: "verified", border turns green + checkmark
8. If rejected → Status: "rejected", can retry with corrections

### Admin Side:
1. Receives notification of new verification request
2. Opens admin panel → sees list of pending requests
3. Reviews:
   - GST Number validity
   - Bank account details
   - Uploaded documents
4. Takes action:
   - **Approve** → User becomes verified
   - **Reject** → User receives rejection reason, can resubmit

---

## 🛡️ Validation Rules

### GST Number Format:
- Length: 15 characters
- Format: `\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}`
- Example: `22AAAAA0000A1Z5`

### IFSC Code Format:
- Length: 11 characters
- Format: `[A-Z]{4}0[A-Z0-9]{6}`
- Example: `SBIN0001234`

### Account Number:
- Length: 9-18 digits
- Only numeric characters

---

## 📁 File Upload (Next Steps)

You'll need to install **multer** for file uploads:

```bash
npm install multer
```

Create middleware for handling document uploads:

```javascript
// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/verification-docs');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDF, JPG, PNG only
  if (file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;
```

---

## 🔔 Notifications (Optional)

Send email/push notifications on:
- ✅ Verification submitted (to user)
- ⏳ New request received (to admin)
- ✅ Verification approved (to user)
- ❌ Verification rejected (to user with reason)

---

## 🎨 Frontend Integration

### Verification Status Colors:
```typescript
const statusColors = {
  unverified: "#F59E0B",  // Yellow/Warning
  pending: "#3B82F6",     // Blue/Info
  verified: "#11A440",    // Green/Success
  rejected: "#DC2626"     // Red/Error
};
```

### Profile Avatar Border:
```tsx
<Avatar
  borderColor={statusColors[user.verificationStatus]}
  borderWidth={3}
/>
{user.verificationStatus === 'verified' && <VerifiedBadge />}
```

---

## ✅ Implementation Checklist

- [x] MongoDB schema updated with verification fields
- [x] User verification endpoints created
- [x] Admin approval/rejection endpoints created
- [x] Routes registered in app
- [ ] Add authentication middleware to routes
- [ ] Add admin role middleware to admin routes
- [ ] Install and configure multer for file uploads
- [ ] Create file upload endpoint
- [ ] Add input validation middleware
- [ ] Set up cloud storage (AWS S3, Cloudinary, etc.)
- [ ] Create frontend components
- [ ] Add email/push notifications

---

## 🚀 Quick Start

1. Make sure MongoDB is running
2. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```
3. Test endpoints with Postman/Thunder Client
4. Implement frontend components

---

## 📝 Notes

- **Security**: Add rate limiting to prevent spam verification requests
- **Storage**: Use cloud storage (S3, Cloudinary) for production instead of local storage
- **Validation**: Add server-side validation for GST format and IFSC code
- **Audit Trail**: Consider adding a separate `verificationHistory` collection for audit logs
- **Notifications**: Integrate email service (SendGrid, AWS SES) for user notifications

---

## 🎯 Next Steps

1. Add authentication middleware to protect routes
2. Install multer and set up file upload
3. Create frontend verification form component
4. Create admin verification dashboard
5. Add email notifications
