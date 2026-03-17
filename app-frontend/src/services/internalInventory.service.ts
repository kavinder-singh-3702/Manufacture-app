import { apiClient } from "./apiClient";

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

export type InternalStockMovement = {
  _id: string;
  company: string;
  item:
    | string
    | {
        _id: string;
        name: string;
        sku?: string;
        category?: string;
        unit?: string;
      };
  movementType: InternalStockMovementType;
  qtyDelta: number;
  qtyAfter: number;
  unitCost: number;
  valueDelta: number;
  note?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type InternalInventoryDashboard = {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  statusBreakdown: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
  };
  lowStockCount: number;
  outOfStockCount: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
    totalQuantity: number;
    totalValue: number;
  }>;
  lowStockItems: InternalInventoryItem[];
  recentMovements: InternalStockMovement[];
};

export type InternalInventoryListParams = {
  search?: string;
  category?: string;
  status?: InternalInventoryStatus;
  sort?: "nameAsc" | "nameDesc" | "qtyDesc" | "qtyAsc" | "valueDesc" | "valueAsc" | "updatedAtDesc" | "updatedAtAsc";
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

class InternalInventoryService {
  private baseUrl = "/accounting/internal-inventory";

  async getDashboard(): Promise<InternalInventoryDashboard> {
    return apiClient.get<InternalInventoryDashboard>(`${this.baseUrl}/dashboard`);
  }

  async listItems(params?: InternalInventoryListParams): Promise<{
    items: InternalInventoryItem[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    return apiClient.get(`${this.baseUrl}/items`, { params });
  }

  async getItem(itemId: string): Promise<InternalInventoryItem> {
    const response = await apiClient.get<{ item: InternalInventoryItem }>(`${this.baseUrl}/items/${itemId}`);
    return response.item;
  }

  async createItem(payload: InternalInventoryMutationPayload): Promise<InternalInventoryItem> {
    const response = await apiClient.post<{ item: InternalInventoryItem }>(`${this.baseUrl}/items`, payload);
    return response.item;
  }

  async updateItem(itemId: string, payload: Partial<InternalInventoryMutationPayload>): Promise<InternalInventoryItem> {
    const response = await apiClient.put<{ item: InternalInventoryItem }>(`${this.baseUrl}/items/${itemId}`, payload);
    return response.item;
  }

  async deleteItem(itemId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`${this.baseUrl}/items/${itemId}`);
  }

  async adjustItem(itemId: string, payload: InternalInventoryAdjustPayload): Promise<{
    item: InternalInventoryItem;
    movement: InternalStockMovement;
  }> {
    return apiClient.post(`${this.baseUrl}/items/${itemId}/adjust`, payload);
  }

  async listItemMovements(
    itemId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<{
    rows: InternalStockMovement[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> {
    return apiClient.get(`${this.baseUrl}/items/${itemId}/movements`, { params });
  }
}

export const internalInventoryService = new InternalInventoryService();
