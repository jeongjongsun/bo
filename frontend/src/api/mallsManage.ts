import { apiClient } from './client';
import type { ApiResponse, PagedData } from '@/types/api';

export interface MallManageRow {
  mallCd: string;
  mallNm: string;
  mallUrl: string | null;
  salesTypeCd: string | null;
  apiConnectionInfoJson: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface MallManageListParams {
  keyword?: string;
  page?: number;
  size?: number;
}

export async function fetchMallManageList(params: MallManageListParams): Promise<PagedData<MallManageRow>> {
  const { data } = await apiClient.get<ApiResponse<PagedData<MallManageRow>>>('/malls/manage', {
    params: {
      keyword: params.keyword?.trim() || undefined,
      page: params.page ?? 0,
      size: params.size ?? 100,
    },
  });
  if (!data.success || !data.data) throw new Error(data.message || 'Failed to load malls');
  return data.data;
}
