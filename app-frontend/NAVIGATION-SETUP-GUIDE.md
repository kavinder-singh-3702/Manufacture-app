# Navigation Setup Guide for Accounting Reports

## 🎯 Quick Setup Instructions

Follow these steps to integrate all the new accounting report screens into your navigation.

---

## Step 1: Update Navigation Types

**File:** `src/navigation/types.ts`

Add these new routes to your `RootStackParamList`:

```typescript
export type RootStackParamList = {
  // ... your existing routes ...

  // Accounting Reports
  ProfitLoss: undefined;
  GSTSummary: undefined;
  PartyOutstanding: undefined;
  StockLedger: {
    productId?: string;
    variantId?: string;
  } | undefined;
};
```

---

## Step 2: Import New Screens in Navigator

**File:** `src/navigation/AppNavigator.tsx` (or wherever your Stack Navigator is)

Add these imports at the top:

```typescript
import { ProfitLossScreen } from "../screens/accounting/ProfitLossScreen";
import { GSTSummaryScreen } from "../screens/accounting/GSTSummaryScreen";
import { PartyOutstandingScreen } from "../screens/accounting/PartyOutstandingScreen";
```

---

## Step 3: Add Screen Definitions

In your Stack Navigator, add these screens:

```typescript
<Stack.Navigator>
  {/* ... your existing screens ... */}

  {/* Accounting Reports */}
  <Stack.Screen
    name="ProfitLoss"
    component={ProfitLossScreen}
    options={{
      title: "Profit & Loss",
      headerShown: true,
    }}
  />

  <Stack.Screen
    name="GSTSummary"
    component={GSTSummaryScreen}
    options={{
      title: "GST Summary",
      headerShown: true,
    }}
  />

  <Stack.Screen
    name="PartyOutstanding"
    component={PartyOutstandingScreen}
    options={{
      title: "Party Outstanding",
      headerShown: true,
    }}
  />
</Stack.Navigator>
```

---

## Step 4: Add Quick Access Menu to StatsScreen

**File:** `src/screens/StatsScreen.tsx`

Add this component after the financial metrics section (around line 571, after the Working Capital chart):

```typescript
{/* Quick Reports Access */}
{accountingData && (
  <>
    <SectionHeader
      title="Detailed Reports"
      subtitle="View comprehensive accounting reports"
    />
    <View style={[styles.reportsGrid, { marginBottom: spacing.lg, gap: spacing.md }]}>
      <TouchableOpacity
        style={[
          styles.reportCard,
          {
            backgroundColor: colors.success + "15",
            borderColor: colors.success + "40",
            borderRadius: radius.lg,
          },
        ]}
        onPress={() => navigation.navigate("ProfitLoss")}
        activeOpacity={0.7}
      >
        <Text style={[styles.reportIcon]}>📊</Text>
        <Text style={[styles.reportTitle, { color: colors.text }]}>
          Profit & Loss
        </Text>
        <Text style={[styles.reportSubtitle, { color: colors.textMuted }]}>
          Income vs Expenses
        </Text>
        <View style={[styles.reportBadge, { backgroundColor: colors.success + "25" }]}>
          <Text style={[styles.reportBadgeText, { color: colors.success }]}>
            View Report →
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.reportCard,
          {
            backgroundColor: colors.primary + "15",
            borderColor: colors.primary + "40",
            borderRadius: radius.lg,
          },
        ]}
        onPress={() => navigation.navigate("GSTSummary")}
        activeOpacity={0.7}
      >
        <Text style={[styles.reportIcon]}>🧾</Text>
        <Text style={[styles.reportTitle, { color: colors.text }]}>
          GST Summary
        </Text>
        <Text style={[styles.reportSubtitle, { color: colors.textMuted }]}>
          Tax Analysis
        </Text>
        <View style={[styles.reportBadge, { backgroundColor: colors.primary + "25" }]}>
          <Text style={[styles.reportBadgeText, { color: colors.primary }]}>
            View Report →
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.reportCard,
          {
            backgroundColor: colors.warning + "15",
            borderColor: colors.warning + "40",
            borderRadius: radius.lg,
          },
        ]}
        onPress={() => navigation.navigate("PartyOutstanding")}
        activeOpacity={0.7}
      >
        <Text style={[styles.reportIcon]}>👥</Text>
        <Text style={[styles.reportTitle, { color: colors.text }]}>
          Outstanding
        </Text>
        <Text style={[styles.reportSubtitle, { color: colors.textMuted }]}>
          Aging Analysis
        </Text>
        <View style={[styles.reportBadge, { backgroundColor: colors.warning + "25" }]}>
          <Text style={[styles.reportBadgeText, { color: colors.warning }]}>
            View Report →
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.reportCard,
          {
            backgroundColor: colors.accentWarm + "15",
            borderColor: colors.accentWarm + "40",
            borderRadius: radius.lg,
          },
        ]}
        onPress={() => {
          // Navigate to trial balance or other report
          // navigation.navigate("TrialBalance");
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.reportIcon]}>📈</Text>
        <Text style={[styles.reportTitle, { color: colors.text }]}>
          More Reports
        </Text>
        <Text style={[styles.reportSubtitle, { color: colors.textMuted }]}>
          Coming Soon
        </Text>
        <View style={[styles.reportBadge, { backgroundColor: colors.textMuted + "25" }]}>
          <Text style={[styles.reportBadgeText, { color: colors.textMuted }]}>
            Soon
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  </>
)}
```

---

## Step 5: Add Styles to StatsScreen

Add these styles to the `styles` StyleSheet in `StatsScreen.tsx` (at the end, before the closing `})`):

```typescript
  // Quick Reports Grid
  reportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  reportCard: {
    width: "48%",
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  reportIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
  },
  reportBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  reportBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
```

---

## Alternative: Add to Sidebar/Drawer (If You Have One)

If you have a sidebar or drawer navigation, add these menu items:

```typescript
// In your drawer items
const drawerItems = [
  // ... existing items ...
  {
    title: "Reports",
    items: [
      {
        icon: "📊",
        label: "Profit & Loss",
        screen: "ProfitLoss",
      },
      {
        icon: "🧾",
        label: "GST Summary",
        screen: "GSTSummary",
      },
      {
        icon: "👥",
        label: "Party Outstanding",
        screen: "PartyOutstanding",
      },
    ],
  },
];
```

---

## Quick Test After Setup

1. **Reload App:**
   ```bash
   npm start -- --reset-cache
   ```

2. **Navigate to Stats Screen**

3. **You should see:**
   - Detailed Reports section (if accounting data loaded)
   - 4 report cards (P&L, GST, Outstanding, More)

4. **Tap each card:**
   - Should navigate to respective report
   - Each report should load data
   - Date picker should work
   - Pull-to-refresh should work

---

## Troubleshooting

### "Cannot find module" error
```bash
# Make sure all files are created:
ls -la src/screens/accounting/
ls -la src/components/accounting/
```

### TypeScript errors
```bash
# Check types are updated:
cat src/navigation/types.ts | grep "ProfitLoss\|GSTSummary\|PartyOutstanding"
```

### Navigation not working
```typescript
// Add debug log:
console.log("Navigating to:", screenName);
navigation.navigate(screenName);
```

### Reports showing empty data
- Check backend is running
- Check company has transactions
- Check date range is appropriate
- Check console for API errors

---

## File Checklist

Before proceeding, ensure these files exist:

- [ ] `src/components/accounting/DateRangePicker.tsx`
- [ ] `src/screens/accounting/ProfitLossScreen.tsx`
- [ ] `src/screens/accounting/GSTSummaryScreen.tsx`
- [ ] `src/screens/accounting/PartyOutstandingScreen.tsx`
- [ ] `src/services/accounting.service.ts`

---

## Navigation Flow Diagram

```
┌─────────────────┐
│   Stats Screen  │
│  (Dashboard)    │
└────────┬────────┘
         │
         ├─────→ 📊 Profit & Loss
         │          ├─ Date Filter
         │          ├─ Income Breakdown
         │          └─ Expense Breakdown
         │
         ├─────→ 🧾 GST Summary
         │          ├─ Date Filter
         │          ├─ Input GST
         │          └─ Output GST
         │
         ├─────→ 👥 Party Outstanding
         │          ├─ Customer/Supplier Toggle
         │          ├─ Aging Buckets
         │          └─ Party Details
         │
         └─────→ 📈 More Reports
                    └─ (Future additions)
```

---

## Next Steps After Navigation Setup

1. ✅ Test all navigation flows
2. ✅ Verify back navigation works
3. ✅ Test deep linking (if applicable)
4. ✅ Add analytics tracking (optional)
5. ✅ Add loading states
6. ✅ Add error boundaries
7. ✅ Test on both iOS and Android

---

**Setup Time:** ~10 minutes
**Difficulty:** Easy
**Impact:** High (unlocks all report features)

---

Happy coding! 🚀
