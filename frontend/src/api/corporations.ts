import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface CorporationItem {
  corporationCd: string;
  corporationNm: string;
}

export async function fetchCorporations(): Promise<CorporationItem[]> {
  const { data } = await apiClient.get<ApiResponse<CorporationItem[]>>('/corporations');
  if (!data.success || !data.data) throw new Error(data.message || '법인 목록 조회 실패');
  return data.data;
}
