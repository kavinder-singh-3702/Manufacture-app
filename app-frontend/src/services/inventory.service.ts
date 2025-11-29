import { apiClient } from "./apiClient";

// ============================================================
// INVENTORY TYPES
// ============================================================

export type InventoryCategory = {
  id: string;
  title: string;
  count: number;
  totalQuantity?: number;
};

export type InventoryItem = {
  _id: string;
  name: string;
  description?: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  costPrice: number;
  sellingPrice: number;
  currency: string;
  status: "active" | "low_stock" | "out_of_stock" | "discontinued";
  location?: {
    warehouse?: string;
    rack?: string;
    bin?: string;
  };
  supplier?: {
    name?: string;
    contact?: string;
    leadTimeDays?: number;
  };
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateInventoryItemInput = {
  name: string;
  description?: string;
  sku?: string;
  category: string;
  quantity: number;
  unit?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  costPrice?: number;
  sellingPrice?: number;
  currency?: string;
  location?: {
    warehouse?: string;
    rack?: string;
    bin?: string;
  };
  supplier?: {
    name?: string;
    contact?: string;
    leadTimeDays?: number;
  };
  tags?: string[];
};

export type InventoryStats = {
  totalItems: number;
  totalQuantity: number;
  totalCostValue: number;
  totalSellingValue: number;
  categoryDistribution: Array<{
    id: string;
    label: string;
    count: number;
    totalQuantity: number;
  }>;
  statusBreakdown: {
    active: number;
    low_stock: number;
    out_of_stock: number;
    discontinued: number;
  };
  lowStockCount: number;
  outOfStockCount: number;
};

type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

// ============================================================
// INVENTORY SERVICE
// ============================================================

class InventoryService {
  /**
   * Get all inventory categories with item counts
   */
  async getCategoryStats(): Promise<{ categories: InventoryCategory[] }> {
    const response = await apiClient.get<{ categories: InventoryCategory[] }>(
      "/inventory/categories"
    );
    return response;
  }

  /**
   * Get items in a specific category
   */
  async getItemsByCategory(
    categoryId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedResponse<InventoryItem>> {
    const response = await apiClient.get<PaginatedResponse<InventoryItem>>(
      `/inventory/categories/${categoryId}/items`,
      { params }
    );
    return response;
  }

  /**
   * Get all inventory items with optional filters
   */
  async getAllItems(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<InventoryItem>> {
    const response = await apiClient.get<PaginatedResponse<InventoryItem>>(
      "/inventory/items",
      { params }
    );
    return response;
  }

  /**
   * Get a single inventory item by ID
   */
  async getItemById(itemId: string): Promise<InventoryItem> {
    const response = await apiClient.get<InventoryItem>(
      `/inventory/items/${itemId}`
    );
    return response;
  }

  /**
   * Create a new inventory item
   */
  async createItem(data: CreateInventoryItemInput): Promise<InventoryItem> {
    const response = await apiClient.post<InventoryItem>(
      "/inventory/items",
      data
    );
    return response;
  }

  /**
   * Update an inventory item
   */
  async updateItem(
    itemId: string,
    data: Partial<CreateInventoryItemInput>
  ): Promise<InventoryItem> {
    const response = await apiClient.put<InventoryItem>(
      `/inventory/items/${itemId}`,
      data
    );
    return response;
  }

  /**
   * Adjust item quantity (positive to add, negative to subtract)
   */
  async adjustQuantity(
    itemId: string,
    adjustment: number
  ): Promise<InventoryItem> {
    const response = await apiClient.patch<InventoryItem>(
      `/inventory/items/${itemId}/quantity`,
      { adjustment }
    );
    return response;
  }

  /**
   * Delete an inventory item
   */
  async deleteItem(itemId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/inventory/items/${itemId}`
    );
    return response;
  }

  /**
   * Get inventory statistics for dashboard/stats
   */
  async getStats(): Promise<InventoryStats> {
    const response = await apiClient.get<InventoryStats>("/inventory/stats");
    return response;
  }
}

export const inventoryService = new InventoryService();
