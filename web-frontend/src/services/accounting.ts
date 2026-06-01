import { httpClient, QueryParams } from "../lib/http-client";
import type {
  DashboardData, DateRangeParams, GSTSummaryData, PartyOutstandingData,
  ProfitAndLossData, RecentVoucher,
} from "../types/accounting";

const toQuery = (params?: Record<string, unknown>): QueryParams | undefined => {
  if (!params) return undefined;
  const out: QueryParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
  });
  return Object.keys(out).length ? out : undefined;
};

const getDashboard = (params?: DateRangeParams) =>
  httpClient.get<DashboardData>("/accounting/reports/dashboard", { params: toQuery(params) });

const getProfitAndLoss = (params?: DateRangeParams) =>
  httpClient.get<ProfitAndLossData>("/accounting/reports/pnl", { params: toQuery(params) });

const getGSTSummary = (params?: DateRangeParams) =>
  httpClient.get<GSTSummaryData>("/accounting/reports/gst-summary", { params: toQuery(params) });

const getPartyOutstanding = (params?: { asOf?: string; type?: "customer" | "supplier" }) =>
  httpClient.get<PartyOutstandingData>("/accounting/reports/party-outstanding", { params: toQuery(params) });

const listVouchers = (params?: { limit?: number; offset?: number; status?: string; from?: string; to?: string }) =>
  httpClient.get<{ vouchers: RecentVoucher[]; pagination: { total: number; hasMore: boolean } }>("/accounting/vouchers", { params: toQuery(params) });

export const accountingService = { getDashboard, getProfitAndLoss, getGSTSummary, getPartyOutstanding, listVouchers };
