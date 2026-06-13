import { httpClient, QueryParams } from "../lib/http-client";

// ── Types ──────────────────────────────────────────────────────────────────────

export type InternalInventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InternalInventoryItem = {
  _id: string;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  onHandQty: number;
  reorderLevel: number;
  avgCost: number;
  totalValue: number;
  stockStatus: InternalInventoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type InternalStockMovementType = "in" | "out" | "adjust";

export type InternalInventoryDashboard = {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  statusBreakdown: { in_stock: number; low_stock: number; out_of_stock: number };
  lowStockCount: number;
  outOfStockCount: number;
  categoryDistribution: Array<{ category: string; count: number; totalQuantity: number; totalValue: number }>;
  lowStockItems: InternalInventoryItem[];
};

export type InternalInventoryListParams = {
  search?: string;
  category?: string;
  status?: InternalInventoryStatus;
  sort?: "nameAsc" | "nameDesc" | "qtyDesc" | "qtyAsc" | "valueDesc" | "valueAsc" | "updatedAtDesc";
  limit?: number;
  offset?: number;
};

export type InternalInventoryMutationPayload = {
  name: string;
  sku?: string;
  category: string;
  unit?: string;
  onHandQty?: number;
  reorderLevel?: number;
  avgCost?: number;
};

export type InternalInventoryAdjustPayload = {
  movementType: InternalStockMovementType;
  quantity: number;
  unitCost?: number;
  note?: string;
};

export type InternalInventoryListResponse = {
  items: InternalInventoryItem[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
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

const BASE = "/accounting/internal-inventory";

// ── Service ───────────────────────────────────────────────────────────────────

const getDashboard = () =>
  httpClient.get<InternalInventoryDashboard>(`${BASE}/dashboard`);

const listItems = (params?: InternalInventoryListParams) =>
  httpClient.get<InternalInventoryListResponse>(`${BASE}/items`, { params: toQuery(params as Record<string, unknown>) });

const getItem = (itemId: string) =>
  httpClient.get<{ item: InternalInventoryItem }>(`${BASE}/items/${itemId}`).then((r) => r.item);

const createItem = (payload: InternalInventoryMutationPayload) =>
  httpClient.post<{ item: InternalInventoryItem }>(`${BASE}/items`, payload).then((r) => r.item);

const updateItem = (itemId: string, payload: Partial<InternalInventoryMutationPayload>) =>
  httpClient.patch<{ item: InternalInventoryItem }>(`${BASE}/items/${itemId}`, payload).then((r) => r.item);

const deleteItem = (itemId: string) =>
  httpClient.delete<{ success: boolean }>(`${BASE}/items/${itemId}`);

const adjustItem = (itemId: string, payload: InternalInventoryAdjustPayload) =>
  httpClient.post<{ item: InternalInventoryItem }>(`${BASE}/items/${itemId}/adjust`, payload).then((r) => r.item);

export const internalInventoryService = {
  getDashboard,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  adjustItem,
};
