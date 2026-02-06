# Fix: "Failed to fetch accounting data: Resource not found"

## 🔍 What This Error Means

The error "Resource not found" (404) when fetching accounting data means:
1. ❌ No active company selected, OR
2. ❌ Accounting books not initialized for your company, OR
3. ❌ Backend endpoint not properly configured

---

## ✅ Quick Fix Steps

### Step 1: Check Active Company

In your app, check if a company is selected:

```typescript
// Add this log in StatsScreen.tsx temporarily:
console.log("User:", user?.email);
console.log("Active Company:", user?.activeCompany);
```

**If `activeCompany` is undefined or null:**
- Go to Profile → Select/Create a company
- Set it as active company

---

### Step 2: Bootstrap Accounting for Company

The accounting module needs to be initialized for each company. Run this in the backend:

```bash
cd ../backend
npm run bootstrap:accounting
```

This will:
- Create default chart of accounts
- Set up system accounts (Cash, Bank, Sales, etc.)
- Initialize accounting for the company

---

### Step 3: Verify Backend is Running

```bash
# Check if backend is running:
curl http://3.108.52.140/api/health

# Should return: { "status": "ok" }
```

---

### Step 4: Test with curl (with your JWT token)

Get your JWT token from the app, then test:

```bash
# Replace YOUR_TOKEN with actual token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://3.108.52.140/api/accounting/reports/dashboard
```

**Expected responses:**

✅ **Success (200):**
```json
{
  "sales": 0,
  "purchases": 0,
  "cogs": 0,
  "grossProfit": 0,
  "receivables": 0,
  "payables": 0,
  "cashBalance": 0,
  "stockValue": 0,
  "stockQuantity": 0,
  "lowStockProducts": [],
  "topItems": []
}
```

❌ **No Company (400):**
```json
{
  "message": "No active company selected"
}
```

❌ **Not Found (404):**
```json
{
  "message": "Resource not found"
}
```

---

## 🔧 Solution Based on Error

### If: "No active company selected"
**Fix:** Select a company in your profile
1. Open Profile screen
2. Tap on company section
3. Select or create a company
4. Make sure it's set as active

---

### If: "Resource not found" even with company
**Fix:** Initialize accounting books

```bash
cd ../backend

# Option 1: Use the bootstrap script
npm run bootstrap:accounting

# Option 2: Manual initialization via API
# (requires admin access or direct DB)
```

The bootstrap script will ask for company ID and create:
- Cash account
- Bank account
- Sales account
- Purchases account
- GST accounts (CGST, SGST, IGST)
- Cost of Goods Sold account
- Inventory account

---

### If: Backend not responding
**Fix:** Start the backend

```bash
cd ../backend
npm run dev

# Should show:
# Server running on port 3000
```

---

## 🎯 After Fixing

### Step 1: Reload the App
```bash
# In Metro terminal:
Press 'R' to reload

# OR restart:
npm start -- --reset-cache
```

### Step 2: Navigate to Stats Screen

You should now see:
- ✅ Financial metrics loaded (even if all zeros initially)
- ✅ "Detailed Reports" section with 3 cards
- ✅ Tap each card to navigate to reports

---

## 📊 About Zero Values

**It's normal to see all zeros initially!** This means:
- ✅ API is working
- ✅ Accounting is set up
- ❌ No transactions yet

To get real data:
1. Create some sales invoices in backend
2. Create some purchase bills in backend
3. Add stock movements
4. Refresh the app

---

## 🧪 Test Navigation (Even Without Data)

You can still test all screens even with zero values:

1. **Stats Screen** → Tap "📊 Profit & Loss" → Should open P&L screen
2. **P&L Screen** → Should show ₹0 for all values
3. **Back** → **Tap "🧾 GST Summary"** → Should open GST screen
4. **GST Screen** → Should show ₹0 for GST
5. **Back** → **Tap "👥 Outstanding"** → Should open Outstanding screen
6. **Outstanding Screen** → Should show "No outstanding"

**All screens should load without errors!**

---

## 🐛 Still Not Working?

### Check Console Logs

Look for these in your terminal/console:

```
[HTTP] GET http://3.108.52.140/api/accounting/reports/dashboard
[HTTP] Response status: XXX
```

**Status codes:**
- `200` = Success ✅
- `400` = Bad request (no company)
- `401` = Unauthorized (not logged in)
- `404` = Not found (endpoint issue)
- `500` = Server error

### Enable Debug Mode

Temporarily use the debug screen to see raw API response:

```typescript
// In your navigator:
import { StatsScreenExactAPI as StatsScreen } from "../screens/StatsScreenExactAPI";
```

This will show:
- ✅ Exact API response
- ✅ Field types and values
- ✅ Error details

---

## ✨ Expected Behavior After Fix

### Stats Screen Should Show:
```
┌─────────────────────────────────────┐
│ 🏢 Business Dashboard              │
│ Sales: ₹0  | Profit: ₹0            │
│ Cash: ₹0   | Stock: ₹0             │
├─────────────────────────────────────┤
│ 📊 Financial Overview              │
│ [6 metric cards with ₹0]           │
├─────────────────────────────────────┤
│ 💼 Working Capital                 │
│ Receivables: ₹0                    │
│ Payables: ₹0                       │
├─────────────────────────────────────┤
│ 📋 Detailed Reports                │
│ [📊 P&L] [🧾 GST] [👥 Outstanding]│
└─────────────────────────────────────┘
```

### Each Report Screen Should Show:
- ✅ Date range picker working
- ✅ Data displayed (even if zeros)
- ✅ Charts rendered
- ✅ Pull-to-refresh working
- ✅ No error messages

---

## 📝 Quick Checklist

- [ ] Backend is running (`npm run dev`)
- [ ] User is logged in
- [ ] Active company is selected
- [ ] Accounting books are initialized (`npm run bootstrap:accounting`)
- [ ] App is reloaded (`npm start --reset-cache`)
- [ ] Navigation is set up (done ✅)
- [ ] Screens load without errors

---

**Once all checked, your accounting reports will work perfectly!** 🎉

Even with zero values, all features and navigation will work.
Real data will appear once you create transactions in the backend.
