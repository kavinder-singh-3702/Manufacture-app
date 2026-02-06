# Backend Tally Accounting API Documentation

## 📚 Overview

This document details the **exact** API structure pulled from the backend for the Tally accounting integration.

---

## 🔗 Base URL

```
http://3.108.52.140/api/accounting
```

All endpoints require authentication via JWT token in the `Authorization: Bearer <token>` header.

---

## 📊 Dashboard Endpoint (Primary)

### Endpoint
```
GET /accounting/reports/dashboard
```

### Query Parameters (Optional)
```typescript
{
  from?: string;  // ISO8601 date string (e.g., "2024-01-01")
  to?: string;    // ISO8601 date string (e.g., "2024-12-31")
}
```

### Response Structure

```typescript
{
  // Financial Metrics (all rounded to 2 decimal places)
  sales: number;              // Total sales from sales_invoice vouchers
  purchases: number;          // Total purchases from purchase_bill vouchers
  cogs: number;              // Cost of Goods Sold from sales_invoice
  grossProfit: number;       // Calculated as: sales - cogs

  // Working Capital
  receivables: number;       // Sum of open receivable bills (billType: 'receivable')
  payables: number;          // Sum of open payable bills (billType: 'payable')
  cashBalance: number;       // Net balance of Cash and Bank accounts

  // Inventory Metrics
  stockValue: number;        // Total inventory value (onHandValue)
  stockQuantity: number;     // Total inventory quantity (onHandQtyBase)

  // Detailed Arrays
  lowStockProducts: Array<{
    _id: string;                    // MongoDB ObjectId
    name: string;                   // Product name
    availableQuantity: number;      // Current stock level
    minStockQuantity: number;       // Minimum stock threshold
  }>;

  topItems: Array<{
    _id: {
      product: ObjectId;           // Product MongoDB ObjectId
      variant?: ObjectId;          // Variant MongoDB ObjectId (optional)
    };
    qtyOut: number;               // Total quantity sold
    costValue: number;            // Total cost value of items sold
  }>;
}
```

### Example Response
```json
{
  "sales": 150000.50,
  "purchases": 80000.25,
  "cogs": 75000.00,
  "grossProfit": 75000.50,
  "receivables": 25000.00,
  "payables": 15000.00,
  "cashBalance": 50000.75,
  "stockValue": 120000.00,
  "stockQuantity": 500,
  "lowStockProducts": [
    {
      "_id": "65abc123def456789",
      "name": "Product A",
      "availableQuantity": 5,
      "minStockQuantity": 10
    },
    {
      "_id": "65abc456def789012",
      "name": "Product B",
      "availableQuantity": 2,
      "minStockQuantity": 15
    }
  ],
  "topItems": [
    {
      "_id": {
        "product": "65xyz123abc456789",
        "variant": "65xyz456abc789012"
      },
      "qtyOut": 150.5,
      "costValue": 45000.00
    },
    {
      "_id": {
        "product": "65xyz789abc012345"
      },
      "qtyOut": 120.25,
      "costValue": 38000.00
    }
  ]
}
```

### Backend Logic Breakdown

1. **Sales & Purchases**: Aggregated from `AccountingVoucher` model where:
   - Sales: `voucherType: 'sales_invoice'` with `status: 'posted'`
   - Purchases: `voucherType: 'purchase_bill'` with `status: 'posted'`

2. **COGS**: Extracted from `totals.cogs` field in sales invoice vouchers

3. **Gross Profit**: Simple calculation: `sales - cogs`

4. **Receivables/Payables**: From `AccountingBill` model:
   - Receivables: `billType: 'receivable'`, `status: 'open'`, `isVoided: false`
   - Payables: `billType: 'payable'`, `status: 'open'`, `isVoided: false`

5. **Cash Balance**: Sum of debit-credit for accounts with keys:
   - `SYSTEM_ACCOUNT_KEYS.CASH`
   - `SYSTEM_ACCOUNT_KEYS.BANK`

6. **Stock Value/Quantity**: From `InventoryBalance` model:
   - Value: Sum of `onHandValue`
   - Quantity: Sum of `onHandQtyBase`

7. **Low Stock Products**: From `Product` model where:
   - `availableQuantity <= minStockQuantity`
   - `deletedAt` does not exist
   - Limited to 10 items, sorted by `availableQuantity` ascending

8. **Top Items**: From `StockMove` model:
   - Grouped by product and variant
   - Only `direction: 'out'` (sales)
   - `isVoided: false`
   - Limited to 10 items, sorted by `qtyOut` descending

---

## 🔐 Authentication

All endpoints require:
1. User to be logged in
2. Active company selected (`req.user.activeCompany`)
3. Valid JWT token in Authorization header

### Error Responses

```json
// 400 - No active company
{
  "message": "No active company selected"
}

// 401 - Unauthorized
{
  "message": "Unauthorized"
}

// 404 - Route not found
{
  "message": "Resource not found",
  "path": "/api/accounting/reports/dashboard"
}
```

---

## 📝 Other Available Endpoints

### 1. Trial Balance
```
GET /accounting/reports/trial-balance?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Returns accounts with opening balance, period activity, and closing balance.

### 2. Profit & Loss
```
GET /accounting/reports/pnl?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Returns income and expense accounts breakdown with net profit.

### 3. GST Summary
```
GET /accounting/reports/gst-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Returns input GST, output GST, and net payable.

### 4. Party Outstanding
```
GET /accounting/reports/party-outstanding?asOf=YYYY-MM-DD&type=customer
```

Returns aging analysis of receivables/payables by party.

### 5. Stock Summary
```
GET /accounting/reports/stock-summary?from=YYYY-MM-DD&to=YYYY-MM-DD&level=variant
```

Returns opening, movements, and closing stock by product or variant.

### 6. Stock Ledger
```
GET /accounting/reports/stock-ledger?productId=xxx&variantId=yyy&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50&offset=0
```

Returns detailed stock movement entries.

### 7. Ledger Report
```
GET /accounting/reports/ledger/:accountId?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=100&offset=0
```

Returns ledger entries for a specific account.

---

## 🛠️ Frontend Integration Status

### ✅ Implemented

1. **Accounting Service** (`src/services/accounting.service.ts`)
   - `getDashboard()` - Fetches main dashboard data
   - `getTrialBalance()` - Available but not used in UI yet
   - `getProfitAndLoss()` - Available but not used in UI yet
   - `getGSTSummary()` - Available but not used in UI yet
   - `getPartyOutstanding()` - Available but not used in UI yet
   - `getStockSummary()` - Available but not used in UI yet

2. **StatsScreen UI** (`src/screens/StatsScreen.tsx`)
   - Hero section with financial metrics
   - 6 financial metric cards
   - Working capital comparison chart
   - Low stock products alert
   - Top selling items list

### 🔄 Data Flow

```
User opens Stats Screen
     ↓
Fetch product stats + accounting dashboard in parallel
     ↓
If accounting data succeeds:
  - Hero shows: Sales, Gross Profit, Cash Balance, Stock Value
  - Financial metrics cards display
  - Working capital chart displays
  - Low stock alert (if data exists)
  - Top items list (if data exists)
     ↓
If accounting data fails:
  - Falls back to product stats only
  - No error shown to user (graceful degradation)
  - Console warning logged
```

---

## 🧪 Testing the Integration

### Method 1: Using the Debug Screen

1. Temporarily import `StatsScreenDebug` instead of `StatsScreen`
2. Navigate to Stats screen
3. See detailed debug information and raw API response

### Method 2: Check Console Logs

Look for:
```
[HTTP] GET http://3.108.52.140/api/accounting/reports/dashboard
[HTTP] Response status: 200
```

### Method 3: Manual API Test (with auth token)

```bash
# Get your JWT token from the app
TOKEN="your_jwt_token_here"

curl -H "Authorization: Bearer $TOKEN" \
     http://3.108.52.140/api/accounting/reports/dashboard
```

---

## 📋 Required Backend Setup

For the API to return data, the backend needs:

1. **Company with accounting enabled**
   - User must have an active company selected
   - Company must have accounting books initialized

2. **Accounting data**
   - At least one posted voucher (sales_invoice or purchase_bill)
   - Stock movements recorded
   - Products with inventory tracked

3. **To bootstrap accounting** (backend):
   ```bash
   cd backend
   npm run bootstrap:accounting
   ```

This creates default chart of accounts for the company.

---

## 🐛 Common Issues & Solutions

### Issue: "No active company selected"
**Solution:**
- Login to the app
- Go to Profile → Select/Create a company
- Set as active company

### Issue: All values are 0
**Solution:**
- This is normal for new setup
- Create some vouchers (sales/purchases) in backend
- Add stock movements

### Issue: lowStockProducts array is empty
**Solution:**
- Add products with `minStockQuantity` set
- Reduce `availableQuantity` below `minStockQuantity`

### Issue: topItems array is empty
**Solution:**
- Create sales invoices with stock movements
- Ensure `StockMove` records exist with `direction: 'out'`

---

## 📦 Data Models Referenced

Backend uses these Mongoose models:
- `AccountingVoucher` - Sales/purchase transactions
- `AccountingBill` - Receivables/payables tracking
- `LedgerPosting` - Double-entry bookkeeping entries
- `InventoryBalance` - Current stock on hand
- `StockMove` - Stock movement history
- `Account` - Chart of accounts
- `Product` - Product master data

---

## 🎯 Next Steps

1. ✅ Basic dashboard integration complete
2. 🔄 Consider adding:
   - Date range picker for filtering
   - Detailed P&L screen
   - GST reports screen
   - Party outstanding aging report
   - Stock ledger viewer
3. 🔄 Add loading states and error messages
4. 🔄 Add pull-to-refresh (already implemented)
5. 🔄 Add navigation to detailed reports

---

**Last Updated:** 2024-02-06
**Backend Version:** Tally-style accounting module
**Frontend Version:** React Native with TypeScript
