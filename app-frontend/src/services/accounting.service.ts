import { apiClient } from "./apiClient";

// ============================================================
// TYPES
// ============================================================

export type DashboardData = {
  sales: number;
  purchases: number;
  cogs: number;
  grossProfit: number;
  receivables: number;
  payables: number;
  cashBalance: number;
  stockValue: number;
  stockQuantity: number;
  lowStockProducts: LowStockProduct[];
  topItems: TopItem[];
};

export type LowStockProduct = {
  _id: string;
  name: string;
  availableQuantity: number;
  minStockQuantity: number;
};

export type TopItem = {
  _id: {
    product: string;
    variant?: string;
  };
  qtyOut: number;
  costValue: number;
};

export type DateRangeParams = {
  from?: string;
  to?: string;
};

export type TrialBalanceRow = {
  accountId: string;
  accountName: string;
  accountType: string;
  group: string;
  opening: number;
  periodDebit: number;
  periodCredit: number;
  closing: number;
};

export type TrialBalanceData = {
  rows: TrialBalanceRow[];
  totals: {
    opening: number;
    periodDebit: number;
    periodCredit: number;
    closing: number;
  };
};

export type ProfitAndLossData = {
  income: Array<{
    accountId: string;
    accountName: string;
    value: number;
  }>;
  expenses: Array<{
    accountId: string;
    accountName: string;
    value: number;
  }>;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
};

export type GSTSummaryData = {
  input: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  output: {
    cgst: number;
    sgst: number;
    igst: number;
  };
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
  asOf: Date;
  rows: PartyOutstandingRow[];
  totalOutstanding: number;
};

export type StockSummaryRow = {
  product?: string;
  variant?: string;
  openingQty: number;
  openingValue: number;
  qtyIn: number;
  qtyOut: number;
  valueIn: number;
  valueOut: number;
  closingQty: number;
  closingValue: number;
};

export type StockSummaryData = {
  level: "product" | "variant";
  rows: StockSummaryRow[];
};

// ============================================================
// SERVICE
// ============================================================

class AccountingService {
  private baseUrl = "/accounting";

  /**
   * Get dashboard data - primary endpoint for stats screen
   */
  async getDashboard(params?: DateRangeParams): Promise<DashboardData> {
    return await apiClient.get<DashboardData>(`${this.baseUrl}/reports/dashboard`, {
      params,
    });
  }

  /**
   * Get trial balance report
   */
  async getTrialBalance(params?: DateRangeParams): Promise<TrialBalanceData> {
    return await apiClient.get<TrialBalanceData>(`${this.baseUrl}/reports/trial-balance`, {
      params,
    });
  }

  /**
   * Get profit and loss statement
   */
  async getProfitAndLoss(params?: DateRangeParams): Promise<ProfitAndLossData> {
    return await apiClient.get<ProfitAndLossData>(`${this.baseUrl}/reports/pnl`, {
      params,
    });
  }

  /**
   * Get GST summary report
   */
  async getGSTSummary(params?: DateRangeParams): Promise<GSTSummaryData> {
    return await apiClient.get<GSTSummaryData>(`${this.baseUrl}/reports/gst-summary`, {
      params,
    });
  }

  /**
   * Get party outstanding report (receivables/payables)
   */
  async getPartyOutstanding(params?: { asOf?: string; type?: "customer" | "supplier" }): Promise<PartyOutstandingData> {
    return await apiClient.get<PartyOutstandingData>(`${this.baseUrl}/reports/party-outstanding`, {
      params,
    });
  }

  /**
   * Get stock summary report
   */
  async getStockSummary(params?: DateRangeParams & { level?: "product" | "variant" }): Promise<StockSummaryData> {
    return await apiClient.get<StockSummaryData>(`${this.baseUrl}/reports/stock-summary`, {
      params,
    });
  }
}

export const accountingService = new AccountingService();
