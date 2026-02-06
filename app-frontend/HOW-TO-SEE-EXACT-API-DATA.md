# How to See EXACT API Data from Backend

## 🎯 Goal
Display **exactly** what the backend `/api/accounting/reports/dashboard` returns, field by field, with types and values.

---

## 📱 Method 1: Use the Exact API Screen (Recommended)

### Step 1: Update Your Navigator

Open your navigation file where StatsScreen is imported and **temporarily** replace it:

**File:** `src/navigation/MainTabs.tsx` or wherever StatsScreen is used

```typescript
// BEFORE:
import { StatsScreen } from "../screens/StatsScreen";

// AFTER (temporarily):
import { StatsScreenExactAPI as StatsScreen } from "../screens/StatsScreenExactAPI";
```

### Step 2: Reload the App

```bash
# In Metro terminal, press 'R'
# OR restart with cache clear:
npm start -- --reset-cache
```

### Step 3: Navigate to Stats Screen

Open the app and navigate to the Stats screen. You'll see:

```
┌─────────────────────────────────────────────┐
│ 🔍 Exact API Response                      │
│ /api/accounting/reports/dashboard          │
│ Response time: 145ms                        │
│                                             │
│ ✅ API Call Success                        │
│ Data structure matches backend response    │
│                                             │
│ 📊 Response Overview                       │
│  11 Fields  |  2 Low Stock  |  5 Top Items │
│                                             │
│ 📦 Raw Data Structure                      │
│ sales: 150000.50                           │
│ purchases: 80000.25                        │
│ cogs: 75000.00                             │
│ grossProfit: 75000.50                      │
│ receivables: 25000.00                      │
│ payables: 15000.00                         │
│ cashBalance: 50000.75                      │
│ stockValue: 120000.00                      │
│ stockQuantity: 500                         │
│ lowStockProducts: Array[2]                 │
│   [0] {                                     │
│     _id: "65abc123..."                     │
│     name: "Product A"                      │
│     availableQuantity: 5                   │
│     minStockQuantity: 10                   │
│   }                                         │
│ topItems: Array[5]                         │
│   [0] {                                     │
│     _id: {                                  │
│       product: "65xyz123..."               │
│       variant: "65xyz456..."               │
│     }                                       │
│     qtyOut: 150.5                          │
│     costValue: 45000.00                    │
│   }                                         │
│                                             │
│ 🔍 Type Analysis                           │
│ sales          → number                    │
│ purchases      → number                    │
│ lowStockProducts → Array[2]                │
│ topItems       → Array[5]                  │
│ ...                                         │
│                                             │
│ 📋 JSON Export                             │
│ {                                           │
│   "sales": 150000.50,                      │
│   "purchases": 80000.25,                   │
│   ...                                       │
│ }                                           │
│                                             │
│ 💡 Check Console                           │
│ Detailed logs printed with full structure  │
└─────────────────────────────────────────────┘
```

### Step 4: Check Console Output

In your terminal/console, you'll see detailed logs:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 FETCHING ACCOUNTING DASHBOARD DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: john@example.com
Company: 65abc123def456789
Timestamp: 2024-02-06T10:30:00.000Z

✅ API RESPONSE RECEIVED
Time taken: 145 ms

📦 RAW RESPONSE:
{
  "sales": 150000.5,
  "purchases": 80000.25,
  "cogs": 75000,
  "grossProfit": 75000.5,
  "receivables": 25000,
  "payables": 15000,
  "cashBalance": 50000.75,
  "stockValue": 120000,
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
      "costValue": 45000
    }
  ]
}

📋 RESPONSE STRUCTURE:
────────────────────────────────────────────────────────────────────────────────
sales                : number
  └─ Value: 150000.5
purchases            : number
  └─ Value: 80000.25
cogs                 : number
  └─ Value: 75000
grossProfit          : number
  └─ Value: 75000.5
receivables          : number
  └─ Value: 25000
payables             : number
  └─ Value: 15000
cashBalance          : number
  └─ Value: 50000.75
stockValue           : number
  └─ Value: 120000
stockQuantity        : number
  └─ Value: 500
lowStockProducts     : Array[2]
  └─ First item: {
    "_id": "65abc123def456789",
    "name": "Product A",
    "availableQuantity": 5,
    "minStockQuantity": 10
}
topItems             : Array[5]
  └─ First item: {
    "_id": {
        "product": "65xyz123abc456789",
        "variant": "65xyz456abc789012"
    },
    "qtyOut": 150.5,
    "costValue": 45000
}
────────────────────────────────────────────────────────────────────────────────
```

---

## 🔬 Method 2: Use Node.js Test Script

For testing outside the app:

### Step 1: Get Your JWT Token

In your app, add this temporarily to see your token:

```typescript
import { tokenStorage } from "../services/tokenStorage";

// Somewhere in your component:
const getToken = async () => {
  const token = await tokenStorage.getToken();
  console.log("JWT TOKEN:", token);
};
```

### Step 2: Update Test Script

**File:** `test-api-response.js`

```javascript
const TOKEN = 'YOUR_ACTUAL_JWT_TOKEN_HERE'; // Paste token from Step 1
```

### Step 3: Install node-fetch (if needed)

```bash
npm install node-fetch@2
```

### Step 4: Run the Script

```bash
node test-api-response.js
```

You'll see:
```
🔍 Testing API endpoint: http://3.108.52.140/api/accounting/reports/dashboard

📊 Response Status: 200 OK

✅ API Response (Raw JSON):
════════════════════════════════════════════════════════════════════════════════
{
  "sales": 150000.5,
  "purchases": 80000.25,
  ...
}
════════════════════════════════════════════════════════════════════════════════

📋 Field Analysis:
────────────────────────────────────────────────────────────────────────────────
sales                : number          = 150000.5
purchases            : number          = 80000.25
lowStockProducts     : Array[2]        = [2 items]
topItems             : Array[5]        = [5 items]
────────────────────────────────────────────────────────────────────────────────
```

---

## 🧪 Method 3: Chrome/Postman API Testing

### Using Chrome DevTools or Postman:

```
GET http://3.108.52.140/api/accounting/reports/dashboard

Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
  Accept: application/json
```

---

## ✅ Verify TypeScript Types Match Backend

The types in `src/services/accounting.service.ts` are:

```typescript
export type DashboardData = {
  // Numbers (financial metrics)
  sales: number;              ✅ matches backend
  purchases: number;          ✅ matches backend
  cogs: number;              ✅ matches backend
  grossProfit: number;       ✅ matches backend
  receivables: number;       ✅ matches backend
  payables: number;          ✅ matches backend
  cashBalance: number;       ✅ matches backend
  stockValue: number;        ✅ matches backend
  stockQuantity: number;     ✅ matches backend

  // Arrays
  lowStockProducts: LowStockProduct[];  ✅ matches backend
  topItems: TopItem[];                  ✅ matches backend
};

export type LowStockProduct = {
  _id: string;                      ✅ matches backend (MongoDB ObjectId as string)
  name: string;                     ✅ matches backend
  availableQuantity: number;        ✅ matches backend
  minStockQuantity: number;         ✅ matches backend
};

export type TopItem = {
  _id: {
    product: string;                ✅ matches backend (ObjectId as string)
    variant?: string;               ✅ matches backend (optional)
  };
  qtyOut: number;                   ✅ matches backend
  costValue: number;                ✅ matches backend
};
```

**All types match! ✅**

---

## 🎨 How Data is Displayed in Regular StatsScreen

Once you've verified the data structure, go back to the regular StatsScreen:

```typescript
// Change back to:
import { StatsScreen } from "../screens/StatsScreen";
```

### Data Mapping in UI:

| Backend Field | UI Display | Location |
|--------------|------------|----------|
| `sales` | 💰 Sales Card: "₹150.0K" | Financial Overview |
| `purchases` | 🛒 Purchases Card: "₹80.0K" | Financial Overview |
| `grossProfit` | 📈 Gross Profit Card: "₹75.0K (50.0% margin)" | Financial Overview |
| `cashBalance` | 💵 Cash Balance Card: "₹50.0K" | Financial Overview |
| `receivables` | 📥 Receivables Card: "₹25.0K" | Financial Overview |
| `payables` | 📤 Payables Card: "₹15.0K" | Financial Overview |
| `stockValue` | Hero Metric: "Stock Value ₹120.0K" | Hero Section |
| `stockQuantity` | Hero Metric: "500 units" | Hero Section |
| `lowStockProducts[]` | ⚠️ Low Stock Alert List | After hero |
| `topItems[]` | 🏆 Top Selling Items List | After low stock |

---

## 🔄 Data Flow Summary

```
Backend API
    ↓
accountingService.getDashboard()
    ↓
StatsScreen component receives DashboardData
    ↓
Transforms for display (e.g., /1000 for "K" format)
    ↓
Renders in UI with proper formatting and colors
```

---

## 📊 Field-by-Field Verification Checklist

- [ ] `sales` - Number received and displayed correctly
- [ ] `purchases` - Number received and displayed correctly
- [ ] `cogs` - Number received (used in margin calculation)
- [ ] `grossProfit` - Number received and displayed correctly
- [ ] `receivables` - Number received and displayed correctly
- [ ] `payables` - Number received and displayed correctly
- [ ] `cashBalance` - Number received and displayed correctly
- [ ] `stockValue` - Number received and displayed correctly
- [ ] `stockQuantity` - Number received and displayed correctly
- [ ] `lowStockProducts` - Array received, items have all 4 fields
- [ ] `topItems` - Array received, items have nested _id structure

---

## 🐛 Troubleshooting

### "No active company selected"
```typescript
// Check in your app:
const { user } = useAuth();
console.log("Active Company:", user?.activeCompany);
```

### Empty arrays for lowStockProducts/topItems
This is normal if:
- No products with `availableQuantity <= minStockQuantity`
- No stock movements recorded
- UI will hide these sections automatically

### All numbers are 0
This is normal for new setup:
- No vouchers created yet
- Create some sales/purchase invoices in backend
- Numbers will update automatically

---

## ✨ Next Steps

1. ✅ Use `StatsScreenExactAPI` to see raw data
2. ✅ Verify all fields match documentation
3. ✅ Check console logs for detailed structure
4. ✅ Switch back to regular `StatsScreen`
5. ✅ See data displayed in beautiful UI format

---

**That's it!** You now have complete visibility into what the backend returns and how the frontend consumes it. 🎉
