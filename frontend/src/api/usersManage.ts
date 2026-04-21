import { apiClient } from './client';
import type { ApiResponse, PagedData } from '@/types/api';

export interface UserManageRow {
  userId: string;
  userNm: string;
  emailId: string | null;
  gradeCd: string | null;
  gradeNm: string | null;
  authGroup: string | null;
  authGroupNm: string | null;
  userStatus: string | null;
  lastLoginDtm: string | null;
  createdAt: string | null;
}

export interface UserDetail {
  userId: string;
  userNm: string;
  emailId: string | null;
  gradeCd: string | null;
  authGroup: string | null;
  userStatus: string | null;
  mobileNo: string | null;
  corporationCd: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface AuthGroupOption {
  authGroupCd: string;
  authGroupNm: string;
}

export interface UserManageListParams {
  keyword?: string;
  gradeCd?: string;
  authGroup?: string;
  page?: number;
  size?: number;
  lang?: string;
}

export async function fetchUserManageList(params: UserManageListParams): Promise<PagedData<UserManageRow>> {
  const { data } = await apiClient.get<ApiResponse<PagedData<UserManageRow>>>('/users/manage', {
    params: {
      keyword: params.keyword?.trim() || undefined,
      gradeCd: params.gradeCd?.trim() || undefined,
      authGroup: params.authGroup?.trim() || undefined,
      page: params.page ?? 0,
      size: params.size ?? 100,
      lang: params.lang,
    },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load users');
  return data.data;
}

export async function fetchUserDetail(userId: string): Promise<UserDetail> {
  const { data } = await apiClient.get<ApiResponse<UserDetail>>('/users/detail', {
    params: { userId },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load user');
  return data.data;
}

export async function fetchAuthGroupOptions(): Promise<AuthGroupOption[]> {
  const { data } = await apiClient.get<ApiResponse<AuthGroupOption[]>>('/auth-groups');
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load auth groups');
  return data.data;
}

export type UserGridEditableField = 'userNm' | 'emailId' | 'gradeCd' | 'authGroup' | 'userStatus';

export async function updateUserField(params: {
  userId: string;
  field: UserGridEditableField;
  value: unknown;
}): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>('/users/field', params);
  if (!data.success) throw new Error(data.message || 'Update failed');
}

export interface UserDetailUpdateBody {
  userId: string;
  userNm: string;
  emailId: string;
  gradeCd?: string | null;
  authGroup: string;
  userStatus: string;
  mobileNo?: string | null;
  corporationCd?: string | null;
  newPassword?: string | null;
}

export async function updateUserDetail(body: UserDetailUpdateBody): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>('/users/detail', body);
  if (!data.success) throw new Error(data.message || 'Update failed');
}

export interface UserRegisterBody {
  userId: string;
  userNm: string;
  password: string;
  emailId: string;
  gradeCd?: string;
  authGroup: string;
  userStatus: string;
  mobileNo?: string;
  corporationCd?: string;
}

export async function registerUser(body: UserRegisterBody): Promise<UserDetail> {
  const { data } = await apiClient.post<ApiResponse<UserDetail>>('/users/register', body);
  if (!data.success || !data.data) throw new Error(data.message || 'Register failed');
  return data.data;
}

export async function downloadUsersExport(
  keyword: string | undefined,
  gradeCd: string | undefined,
  authGroup: string | undefined,
  lang: string,
): Promise<void> {
  const langVal = lang?.trim() ? lang.trim() : 'en';
  const { data } = await apiClient.get<Blob>('/users/export', {
    params: {
      keyword: keyword?.trim() || undefined,
      gradeCd: gradeCd?.trim() || undefined,
      authGroup: authGroup?.trim() || undefined,
      lang: langVal,
    },
    responseType: 'blob',
    headers: { 'X-Requested-Lang': langVal },
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users_export.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
