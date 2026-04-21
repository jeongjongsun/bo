import { apiClient } from './client';
import type { ApiResponse, PagedData } from '@/types/api';

export interface CorporationManageRow {
  corporationCd: string;
  corporationNm: string;
  businessNo: string | null;
  telNo: string | null;
  email: string | null;
  createdAt: string | null;
}

export interface CorporationDetail {
  corporationCd: string;
  corporationNm: string;
  businessNo: string | null;
  telNo: string | null;
  email: string | null;
  ceoNm: string | null;
  address: string | null;
  faxNo: string | null;
  homepageUrl: string | null;
  remark: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CorporationManageListParams {
  keyword?: string;
  page?: number;
  size?: number;
}

export async function fetchCorporationManageList(
  params: CorporationManageListParams,
): Promise<PagedData<CorporationManageRow>> {
  const { data } = await apiClient.get<ApiResponse<PagedData<CorporationManageRow>>>('/corporations/manage', {
    params: {
      keyword: params.keyword?.trim() || undefined,
      page: params.page ?? 0,
      size: params.size ?? 100,
    },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load corporations');
  return data.data;
}

export async function fetchCorporationDetail(corporationCd: string): Promise<CorporationDetail> {
  const { data } = await apiClient.get<ApiResponse<CorporationDetail>>('/corporations/detail', {
    params: { corporationCd },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load detail');
  return data.data;
}

export type CorporationGridEditableField = 'corporationNm' | 'businessNo' | 'telNo' | 'email';

export async function updateCorporationField(params: {
  corporationCd: string;
  field: CorporationGridEditableField;
  value: unknown;
}): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>('/corporations/field', params);
  if (!data.success) throw new Error(data.message || 'Update failed');
}

export interface CorporationDetailUpdateBody {
  corporationCd: string;
  corporationNm: string;
  businessNo?: string | null;
  telNo?: string | null;
  email?: string | null;
  ceoNm?: string | null;
  address?: string | null;
  faxNo?: string | null;
  homepageUrl?: string | null;
  remark?: string | null;
}

export async function updateCorporationDetail(body: CorporationDetailUpdateBody): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>('/corporations/detail', body);
  if (!data.success) throw new Error(data.message || 'Update failed');
}

export interface CorporationRegisterBody {
  corporationNm: string;
  businessNo?: string;
  telNo?: string;
  email?: string;
  ceoNm?: string;
  address?: string;
  faxNo?: string;
  homepageUrl?: string;
  remark?: string;
}

export async function registerCorporation(body: CorporationRegisterBody): Promise<CorporationDetail> {
  const { data } = await apiClient.post<ApiResponse<CorporationDetail>>('/corporations/register', body);
  if (!data.success || !data.data) throw new Error(data.message || 'Register failed');
  return data.data;
}

export async function downloadCorporationsExport(keyword: string | undefined, lang: string): Promise<void> {
  const langVal = lang?.trim() ? lang.trim() : 'en';
  const { data } = await apiClient.get<Blob>('/corporations/export', {
    params: { keyword: keyword?.trim() || undefined, lang: langVal },
    responseType: 'blob',
    headers: { 'X-Requested-Lang': langVal },
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'corporations_export.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
