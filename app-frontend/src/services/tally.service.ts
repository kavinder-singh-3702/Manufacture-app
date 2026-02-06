/**
 * Tally/Accounting Service
 * API client for Tally-like accounting operations
 */

import { apiClient } from './apiClient';
import type { DashboardData } from './accounting.service';

// ============================================================================
// TYPES
// ============================================================================

export type VoucherType =
  | 'sales_invoice'
  | 'purchase_bill'
  | 'receipt'
  | 'payment'
  | 'contra'
  | 'journal'
  | 'credit_note'
  | 'debit_note'
  | 'delivery_challan'
  | 'stock_adjustment';

export type VoucherStatus = 'draft' | 'posted' | 'voided';

export interface VoucherItemLine {
  product: string;
  variant?: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discountAmount?: number;
  amount: number;
  tax?: {
    gstRate?: number;
    gstType?: 'cgst_sgst' | 'igst';
  };
}

export interface VoucherTotals {
  taxable: number;
  gstTotal: number;
  gross: number;
  roundOff: number;
  net: number;
  qtyIn?: number;
  qtyOut?: number;
  cogs?: number;
}

export interface Voucher {
  id: string;
  company: string;
  voucherType: VoucherType;
  status: VoucherStatus;
  date: string;
  voucherNumber?: string;
  party?: {
    id: string;
    name: string;
  };
  referenceNumber?: string;
  narration?: string;
  lines?: {
    items?: VoucherItemLine[];
  };
  gst?: {
    enabled: boolean;
    gstType?: 'cgst_sgst' | 'igst';
  };
  totals: VoucherTotals;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherListResponse {
  vouchers: Voucher[];
  total: number;
  limit: number;
  offset: number;
}

export interface TallyStats {
  totalSales: number;
  totalPurchases: number;
  totalReceipts: number;
  totalPayments: number;
  netProfit: number;
  receivables: number;
  payables: number;
  recentVouchers: Voucher[];
}

export interface CreateVoucherPayload {
  voucherType: VoucherType;
  date?: string;
  partyId?: string;
  referenceNumber?: string;
  narration?: string;
  amount?: number;
  lines?: {
    items?: VoucherItemLine[];
  };
  gst?: {
    enabled: boolean;
    gstType?: 'cgst_sgst' | 'igst';
  };
  idempotencyKey?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class TallyService {
  private baseUrl = '/accounting/vouchers';
  private partiesUrl = '/accounting/parties';

  /**
   * Create a party (customer or supplier)
   */
  async createParty(data: {
    name: string;
    type: 'customer' | 'supplier';
    gstin?: string;
    pan?: string;
    contact?: {
      email?: string;
      phone?: string;
      contactPerson?: string;
    };
  }): Promise<any> {
    return await apiClient.post(this.partiesUrl, data);
  }

  /**
   * List all parties
   */
  async listParties(params?: {
    type?: 'customer' | 'supplier';
    search?: string;
    limit?: number;
  }): Promise<any> {
    return await apiClient.get(this.partiesUrl, { params });
  }

  /**
   * Get Tally statistics overview
   */
  async getStats(params?: { from?: string; to?: string }): Promise<TallyStats> {
    const dashboard = await apiClient.get<DashboardData>('/accounting/reports/dashboard', { params });

    // Transform dashboard data to TallyStats format
    return {
      totalSales: dashboard.sales || 0,
      totalPurchases: dashboard.purchases || 0,
      totalReceipts: 0, // Can be calculated from receipts
      totalPayments: 0, // Can be calculated from payments
      netProfit: dashboard.grossProfit || 0,
      receivables: dashboard.receivables || 0,
      payables: dashboard.payables || 0,
      recentVouchers: [],
    };
  }

  /**
   * List all vouchers with filters
   */
  async listVouchers(params?: {
    voucherType?: VoucherType;
    status?: VoucherStatus;
    partyId?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<VoucherListResponse> {
    return await apiClient.get<VoucherListResponse>(this.baseUrl, { params });
  }

  /**
   * Get a single voucher by ID
   */
  async getVoucher(voucherId: string): Promise<Voucher> {
    return await apiClient.get<Voucher>(`${this.baseUrl}/${voucherId}`);
  }

  /**
   * Create a new voucher (draft)
   */
  async createVoucher(payload: CreateVoucherPayload): Promise<Voucher> {
    return await apiClient.post<Voucher>(this.baseUrl, payload);
  }

  /**
   * Update an existing voucher (draft only)
   */
  async updateVoucher(voucherId: string, payload: Partial<CreateVoucherPayload>): Promise<Voucher> {
    return await apiClient.put<Voucher>(`${this.baseUrl}/${voucherId}`, payload);
  }

  /**
   * Post a draft voucher (make it final)
   */
  async postVoucher(voucherId: string): Promise<Voucher> {
    return await apiClient.post<Voucher>(`${this.baseUrl}/${voucherId}/post`);
  }

  /**
   * Void a posted voucher
   */
  async voidVoucher(voucherId: string, reason?: string): Promise<Voucher> {
    return await apiClient.post<Voucher>(`${this.baseUrl}/${voucherId}/void`, { reason });
  }

  /**
   * Quick create: Sales Invoice
   */
  async createSalesInvoice(data: {
    partyId: string;
    date?: string;
    items: VoucherItemLine[];
    narration?: string;
  }): Promise<Voucher> {
    const totals = this.calculateTotals(data.items);

    return this.createVoucher({
      voucherType: 'sales_invoice',
      date: data.date || new Date().toISOString(),
      partyId: data.partyId,
      narration: data.narration,
      lines: {
        items: data.items,
      },
      gst: {
        enabled: true,
        gstType: 'cgst_sgst',
      },
    });
  }

  /**
   * Quick create: Purchase Bill
   */
  async createPurchaseBill(data: {
    partyId: string;
    date?: string;
    items: VoucherItemLine[];
    narration?: string;
  }): Promise<Voucher> {
    return this.createVoucher({
      voucherType: 'purchase_bill',
      date: data.date || new Date().toISOString(),
      partyId: data.partyId,
      narration: data.narration,
      lines: {
        items: data.items,
      },
      gst: {
        enabled: true,
        gstType: 'cgst_sgst',
      },
    });
  }

  /**
   * Quick create: Receipt
   */
  async createReceipt(data: {
    partyId: string;
    amount: number;
    date?: string;
    narration?: string;
  }): Promise<Voucher> {
    return this.createVoucher({
      voucherType: 'receipt',
      date: data.date || new Date().toISOString(),
      partyId: data.partyId,
      amount: data.amount,
      narration: data.narration,
    });
  }

  /**
   * Quick create: Payment
   */
  async createPayment(data: {
    partyId: string;
    amount: number;
    date?: string;
    narration?: string;
  }): Promise<Voucher> {
    return this.createVoucher({
      voucherType: 'payment',
      date: data.date || new Date().toISOString(),
      partyId: data.partyId,
      amount: data.amount,
      narration: data.narration,
    });
  }

  /**
   * Calculate totals from items
   */
  private calculateTotals(items: VoucherItemLine[]): VoucherTotals {
    let taxable = 0;
    let gstTotal = 0;

    items.forEach(item => {
      const itemAmount = item.quantity * item.rate - (item.discountAmount || 0);
      taxable += itemAmount;

      if (item.tax?.gstRate) {
        gstTotal += (itemAmount * item.tax.gstRate) / 100;
      }
    });

    const gross = taxable + gstTotal;
    const roundOff = Math.round(gross) - gross;
    const net = Math.round(gross);

    return {
      taxable,
      gstTotal,
      gross,
      roundOff,
      net,
    };
  }
}

export const tallyService = new TallyService();
