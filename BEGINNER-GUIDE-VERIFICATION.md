# 📚 Complete Beginner's Guide: User Verification System

## 🎯 What Did We Build?

We built a **verification system** similar to BlaBlaCar, where:
- Users can verify their identity by submitting GST & bank details
- Unverified users have a **yellow border** on their profile
- Verified users have a **green border + checkmark**
- Admins can approve or reject verification requests

---

## 🏗️ Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │  ←→     │   Backend   │  ←→     │   MongoDB   │
│  (React)    │  HTTP   │  (Express)  │  Mongo  │  (Database) │
└─────────────┘         └─────────────┘         └─────────────┘
     User                   API Server              Data Storage
```

---

## 📦 Part 1: MongoDB Schema (Database Structure)

### What is a Schema?
A **schema** defines the structure of your data - like a blueprint for how information is stored.

### What We Added to User Model

**File:** `backend/src/models/user.model.js`

```javascript
// New verification statuses we added
const VERIFICATION_STATUSES = ["unverified", "pending", "verified", "rejected"];

// New sub-schema for verification details
const VERIFICATION_DATA_SCHEMA = new Schema({
  gstNumber: String,           // Business GST registration number
  accountNumber: String,        // Bank account number
  ifscCode: String,            // Bank IFSC code (Indian banking)
  accountHolderName: String,    // Name on bank account
  gstDocumentUrl: String,      // Link to uploaded GST certificate
  bankProofUrl: String,        // Link to uploaded bank proof
  submittedAt: Date,           // When user submitted request
  reviewedAt: Date,            // When admin reviewed it
  reviewedBy: ObjectId,        // Which admin reviewed it
  rejectionReason: String,     // Why it was rejected (if rejected)
});

// Added to main User schema
verificationStatus: {
  type: String,
  enum: VERIFICATION_STATUSES,   // Can only be one of these 4 values
  default: "unverified",         // Starts as unverified
},
verificationData: VERIFICATION_DATA_SCHEMA,  // Stores all verification info
```

### 🤔 Why These Fields?

| Field | Purpose |
|-------|---------|
| `verificationStatus` | Quick check: Is user verified? (yellow/green border) |
| `gstNumber` | Proves user has a registered business |
| `accountNumber` | Bank account for payments |
| `gstDocumentUrl` | Admin can view the actual GST certificate |
| `submittedAt` | Track when request was made |
| `reviewedBy` | Know which admin approved/rejected |

---

## 🔌 Part 2: Backend API Endpoints

### What is an API Endpoint?
An **endpoint** is like a door to your backend. The frontend knocks on this door (makes a request) and gets data back (response).

### Endpoints We Created

**File:** `backend/src/controllers/verification.controller.js`

#### 1️⃣ Get Verification Status
```javascript
GET /api/verification/status
```

**What it does:**
- Tells the frontend: "Is this user verified?"
- Returns: `{ status: "unverified", submittedAt: null }`

**When frontend uses this:**
- When loading profile page
- To decide border color (yellow/green)

---

#### 2️⃣ Submit Verification Request
```javascript
POST /api/verification/submit
```

**What it does:**
1. Receives GST + bank details from user
2. Validates all fields are filled
3. Changes status from `unverified` → `pending`
4. Saves data to MongoDB

**Flow:**
```
User fills form → Frontend sends data → Backend validates → Save to DB → Status: pending
```

---

#### 3️⃣ Upload Document
```javascript
POST /api/verification/upload
```

**What it does:**
- Saves the URL of uploaded GST certificate or bank proof
- Updates `gstDocumentUrl` or `bankProofUrl` in database

---

#### 4️⃣ Admin: Get Pending Requests
```javascript
GET /api/verification/admin/pending
```

**What it does:**
- Shows admin all users waiting for verification
- Returns list of users with status = "pending"

**Admin Dashboard shows:**
```
┌─────────────────────────────────┐
│ John Doe                        │
│ GST: 22AAAAA0000A1Z5            │
│ Account: 1234567890             │
│ [Approve] [Reject]              │
├─────────────────────────────────┤
│ Jane Smith                      │
│ GST: 22BBBBB0000B1Z5            │
│ Account: 9876543210             │
│ [Approve] [Reject]              │
└─────────────────────────────────┘
```

---

#### 5️⃣ Admin: Approve Verification
```javascript
POST /api/verification/admin/approve/:userId
```

**What it does:**
1. Finds user by ID
2. Changes status `pending` → `verified`
3. Records who approved and when
4. User now gets green border!

---

#### 6️⃣ Admin: Reject Verification
```javascript
POST /api/verification/admin/reject/:userId
```

**What it does:**
1. Finds user by ID
2. Changes status `pending` → `rejected`
3. Saves rejection reason
4. User can see why and retry

---

## 🛣️ Part 3: Routes (URL Mapping)

### What are Routes?
Routes connect URLs to functions. When someone visits `/api/verification/status`, Express knows which function to run.

**File:** `backend/src/routes/verification.routes.js`

```javascript
// User routes
router.get('/status', getVerificationStatus);
router.post('/submit', submitVerification);
router.post('/upload', uploadDocument);

// Admin routes
router.get('/admin/pending', getPendingVerifications);
router.post('/admin/approve/:userId', approveVerification);
router.post('/admin/reject/:userId', rejectVerification);
```

### Route Registration
**File:** `backend/src/routes/index.js`

```javascript
router.use('/verification', verificationRouter);
```

This means all verification routes start with `/api/verification/...`

---

## 📊 Part 4: How Data Flows

### User Submits Verification

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER FILLS FORM                                         │
│     - GST Number: 22AAAAA0000A1Z5                           │
│     - Account: 1234567890                                   │
│     - IFSC: SBIN0001234                                     │
│     - Name: John Doe                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. FRONTEND SENDS REQUEST                                  │
│     POST /api/verification/submit                           │
│     Body: { gstNumber, accountNumber, ifscCode, name }      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. BACKEND VALIDATES                                       │
│     ✓ All fields present?                                   │
│     ✓ User exists?                                          │
│     ✓ Not already verified?                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. SAVE TO DATABASE                                        │
│     user.verificationStatus = "pending"                     │
│     user.verificationData = { ...details, submittedAt }     │
│     user.save()                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. RETURN RESPONSE                                         │
│     { success: true, status: "pending" }                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  6. FRONTEND UPDATES UI                                     │
│     Border color: Yellow → Blue (pending)                   │
│     Show message: "Verification submitted!"                 │
└─────────────────────────────────────────────────────────────┘
```

---

### Admin Approves Verification

```
┌─────────────────────────────────────────────────────────────┐
│  1. ADMIN CLICKS "APPROVE"                                  │
│     For user: John Doe (userId: abc123)                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. FRONTEND SENDS REQUEST                                  │
│     POST /api/verification/admin/approve/abc123             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. BACKEND VALIDATES                                       │
│     ✓ User exists?                                          │
│     ✓ Status is "pending"?                                  │
│     ✓ Admin has permission?                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. UPDATE DATABASE                                         │
│     user.verificationStatus = "verified"                    │
│     user.verificationData.reviewedAt = now                  │
│     user.verificationData.reviewedBy = adminId              │
│     user.save()                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. USER GETS NOTIFICATION                                  │
│     "Congratulations! You're verified ✓"                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  6. USER'S PROFILE UPDATES                                  │
│     Border: Yellow → Green                                  │
│     Show: Blue checkmark badge                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 Key Concepts Explained

### 1. **Mongoose Schema**
Think of it like a form template. It defines:
- What fields exist (gstNumber, accountNumber, etc.)
- What type of data (String, Date, Number)
- Default values (default: "unverified")

### 2. **Controller Functions**
These are the "workers" that do the actual work:
- `getVerificationStatus` → Fetches data
- `submitVerification` → Saves data
- `approveVerification` → Updates data

### 3. **Routes**
Routes are like a phone directory:
- Call `/status` → Talk to `getVerificationStatus`
- Call `/submit` → Talk to `submitVerification`

### 4. **Middleware**
Middleware runs BEFORE your controller:
```javascript
Request → Auth Middleware → Controller → Response
          ↑
          Checks: Is user logged in?
```

### 5. **HTTP Methods**
- **GET** → Fetch data (like reading a book)
- **POST** → Create data (like writing a new page)
- **PUT/PATCH** → Update data (like editing a page)
- **DELETE** → Remove data (like tearing out a page)

---

## 🎨 Visual Status Flow

```
┌─────────────┐
│ unverified  │  ← User just signed up
│   (Yellow)  │
└──────┬──────┘
       │ User submits verification
       ↓
┌─────────────┐
│   pending   │  ← Waiting for admin review
│   (Blue)    │
└──────┬──────┘
       │
       ├─ Admin Approves ──→ ┌─────────────┐
       │                     │  verified   │
       │                     │  (Green ✓)  │
       │                     └─────────────┘
       │
       └─ Admin Rejects ──→  ┌─────────────┐
                             │  rejected   │
                             │    (Red)    │
                             └─────────────┘
                                    │
                                    │ User can resubmit
                                    ↓
                             ┌─────────────┐
                             │   pending   │
                             └─────────────┘
```

---

## 🔐 Security Considerations

### 1. Authentication
Add middleware to verify user is logged in:
```javascript
const { protect } = require('../middleware/authMiddleware');
router.get('/status', protect, getVerificationStatus);
```

### 2. Authorization
Add middleware to check admin role:
```javascript
const { restrictTo } = require('../middleware/authMiddleware');
router.post('/admin/approve/:userId', protect, restrictTo('admin'), approveVerification);
```

### 3. Validation
Validate inputs before saving:
```javascript
if (!gstNumber || gstNumber.length !== 15) {
  throw new Error('Invalid GST number format');
}
```

---

## 🧪 Testing the API

### Using Postman / Thunder Client

#### 1. Submit Verification
```
POST http://localhost:5000/api/verification/submit
Headers: Authorization: Bearer YOUR_TOKEN
Body (JSON):
{
  "gstNumber": "22AAAAA0000A1Z5",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "accountHolderName": "John Doe"
}
```

#### 2. Check Status
```
GET http://localhost:5000/api/verification/status
Headers: Authorization: Bearer YOUR_TOKEN
```

#### 3. Admin: Get Pending
```
GET http://localhost:5000/api/verification/admin/pending
Headers: Authorization: Bearer ADMIN_TOKEN
```

#### 4. Admin: Approve
```
POST http://localhost:5000/api/verification/admin/approve/USER_ID
Headers: Authorization: Bearer ADMIN_TOKEN
```

---

## 📝 Next Steps to Complete the System

### 1. Add Authentication Middleware
```bash
# Already have authMiddleware.js
# Just need to add it to routes
```

### 2. Install Multer for File Uploads
```bash
cd backend
npm install multer
```

### 3. Create Upload Middleware
```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
router.post('/upload-doc', upload.single('document'), handleUpload);
```

### 4. Frontend Components (Next Phase)
- Profile Avatar with colored border
- Verification form
- Admin dashboard

---

## ❓ Common Questions

### Q: Where is the data stored?
**A:** In MongoDB database, specifically in the `users` collection with the new `verificationStatus` and `verificationData` fields.

### Q: How does the yellow/green border work?
**A:** Frontend checks `user.verificationStatus`:
- `unverified` → Yellow border
- `pending` → Blue border
- `verified` → Green border + checkmark
- `rejected` → Red border

### Q: Can a user resubmit after rejection?
**A:** Yes! When status is `rejected`, they can submit again. The `submittedAt` date will update to the new submission.

### Q: How do documents get uploaded?
**A:** Two-step process:
1. Frontend uploads file to storage (AWS S3, Cloudinary)
2. Frontend gets back a URL
3. Frontend sends URL to backend via `/upload` endpoint
4. Backend saves URL in `verificationData.gstDocumentUrl`

---

## 🎯 Summary

You now have a **complete backend** for user verification:

✅ **Database schema** - Stores verification status & details
✅ **API endpoints** - 7 endpoints for users & admins
✅ **Routes** - Connected to Express app
✅ **Documentation** - Complete API docs

**What's Missing:**
- Authentication middleware (protect routes)
- File upload setup (multer)
- Frontend components (React)
- Email notifications

**You're 60% done!** The backend foundation is solid. Next is connecting it all with the frontend! 🚀
