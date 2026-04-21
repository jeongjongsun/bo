import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface CodeItem {
  subCd: string;
  codeNm: string;
}

const PACK_UNIT_MAIN_CD = 'PACK_UNIT';

export async function fetchCodeList(mainCd: string, lang?: string) {
  const params = lang ? { lang } : {};
  const { data } = await apiClient.get<ApiResponse<CodeItem[]>>(`/codes/list/${mainCd}`, { params });
  if (!data.success || !data.data) throw new Error(data.message || '공통코드 조회 실패');
  return data.data;
}

export async function fetchUnitCodes(lang?: string) {
  return fetchCodeList(PACK_UNIT_MAIN_CD, lang);
}
