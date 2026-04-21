import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

/** 주문 그리드 기간 검색 기본값: ORDER_DT(주문일), REGIST_DT(등록일). null이면 주문일. */
export type DefaultOrderDateType = 'ORDER_DT' | 'REGIST_DT';

export interface UserSettingDto {
  userId: string;
  orderSimpleViewYn: boolean;
  defaultCorporationCd: string | null;
  defaultOrderDateType: DefaultOrderDateType | null;
  /** 주문 엑셀 일괄등록 시 상품 미매칭: true=비매칭 주문으로 저장, false=저장 안 함 */
  orderBulkSaveUnmatchedYn: boolean;
}

export async function fetchUserSettings(): Promise<UserSettingDto> {
  const { data } = await apiClient.get<ApiResponse<UserSettingDto>>('/user-settings');
  if (!data.success || !data.data) throw new Error(data.message || '환경설정 조회 실패');
  return data.data;
}

export interface SaveUserSettingsRequest {
  orderSimpleViewYn?: boolean;
  defaultCorporationCd?: string | null;
  defaultOrderDateType?: DefaultOrderDateType | null;
  orderBulkSaveUnmatchedYn?: boolean;
}

export async function saveUserSettings(body: SaveUserSettingsRequest): Promise<UserSettingDto> {
  const { data } = await apiClient.put<ApiResponse<UserSettingDto>>('/user-settings', body);
  if (!data.success || !data.data) throw new Error(data.message || '환경설정 저장 실패');
  return data.data;
}
