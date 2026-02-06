# Backend → Frontend Data Mapping

## 🎯 Quick Reference: What Goes Where

This shows **exactly** how backend API data is displayed in the StatsScreen UI.

---

## 📊 Dashboard API Response → UI Elements

### Backend Response Structure
```json
{
  "sales": 150000,
  "purchases": 80000,
  "cogs": 75000,
  "grossProfit": 75000,
  "receivables": 25000,
  "payables": 15000,
  "cashBalance": 50000,
  "stockValue": 120000,
  "stockQuantity": 500,
  "lowStockProducts": [...],
  "topItems": [...]
}
```

---

## 🎨 UI Mapping

### 1. Hero Section (Top of screen)

#### When `accountingData` exists:
```typescript
// Hero Title Changes
"Financial Intelligence" (was "Product Intelligence")
"Business Dashboard" (was "Product Stats")
"Real-time accounting & inventory metrics"

// Hero Metrics (4 cards in 2 rows)
Row 1:
  ┌─────────────────────┬─────────────────────┐
  │ Sales Revenue       │ Gross Profit        │
  │ ₹150.0K            │ ₹75.0K              │
  │ Total sales         │ 50.0% margin        │
  └─────────────────────┴─────────────────────┘

Row 2:
  ┌─────────────────────┬─────────────────────┐
  │ Cash Balance        │ Stock Value         │
  │ ₹50.0K             │ ₹120.0K             │
  │ Available funds     │ 500 units           │
  └─────────────────────┴─────────────────────┘
```

**Code Location:** `StatsScreen.tsx` lines 424-446
**Data Source:**
```typescript
accountingData.sales          → Sales Revenue
accountingData.grossProfit    → Gross Profit
accountingData.cashBalance    → Cash Balance
accountingData.stockValue     → Stock Value
accountingData.stockQuantity  → units count
```

---

### 2. Financial Overview Section (6 Metric Cards)

```
Grid Layout (2 columns):
┌─────────────────┬─────────────────┐
│ 💰 Sales        │ 🛒 Purchases    │
│ ₹150.0K         │ ₹80.0K          │
│ Revenue         │ Expenses        │
├─────────────────┼─────────────────┤
│ 📈 Gross Profit │ 💵 Cash Balance │
│ ₹75.0K          │ ₹50.0K          │
│ 50.0% margin    │ Available       │
├─────────────────┼─────────────────┤
│ 📥 Receivables  │ 📤 Payables     │
│ ₹25.0K          │ ₹15.0K          │
│ To collect      │ To pay          │
└─────────────────┴─────────────────┘
```

**Code Location:** `StatsScreen.tsx` lines 451-497
**Component:** `FinancialMetricCard` (lines 909-955)

**Data Mapping:**
```typescript
Sales Card:
  - Label: "Sales"
  - Value: `₹${(accountingData.sales / 1000).toFixed(1)}K`
  - Color: colors.success (green)
  - Subtitle: "Revenue"

Purchases Card:
  - Label: "Purchases"
  - Value: `₹${(accountingData.purchases / 1000).toFixed(1)}K`
  - Color: colors.primary (blue)
  - Subtitle: "Expenses"

Gross Profit Card:
  - Label: "Gross Profit"
  - Value: `₹${(accountingData.grossProfit / 1000).toFixed(1)}K`
  - Color: grossProfit >= 0 ? green : red
  - Subtitle: `${(grossProfit/sales*100).toFixed(1)}% margin`

Cash Balance Card:
  - Label: "Cash Balance"
  - Value: `₹${(accountingData.cashBalance / 1000).toFixed(1)}K`
  - Color: colors.accentWarm (orange)
  - Subtitle: "Available"

Receivables Card:
  - Label: "Receivables"
  - Value: `₹${(accountingData.receivables / 1000).toFixed(1)}K`
  - Color: colors.warning (yellow)
  - Subtitle: "To collect"

Payables Card:
  - Label: "Payables"
  - Value: `₹${(accountingData.payables / 1000).toFixed(1)}K`
  - Color: colors.error (red)
  - Subtitle: "To pay"
```

---

### 3. Working Capital Chart

```
┌─────────────────────────────────────┐
│ Working Capital                     │
│                                     │
│ • Receivables        ₹25,000       │
│ ████████████░░░░░░░  (62%)        │
│                                     │
│ • Payables          ₹15,000        │
│ ████████░░░░░░░░░░░  (38%)        │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Net Position                 │   │
│ │ +₹10,000                     │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Code Location:** `StatsScreen.tsx` lines 500-570
**Data Source:**
```typescript
Receivables Bar:
  - Value: accountingData.receivables
  - Display: ₹{receivables.toLocaleString()}
  - Width: (receivables / max(receivables, payables)) * 100%
  - Color: colors.success (green)

Payables Bar:
  - Value: accountingData.payables
  - Display: ₹{payables.toLocaleString()}
  - Width: (payables / max(receivables, payables)) * 100%
  - Color: colors.error (red)

Net Position:
  - Value: receivables - payables
  - Display: +₹{netPosition.toLocaleString()} or -₹...
  - Color: netPosition >= 0 ? green : red
  - Background: netPosition >= 0 ? green10 : red10
```

---

### 4. Low Stock Products Alert

**Only shows if:** `accountingData.lowStockProducts.length > 0`

```
┌─────────────────────────────────────┐
│ Low Stock Alert                     │
│ Products that need attention        │
│                                     │
│ Product A                    ⚠️ Low │
│ Current: 5 / Min: 10               │
│ ─────────────────────────────────  │
│ Product B                    ⚠️ Low │
│ Current: 2 / Min: 15               │
│ ─────────────────────────────────  │
│ Product C                    ⚠️ Low │
│ Current: 8 / Min: 20               │
└─────────────────────────────────────┘
```

**Code Location:** `StatsScreen.tsx` lines 474-505
**Data Source:**
```typescript
accountingData.lowStockProducts.slice(0, 5).map((product) => ({
  _id: product._id,
  name: product.name,
  availableQuantity: product.availableQuantity,
  minStockQuantity: product.minStockQuantity
}))

Display Format:
  - Name: product.name
  - Text: "Current: {availableQuantity} / Min: {minStockQuantity}"
  - Badge: "⚠️ Low" (yellow/warning color)
  - Border color: colors.warning + "40"
  - Background: colors.warning + "20"
```

---

### 5. Top Selling Items

**Only shows if:** `accountingData.topItems.length > 0`

```
┌─────────────────────────────────────┐
│ Top Selling Items                   │
│ Best performers by quantity sold    │
│                                     │
│ #1  Product #65xyz123    ₹45.0K   │
│     Qty sold: 150.50 units         │
│ ─────────────────────────────────  │
│ #2  Product #65xyz456    ₹38.0K   │
│     Qty sold: 120.25 units         │
│ ─────────────────────────────────  │
│ #3  Product #65xyz789    ₹28.5K   │
│     Qty sold: 95.00 units          │
└─────────────────────────────────────┘
```

**Code Location:** `StatsScreen.tsx` lines 508-543
**Data Source:**
```typescript
accountingData.topItems.slice(0, 5).map((item, index) => {
  const productId = item._id.product.toString();

  return {
    rank: index + 1,
    productId: productId.substring(0, 8),  // First 8 chars
    qtyOut: item.qtyOut.toFixed(2),
    costValue: (item.costValue / 1000).toFixed(1) + "K"
  };
})

Display Format:
  - Rank: Circular badge with number (#1, #2, #3...)
  - Product: "Product #{first 8 chars of ObjectId}"
  - Quantity: "Qty sold: {qtyOut} units"
  - Value: ₹{costValue}K (green color)
```

---

## 🔄 Fallback Behavior

### When `accountingData` is null or undefined:

```typescript
Hero Section:
  → Shows "Product Intelligence" / "Product Stats"
  → Shows product inventory metrics instead

Financial Overview:
  → Section hidden completely

Working Capital Chart:
  → Hidden completely

Low Stock Alert:
  → Hidden completely

Top Selling Items:
  → Hidden completely

Inventory Pulse:
  → Shows normally (uses product stats)
```

**Code:** The UI has conditional rendering:
```typescript
{accountingData && (
  // Show financial sections
)}

{!accountingData && (
  // Show product-only sections
)}
```

---

## 📝 Making Changes to the UI

### To modify Financial Metric Cards:

**File:** `src/screens/StatsScreen.tsx`
**Lines:** 455-496

Example: Add a new card
```typescript
<FinancialMetricCard
  label="Your Label"
  value={`₹${(accountingData.yourField / 1000).toFixed(1)}K`}
  icon="💎"
  color={colors.primary}
  subtitle="Your subtitle"
/>
```

### To modify Working Capital Chart:

**File:** `src/screens/StatsScreen.tsx`
**Lines:** 500-570

Example: Change bar heights
```typescript
// Line 516-518
width: `${yourCalculation}%`
```

### To modify Low Stock Display:

**File:** `src/screens/StatsScreen.tsx`
**Lines:** 474-505

Example: Show more products
```typescript
// Line 478: Change slice(0, 5) to slice(0, 10)
accountingData.lowStockProducts.slice(0, 10)
```

### To add Backend Types:

**File:** `src/services/accounting.service.ts`
**Lines:** 1-120

Example: Add new field to DashboardData
```typescript
export type DashboardData = {
  // ... existing fields
  yourNewField: number;
};
```

---

## 🧪 Testing Changes

### 1. With Real Data
```typescript
// Check console for API response
console.log("Accounting data:", accountingData);
```

### 2. With Mock Data
Add to StatsScreen.tsx (temporarily):
```typescript
// After line 101
setAccountingData({
  sales: 150000,
  purchases: 80000,
  cogs: 75000,
  grossProfit: 75000,
  receivables: 25000,
  payables: 15000,
  cashBalance: 50000,
  stockValue: 120000,
  stockQuantity: 500,
  lowStockProducts: [
    { _id: "1", name: "Test Product", availableQuantity: 5, minStockQuantity: 10 }
  ],
  topItems: [
    { _id: { product: "abc123" }, qtyOut: 100, costValue: 50000 }
  ]
});
```

### 3. Use Debug Screen
Import `StatsScreenDebug` to see raw data structure.

---

## 🎨 Color Scheme

```typescript
Financial Metrics:
  - Sales: colors.success (green)
  - Purchases: colors.primary (blue)
  - Gross Profit: dynamic (green if positive, red if negative)
  - Cash Balance: colors.accentWarm (orange)
  - Receivables: colors.warning (yellow)
  - Payables: colors.error (red)

Working Capital:
  - Receivables: colors.success (green)
  - Payables: colors.error (red)
  - Net Position: dynamic (green if positive, red if negative)

Alerts:
  - Low Stock: colors.warning (yellow)
  - Top Items Rank: colors.primary (blue)
  - Top Items Value: colors.success (green)
```

---

**Last Updated:** 2024-02-06
**Reference:** Backend code at `../backend/src/modules/accounting/services/reports.service.js`
