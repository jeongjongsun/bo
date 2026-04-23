import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface MenuManageRow {
  menuId: string;
  parentMenuId: string | null;
  systemMainCd: string;
  systemSubCd: string;
  menuNmKo: string;
  menuNmEn: string;
  menuNmJa: string;
  menuNmVi: string;
  menuUrl: string | null;
  isActive: boolean;
  icon: string | null;
  dispSeq: number;
  menuType: string;
  menuInfoRaw?: string;
}

export interface MenuCreateBody {
  systemMainCd?: string;
  systemSubCd: string;
  parentMenuId?: string | null;
  menuNmKo: string;
  menuNmEn?: string;
  menuNmJa?: string;
  menuNmVi?: string;
  menuUrl?: string | null;
  isActive?: boolean;
  icon?: string | null;
  dispSeq?: number;
  menuType?: string;
}

export interface MenuUpdateBody {
  menuNmKo: string;
  menuNmEn?: string;
  menuNmJa?: string;
  menuNmVi?: string;
  menuUrl?: string | null;
  isActive?: boolean;
  icon?: string | null;
  dispSeq?: number;
  menuType?: string;
}

export interface MenuCreateResult {
  menuId: string;
}

export async function fetchMenuTree(systemSubCd: string, systemMainCd = 'SYSTEM'): Promise<MenuManageRow[]> {
  const { data } = await apiClient.get<ApiResponse<MenuManageRow[]>>('/menus/manage/tree', {
    params: { systemMainCd, systemSubCd },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load menu tree');
  return data.data;
}

export async function fetchMenuDetail(menuId: string): Promise<MenuManageRow> {
  const { data } = await apiClient.get<ApiResponse<MenuManageRow>>(`/menus/manage/${encodeURIComponent(menuId)}`);
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load menu');
  return data.data;
}

export async function createMenu(body: MenuCreateBody): Promise<MenuCreateResult> {
  const { data } = await apiClient.post<ApiResponse<MenuCreateResult>>('/menus/manage', body);
  if (!data.success || !data.data) throw new Error(data.message || 'Create failed');
  return data.data;
}

export async function updateMenu(menuId: string, body: MenuUpdateBody): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>(`/menus/manage/${encodeURIComponent(menuId)}`, body);
  if (!data.success) throw new Error(data.message || 'Update failed');
}

export async function deleteMenu(menuId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/menus/manage/${encodeURIComponent(menuId)}`);
  if (!data.success) throw new Error(data.message || 'Delete failed');
}
