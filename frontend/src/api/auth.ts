/**
 * 인증·메뉴·권한 API. docs/02-개발-표준.md - GET /api/v1/auth/me.
 */
import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface AuthUser {
  userId: string;
  name: string;
  roles: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  path: string | null;
  icon: string;
  children: MenuItem[];
}

export interface AuthMeData {
  user: AuthUser;
  menus: MenuItem[];
  permissions: string[];
}

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  name: string;
  roles: string[];
}

export async function fetchAuthMe(): Promise<AuthMeData> {
  const { data } = await apiClient.get<ApiResponse<AuthMeData>>('/auth/me');
  if (!data.success || !data.data) throw new Error(data.message || '인증 정보 조회 실패');
  return data.data;
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', req);
    if (!data.success || !data.data) {
      throw new Error(data.message || '로그인에 실패했습니다.');
    }
    return data.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    const serverMessage = axiosErr?.response?.data?.message;
    if (serverMessage) {
      throw new Error(serverMessage);
    }
    throw err;
  }
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
