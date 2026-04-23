import { apiClient } from './client';
import type { ApiResponse, PagedData } from '@/types/api';
import type { MenuManageRow } from './menuManage';

export interface AuthGroupManageRow {
  authGroupCd: string;
  authGroupNm: string;
  isActive: boolean;
  userCount: number;
  remark: string | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface AuthGroupUpdateBody {
  authGroupNm: string;
  remark?: string | null;
}

export interface AuthGroupCreateBody {
  authGroupNm: string;
  remark?: string | null;
}

export interface AuthGroupMenuConfigResponse {
  authGroupCd: string;
  systemMainCd: string;
  systemSubCd: string;
  menus: MenuManageRow[];
  selectedMenuIds: string[];
  selectedMenuPermissions: AuthGroupMenuPermission[];
}

export interface AuthGroupMenuPermission {
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExcelDownload: boolean;
  canApprove: boolean;
}

export interface AuthGroupMenuSaveBody {
  systemMainCd?: string;
  systemSubCd: string;
  menuPermissions: AuthGroupMenuPermission[];
  changeReason?: string;
}

export interface AuthGroupMenuAuditRow {
  id: number;
  actionType: string;
  systemMainCd: string;
  systemSubCd: string;
  beforeMenuIds: string;
  afterMenuIds: string;
  affectedUserCount: number;
  changeReason: string | null;
  requestId: string | null;
  requestIp: string | null;
  userAgent: string | null;
  createdAt: string | null;
  createdBy: string | null;
}

export async function fetchAuthGroupManageList(): Promise<AuthGroupManageRow[]> {
  const { data } = await apiClient.get<ApiResponse<AuthGroupManageRow[]>>('/auth-groups/manage');
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load auth groups');
  return data.data;
}

export async function createAuthGroup(body: AuthGroupCreateBody): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth-groups/manage', body);
  if (!data.success) throw new Error(data.message || 'Failed to create auth group');
}

export async function updateAuthGroup(authGroupCd: string, body: AuthGroupUpdateBody): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>(
    `/auth-groups/manage/${encodeURIComponent(authGroupCd)}`,
    body,
  );
  if (!data.success) throw new Error(data.message || 'Failed to update auth group');
}

export async function fetchAuthGroupMenuConfig(
  authGroupCd: string,
  systemSubCd: string,
  systemMainCd = 'SYSTEM',
): Promise<AuthGroupMenuConfigResponse> {
  const { data } = await apiClient.get<ApiResponse<AuthGroupMenuConfigResponse>>(
    `/auth-groups/manage/${encodeURIComponent(authGroupCd)}/menus`,
    { params: { systemMainCd, systemSubCd } },
  );
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load group menus');
  return data.data;
}

export async function saveAuthGroupMenus(authGroupCd: string, body: AuthGroupMenuSaveBody): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>(
    `/auth-groups/manage/${encodeURIComponent(authGroupCd)}/menus`,
    body,
  );
  if (!data.success) throw new Error(data.message || 'Failed to save group menus');
}

export async function deleteAuthGroup(authGroupCd: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<null>>(
    `/auth-groups/manage/${encodeURIComponent(authGroupCd)}`,
  );
  if (!data.success) throw new Error(data.message || 'Failed to delete auth group');
}

export async function fetchAuthGroupMenuAudits(
  authGroupCd: string,
  page = 0,
  size = 20,
): Promise<PagedData<AuthGroupMenuAuditRow>> {
  const { data } = await apiClient.get<ApiResponse<PagedData<AuthGroupMenuAuditRow>>>(
    `/auth-groups/manage/${encodeURIComponent(authGroupCd)}/audits`,
    { params: { page, size } },
  );
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load audits');
  return data.data;
}
