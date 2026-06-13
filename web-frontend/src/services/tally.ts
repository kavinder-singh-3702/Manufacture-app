import { httpClient, QueryParams } from "../lib/http-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type VoucherType =
  | "sales_invoice"
  | "purchase_bill"
  | "receipt"
  | "payment"
  | "journal"
  | "credit_note"
  | "debit_note";

export type VoucherStatus = "draft" | "posted" | "voided";
export type PartyType = "customer" | "supplier";

export type Party = {
  _id: string;
  name: string;
  type: PartyType;
  gstin?: string;
  pan?: string;
  contact?: { email?: string; phone?: string; contactPerson?: string };
};

export type PartyListResponse = {
  parties: Party[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type VoucherItemLine = {
  product: string;
  variant?: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discountAmount?: number;
  amount: number;
  tax?: { gstRate?: number; gstType?: "cgst_sgst" | "igst" };
};

export type VoucherTotals = {
  taxable: number;
  gstTotal: number;
  gross: number;
  roundOff: number;
  net: number;
};

export type Voucher = {
  _id: string;
  company: string;
  voucherType: VoucherType;
  status: VoucherStatus;
  date: string;
  voucherNumber?: string;
  party?: { _id: string; name: string } | string;
  referenceNumber?: string;
  narration?: string;
  lines?: { items?: VoucherItemLine[] };
  gst?: { enabled: boolean; gstType?: "cgst_sgst" | "igst" };
  totals: VoucherTotals;
  amount?: number;
  createdAt: string;
  updatedAt: string;
};

export type VoucherListResponse = {
  vouchers: Voucher[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type TallyStats = {
  totalSales: number;
  totalPurchases: number;
  totalReceipts: number;
  totalPayments: number;
  netProfit: number;
  receivables: number;
  payables: number;
  recentVouchers: Voucher[];
};

export type CreateVoucherPayload = {
  voucherType: VoucherType;
  date?: string;
  partyId?: string;
  paymentMode?: "cash" | "bank";
  referenceNumber?: string;
  narration?: string;
  amount?: number;
  lines?: { items?: VoucherItemLine[] };
  gst?: { enabled: boolean; gstType?: "cgst_sgst" | "igst" };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Service ───────────────────────────────────────────────────────────────────

const createParty = (data: { name: string; type: PartyType; gstin?: string; contact?: { phone?: string; email?: string } }) =>
  httpClient.post<{ party: Party }>("/accounting/parties", data).then((r) => r.party);

const listParties = (params?: { type?: PartyType; search?: string; limit?: number; offset?: number }) =>
  httpClient.get<PartyListResponse>("/accounting/parties", { params: toQuery(params) });

const createVoucher = (payload: CreateVoucherPayload) =>
  httpClient.post<{ voucher: Voucher }>("/accounting/vouchers", payload).then((r) => r.voucher);

const postVoucher = (voucherId: string) =>
  httpClient.post<{ voucher: Voucher }>(`/accounting/vouchers/${voucherId}/post`).then((r) => r.voucher);

const listVouchers = (params?: {
  voucherType?: VoucherType;
  status?: VoucherStatus;
  partyId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) => httpClient.get<VoucherListResponse>("/accounting/vouchers", { params: toQuery(params) });

const getStats = async (params?: { from?: string; to?: string }): Promise<TallyStats> => {
  const [dashboard, recent] = await Promise.all([
    httpClient.get<{
      totalSales?: number; totalPurchases?: number; totalReceipts?: number;
      totalPayments?: number; netProfit?: number; receivables?: number; payables?: number;
    }>("/accounting/reports/dashboard", { params: toQuery(params) }),
    listVouchers({ status: "posted", limit: 5, offset: 0, from: params?.from, to: params?.to }),
  ]);
  return {
    totalSales:     (dashboard as Record<string, number>).totalSales     ?? 0,
    totalPurchases: (dashboard as Record<string, number>).totalPurchases ?? 0,
    totalReceipts:  (dashboard as Record<string, number>).totalReceipts  ?? 0,
    totalPayments:  (dashboard as Record<string, number>).totalPayments  ?? 0,
    netProfit:      (dashboard as Record<string, number>).netProfit      ?? 0,
    receivables:    (dashboard as Record<string, number>).receivables    ?? 0,
    payables:       (dashboard as Record<string, number>).payables       ?? 0,
    recentVouchers: recent.vouchers ?? [],
  };
};

export const tallyService = { createParty, listParties, createVoucher, postVoucher, listVouchers, getStats };
