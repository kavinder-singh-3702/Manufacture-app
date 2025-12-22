import { apiClient } from "./apiClient";

class FavoritesService {
  async list(): Promise<{ favorites: string[] }> {
    return apiClient.get<{ favorites: string[] }>("/favorites");
  }

  async add(productId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/favorites/${productId}`);
  }

  async remove(productId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/favorites/${productId}`);
  }
}

export const favoritesService = new FavoritesService();
