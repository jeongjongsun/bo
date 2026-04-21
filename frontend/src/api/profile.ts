/**
 * 로그인 사용자 프로필 API. GET/PUT /api/v1/profile.
 */
import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface ProfileDto {
  userId: string;
  name: string;
  emailId: string | null;
  mobileNo: string | null;
}

export interface ProfileUpdateBody {
  name: string;
  newPassword?: string;
  newPasswordConfirm?: string;
}

export async function fetchProfile(): Promise<ProfileDto> {
  const { data } = await apiClient.get<ApiResponse<ProfileDto>>('/profile');
  if (!data.success || !data.data) throw new Error(data.message || '프로필 조회 실패');
  return data.data;
}

export async function updateProfile(body: ProfileUpdateBody): Promise<ProfileDto> {
  const { data } = await apiClient.put<ApiResponse<ProfileDto>>('/profile', body);
  if (!data.success || !data.data) throw new Error(data.message || '프로필 저장 실패');
  return data.data;
}
