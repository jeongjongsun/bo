import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  createStore,
  fetchMallList,
  fetchMallOptions,
  updateStore,
  fetchStoreConnections,
  createStoreConnection,
  updateStoreConnection,
  deleteStoreConnection,
} from '@/api/malls';
import { fetchCodeList } from '@/api/codes';
import type { MallListParams } from './types';
import type {
  StoreCreateParams,
  StoreUpdateParams,
  StoreConnectionSaveParams,
} from '@/api/malls';

const SALES_TYPE_MAIN_CD = 'SALES_TYPE';
const STORE_TYPE_MAIN_CD = 'STORE_TYPE';
const CURRENCY_MAIN_CD = 'CURRENCY';
const CODE_LIST_STALE_MS = 60 * 60 * 1000;

/** 공통코드 목록 (main_cd별, 언어 반영). */
export function useCodeList(mainCd: string) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
  return useQuery({
    queryKey: ['codes', mainCd, lang],
    queryFn: () => fetchCodeList(mainCd, lang),
    staleTime: CODE_LIST_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

/** 판매구분 공통코드 (쇼핑몰 필터·그리드 라벨). */
export function useSalesTypeCodes() {
  return useCodeList(SALES_TYPE_MAIN_CD);
}

/** 상점구분 공통코드 (상점 등록/수정 모달). */
export function useStoreTypeCodes() {
  return useCodeList(STORE_TYPE_MAIN_CD);
}

/** 통화코드 공통코드 (상점 등록/수정 모달). */
export function useCurrencyCodes() {
  return useCodeList(CURRENCY_MAIN_CD);
}

export function useMallList(params: MallListParams = {}) {
  return useQuery({
    queryKey: ['malls', 'list', params],
    queryFn: () => fetchMallList(params),
    placeholderData: (prev) => prev,
  });
}

export function useMallOptions() {
  return useQuery({
    queryKey: ['malls', 'options'],
    queryFn: fetchMallOptions,
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, ...params }: { storeId: number } & StoreUpdateParams) =>
      updateStore(storeId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['malls', 'list'] });
    },
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: StoreCreateParams) => createStore(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['malls', 'list'] });
    },
  });
}

const storeConnectionsQueryKey = (storeId: number) => ['malls', 'stores', storeId, 'connections'] as const;

export function useStoreConnections(storeId: number | null) {
  return useQuery({
    queryKey: storeConnectionsQueryKey(storeId ?? 0),
    queryFn: () => fetchStoreConnections(storeId!),
    enabled: storeId != null && storeId > 0,
    placeholderData: (prev) => prev,
  });
}

export function useCreateStoreConnection(storeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: StoreConnectionSaveParams) => createStoreConnection(storeId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeConnectionsQueryKey(storeId) });
    },
  });
}

export function useUpdateStoreConnection(storeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      ...params
    }: { connectionId: number } & StoreConnectionSaveParams) =>
      updateStoreConnection(storeId, connectionId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeConnectionsQueryKey(storeId) });
    },
  });
}

export function useDeleteStoreConnection(storeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: number) => deleteStoreConnection(storeId, connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeConnectionsQueryKey(storeId) });
    },
  });
}
