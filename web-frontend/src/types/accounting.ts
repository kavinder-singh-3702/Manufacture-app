export type DateRangeParams = {
  from?: string;
  to?: string;
};

export type DashboardData = {
  sales: number;
  purchases: number;
  receipts?: number;
  payments?: number;
  cogs: number;
  grossProfit: number;
  receivables: number;
  payables: number;
  cashBalance: number;
  stockValue: number;
  stockQuantity: number;
  lowStockProducts: Array<{ productId: string; productName: string; onHandQty: number; reorderLevel: number; unit?: string }>;
  topItems: Array<{ productId: string; productName: string; quantitySold: number; revenue: number; unit?: string }>;
};

export type RecentVoucher = {
  _id: string;
  voucherType: "sales_invoice" | "purchase_bill" | "receipt" | "payment" | "journal";
  status: "draft" | "posted" | "void";
  date: string;
  voucherNumber?: string;
  party?: { _id: string; name: string } | string;
  totals: { total: number; currency: string };
  createdAt: string;
};

export type ProfitAndLossData = {
  income: Array<{ accountId: string; accountName: string; value: number }>;
  expenses: Array<{ accountId: string; accountName: string; value: number }>;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
};

export type GSTSummaryData = {
  input: { cgst: number; sgst: number; igst: number };
  output: { cgst: number; sgst: number; igst: number };
  netPayable: number;
};

export type PartyOutstandingRow = {
  partyId: string;
  partyName: string;
  totalOutstanding: number;
  aging: {
    bucket_0_30: number;
    bucket_31_60: number;
    bucket_61_90: number;
    bucket_90_plus: number;
  };
};

export type PartyOutstandingData = {
  type: "receivable" | "payable";
  asOf: string;
  rows: PartyOutstandingRow[];
  totalOutstanding: number;
};
