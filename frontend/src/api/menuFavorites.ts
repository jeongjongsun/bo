import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export async function addMenuFavorite(menuId: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<null>>('/me/menu-favorites', { menuId });
  if (!data.success) throw new Error(data.message || 'favorite add failed');
}

export async function removeMenuFavorite(menuId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/me/menu-favorites/${encodeURIComponent(menuId)}`);
  if (!data.success) throw new Error(data.message || 'favorite remove failed');
}
