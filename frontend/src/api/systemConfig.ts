import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface SystemConfigDto {
  id: number;
  maxPasswordFailCount: number;
  maxInactiveLoginDays: number;
  allowDuplicateLogin: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpPasswordEnc: string | null;
  smtpFromEmail: string | null;
  smtpFromName: string | null;
  smtpUseTls: boolean;
  smtpUseSsl: boolean;
  smtpAuthRequired: boolean;
  smtpConnectionTimeoutMs: number;
  smtpReadTimeoutMs: number;
  smtpWriteTimeoutMs: number;
}

export type SaveSystemConfigRequest = Omit<SystemConfigDto, 'id'>;

export async function fetchSystemConfig(): Promise<SystemConfigDto> {
  const { data } = await apiClient.get<ApiResponse<SystemConfigDto>>('/system-config');
  if (!data.success || !data.data) throw new Error(data.message || '시스템 환경설정 조회 실패');
  return data.data;
}

export async function saveSystemConfig(body: SaveSystemConfigRequest): Promise<SystemConfigDto> {
  const { data } = await apiClient.put<ApiResponse<SystemConfigDto>>('/system-config', body);
  if (!data.success || !data.data) throw new Error(data.message || '시스템 환경설정 저장 실패');
  return data.data;
}
