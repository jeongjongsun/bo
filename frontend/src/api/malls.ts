import { apiClient } from './client';
import type { ApiResponse, PagedResponse } from '@/types/api';
import type { MallStoreListItem, MallListParams, StoreInfoLike } from '@/features/malls/types';

function parseStoreInfo(raw: unknown): StoreInfoLike | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && raw !== null) return raw as StoreInfoLike;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return parsed as StoreInfoLike;
    } catch {
      return null;
    }
  }
  return null;
}

/** API 응답 item이 snake_case일 수 있으므로 camelCase로 정규화 */
function normalizeMallStoreItem(raw: Record<string, unknown>): MallStoreListItem {
  return {
    storeId: (raw.storeId ?? raw.store_id) as number,
    mallCd: (raw.mallCd ?? raw.mall_cd) as string,
    mallNm: (raw.mallNm ?? raw.mall_nm) as string,
    storeCd: (raw.storeCd ?? raw.store_cd) as string,
    storeNm: (raw.storeNm ?? raw.store_nm) as string,
    deliveryType: (raw.deliveryType ?? raw.delivery_type) as string | null,
    collectionType: (raw.collectionType ?? raw.collection_type) as string | null,
    salesTypeCd: (raw.salesTypeCd ?? raw.sales_type_cd) as string | null,
    isActive: (raw.isActive ?? raw.is_active) as boolean | null,
    storeInfo: parseStoreInfo(raw.storeInfo ?? raw.store_info),
    createdAt: (raw.createdAt ?? raw.created_at) as string | null,
    createdBy: (raw.createdBy ?? raw.created_by) as string | null,
  };
}

export async function fetchMallList(params: MallListParams = {}) {
  const { data } = await apiClient.get<PagedResponse<MallStoreListItem>>('/malls', { params });
  if (!data.success || !data.data) throw new Error(data.message || '쇼핑몰 목록 조회 실패');
  const d = data.data;
  return {
    ...d,
    items: (d.items ?? []).map((item) => normalizeMallStoreItem(item as Record<string, unknown>)),
  };
}

export interface StoreUpdateParams {
  mallCd?: string;
  storeNm: string;
  storeInfo?: StoreInfoLike;
  isActive?: boolean;
}

export async function updateStore(storeId: number, params: StoreUpdateParams) {
  const body: Record<string, unknown> = { storeNm: params.storeNm };
  if (params.mallCd !== undefined && params.mallCd !== '') body.mallCd = params.mallCd;
  if (params.storeInfo != null && Object.keys(params.storeInfo).length > 0) body.storeInfo = params.storeInfo;
  if (params.isActive !== undefined) body.isActive = params.isActive;
  const { data } = await apiClient.patch<ApiResponse<null>>(`/malls/stores/${storeId}`, body);
  if (!data.success) throw new Error(data.message || '상점 수정 실패');
}

export interface MallOptionItem {
  mallCd: string;
  mallNm: string;
}

export async function fetchMallOptions(): Promise<MallOptionItem[]> {
  const { data } = await apiClient.get<ApiResponse<MallOptionItem[]>>('/malls/options');
  if (!data.success || !data.data) throw new Error(data.message || '쇼핑몰 목록 조회 실패');
  return data.data;
}

export interface StoreCreateParams {
  mallCd: string;
  corporationCd: string;
  storeNm: string;
  storeCd?: string;
  storeInfo?: { currency_cd?: string; gmt?: string; wms_yn?: string; store_type_cd?: string };
  isActive?: boolean;
}

export async function createStore(params: StoreCreateParams): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<null>>('/malls/stores', params);
  if (!data.success) throw new Error(data.message || '상점 등록 실패');
}

// ----- 상점 API 접속정보 (1:N) -----

export interface StoreConnectionItem {
  connectionId: number;
  storeId: number;
  connectionAlias: string;
  apiId: string | null;
  apiPassword: string | null;
  clientId: string | null;
  siteCode: string | null;
  redirectUri: string | null;
  clientSecret: string | null;
  scope: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

function normalizeStoreConnection(raw: Record<string, unknown>): StoreConnectionItem {
  return {
    connectionId: (raw.connectionId ?? raw.connection_id) as number,
    storeId: (raw.storeId ?? raw.store_id) as number,
    connectionAlias: (raw.connectionAlias ?? raw.connection_alias) as string,
    apiId: (raw.apiId ?? raw.api_id) as string | null,
    apiPassword: (raw.apiPassword ?? raw.api_password) as string | null,
    clientId: (raw.clientId ?? raw.client_id) as string | null,
    siteCode: (raw.siteCode ?? raw.site_code) as string | null,
    redirectUri: (raw.redirectUri ?? raw.redirect_uri) as string | null,
    clientSecret: (raw.clientSecret ?? raw.client_secret) as string | null,
    scope: (raw.scope ?? raw.scope) as string | null,
    createdAt: (raw.createdAt ?? raw.created_at) as string | null,
    updatedAt: (raw.updatedAt ?? raw.updated_at) as string | null,
    createdBy: (raw.createdBy ?? raw.created_by) as string | null,
    updatedBy: (raw.updatedBy ?? raw.updated_by) as string | null,
  };
}

export async function fetchStoreConnections(storeId: number): Promise<StoreConnectionItem[]> {
  const { data } = await apiClient.get<ApiResponse<StoreConnectionItem[]>>(`/malls/stores/${storeId}/connections`);
  if (!data.success || !data.data) throw new Error(data.message || '접속정보 조회 실패');
  return (data.data as unknown[]).map((item) => normalizeStoreConnection(item as Record<string, unknown>));
}

export interface StoreConnectionSaveParams {
  connectionAlias: string;
  apiId?: string;
  apiPassword?: string;
  clientId?: string;
  siteCode?: string;
  redirectUri?: string;
  clientSecret?: string;
  scope?: string;
}

export async function createStoreConnection(storeId: number, params: StoreConnectionSaveParams): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<null>>(`/malls/stores/${storeId}/connections`, params);
  if (!data.success) throw new Error(data.message || '접속정보 등록 실패');
}

export async function updateStoreConnection(
  storeId: number,
  connectionId: number,
  params: StoreConnectionSaveParams,
): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>(
    `/malls/stores/${storeId}/connections/${connectionId}`,
    params,
  );
  if (!data.success) throw new Error(data.message || '접속정보 수정 실패');
}

export async function deleteStoreConnection(storeId: number, connectionId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<null>>(
    `/malls/stores/${storeId}/connections/${connectionId}`,
  );
  if (!data.success) throw new Error(data.message || '접속정보 삭제 실패');
}
