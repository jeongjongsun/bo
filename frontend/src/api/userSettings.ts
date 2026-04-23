import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface UserSettingDto {
  userId: string;
  defaultCorporationCd: string | null;
}

export async function fetchUserSettings(): Promise<UserSettingDto> {
  const { data } = await apiClient.get<ApiResponse<UserSettingDto>>('/user-settings');
  if (!data.success || !data.data) throw new Error(data.message || '환경설정 조회 실패');
  return data.data;
}

export interface SaveUserSettingsRequest {
  defaultCorporationCd?: string | null;
}

export async function saveUserSettings(body: SaveUserSettingsRequest): Promise<UserSettingDto> {
  const { data } = await apiClient.put<ApiResponse<UserSettingDto>>('/user-settings', body);
  if (!data.success || !data.data) throw new Error(data.message || '환경설정 저장 실패');
  return data.data;
}
