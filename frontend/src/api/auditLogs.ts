import { apiClient } from './client';
import type { PagedData, PagedResponse } from '@/types/api';

export interface AuditLogListRow {
  id: number;
  domainType: string;
  systemMainCd: string;
  systemSubCd: string;
  menuCode: string;
  menuNameKo: string;
  actionCode: 'CREATE' | 'UPDATE' | 'DELETE';
  actionNameKo: string;
  entityType: string;
  entityId: string;
  beforeData: string;
  afterData: string;
  changedFields: string;
  actorUserId: string;
  actedAt: string;
}

export interface AuditLogListParams {
  systemSubCd?: 'BO' | 'OM';
  actionCode?: 'CREATE' | 'UPDATE' | 'DELETE';
  keyword?: string;
  fromTs?: string;
  toTs?: string;
  page?: number;
  size?: number;
}

export async function fetchAuditLogs(params: AuditLogListParams): Promise<PagedData<AuditLogListRow>> {
  const { data } = await apiClient.get<PagedResponse<AuditLogListRow>>('/audit-logs', { params });
  if (!data.success || !data.data) throw new Error(data.message || '감사이력 조회 실패');
  return data.data;
}
