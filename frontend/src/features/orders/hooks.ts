import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  fetchOrderList,
  fetchOrderCountsByStatus,
  fetchOrderDetail,
  fetchOrderStatusLog,
  updateOrder,
  createManualOrder,
  bulkImportOrders,
  bulkHoldOrders,
  bulkUnholdOrders,
  bulkDeleteOrderItems,
  bulkOrderProcess,
  bulkOrderProcessByFilter,
  bulkOrderReceivedProcess,
  bulkOrderReceivedProcessByFilter,
  bulkShipOrderProcess,
  bulkShipOrderProcessByFilter,
  bulkProcessingProcess,
  type OrderBulkItem,
  type OrderBulkItemItem,
  type OrderBulkProcessByFilterParams,
} from '@/api/orders';
import { fetchCodeList } from '@/api/codes';
import type { OrderListParams, OrderUpdateRequest, ManualOrderCreateRequest } from './types';

const ORDER_PROCESS_STATUS_MAIN_CD = 'ORDER_PROCESS_STATUS';
const SALES_TYPE_MAIN_CD = 'SALES_TYPE';
const ORDER_TYPE_MAIN_CD = 'ORDER_TYPE';
const PAYMENT_METHOD_MAIN_CD = 'PAYMENT_METHOD';
const CODE_LIST_STALE_MS = 60 * 60 * 1000;

export function useOrderList(params: OrderListParams = {}) {
  return useQuery({
    queryKey: ['orders', 'list', params],
    queryFn: () => fetchOrderList(params),
    enabled: !!params.corporationCd,
    placeholderData: (prev) => prev,
  });
}

/** 공통코드 API에 넘길 언어 (ko, en, ja, vi 지원). */
function codeListLang(i18n: { language?: string }) {
  return ['ko', 'en', 'ja', 'vi'].includes(i18n.language ?? '') ? i18n.language! : (i18n.language?.startsWith('ko') ? 'ko' : 'en');
}

/** 주문처리상태 공통코드 (그리드 필터·라벨·상세 모달). */
export function useOrderProcessStatusCodes() {
  const { i18n } = useTranslation();
  const lang = codeListLang(i18n);
  return useQuery({
    queryKey: ['codes', ORDER_PROCESS_STATUS_MAIN_CD, lang],
    queryFn: () => fetchCodeList(ORDER_PROCESS_STATUS_MAIN_CD, lang),
    staleTime: CODE_LIST_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

/** 판매구분 공통코드 (주문 상세 모달). */
export function useSalesTypeCodes() {
  const { i18n } = useTranslation();
  const lang = codeListLang(i18n);
  return useQuery({
    queryKey: ['codes', SALES_TYPE_MAIN_CD, lang],
    queryFn: () => fetchCodeList(SALES_TYPE_MAIN_CD, lang),
    staleTime: CODE_LIST_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

/** 주문타입 공통코드 (주문 상세 모달). */
export function useOrderTypeCodes() {
  const { i18n } = useTranslation();
  const lang = codeListLang(i18n);
  return useQuery({
    queryKey: ['codes', ORDER_TYPE_MAIN_CD, lang],
    queryFn: () => fetchCodeList(ORDER_TYPE_MAIN_CD, lang),
    staleTime: CODE_LIST_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

/** 결제방법 공통코드 (수기 주문 등록 모달). */
export function usePaymentMethodCodes() {
  const { i18n } = useTranslation();
  const lang = codeListLang(i18n);
  return useQuery({
    queryKey: ['codes', PAYMENT_METHOD_MAIN_CD, lang],
    queryFn: () => fetchCodeList(PAYMENT_METHOD_MAIN_CD, lang),
    staleTime: CODE_LIST_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

/** 주문 상태별 건수 (툴바 탭 표시). corporationCd·salesTypeCd·기간·dateType 변경 시 재조회. */
export function useOrderCountsByStatus(params: {
  corporationCd?: string;
  storeId?: number;
  salesTypeCd?: string;
  dateType?: string;
  orderDtFrom?: string;
  orderDtTo?: string;
}) {
  return useQuery({
    queryKey: [
      'orders',
      'counts-by-status',
      params.corporationCd ?? '',
      params.storeId ?? '',
      params.salesTypeCd ?? '',
      params.dateType ?? '',
      params.orderDtFrom ?? '',
      params.orderDtTo ?? '',
    ],
    queryFn: () =>
      fetchOrderCountsByStatus({
        corporationCd: params.corporationCd!,
        storeId: params.storeId,
        salesTypeCd: params.salesTypeCd,
        dateType: params.dateType,
        orderDtFrom: params.orderDtFrom,
        orderDtTo: params.orderDtTo,
      }),
    enabled: !!params.corporationCd,
    placeholderData: (prev) => prev,
  });
}

/** 주문 상세 (마스터 + 라인). corporationCd 필수, storeCd 선택. */
export function useOrderDetail(
  orderId: number | null,
  registDt: string | null,
  corporationCd: string | null,
  storeCd?: string | null
) {
  return useQuery({
    queryKey: ['orders', 'detail', orderId ?? 0, registDt ?? '', corporationCd ?? '', storeCd ?? ''],
    queryFn: () => fetchOrderDetail(orderId!, registDt!, corporationCd!, storeCd ?? undefined),
    enabled: !!orderId && !!registDt && !!corporationCd,
  });
}

/** 주문 상태 변경 이력(감사 로그). */
export function useOrderStatusLog(
  orderId: number | null,
  registDt: string | null,
  corporationCd: string | null,
  storeCd?: string | null
) {
  return useQuery({
    queryKey: ['orders', 'status-log', orderId ?? 0, registDt ?? '', corporationCd ?? '', storeCd ?? ''],
    queryFn: () => fetchOrderStatusLog(orderId!, registDt!, corporationCd!, storeCd ?? undefined),
    enabled: !!orderId && !!registDt && !!corporationCd,
  });
}

/** 주문 수정 뮤테이션. 성공 시 상세·목록·카운트 쿼리 무효화. */
export function useUpdateOrder(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: OrderUpdateRequest) => updateOrder(orderId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId, variables.registDt] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 수기 주문 등록. */
export function useCreateManualOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ManualOrderCreateRequest) => createManualOrder(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 주문 엑셀 일괄등록. payload: { file, corporationCd, salesTypeCd?(선택 메뉴) }. */
export function useBulkImportOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { file: File; corporationCd: string; salesTypeCd?: string }) =>
      bulkImportOrders(payload.file, payload.corporationCd, payload.salesTypeCd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
    },
  });
}

/** 그리드 셀 편집: 마스터 한 필드만 변경 후 저장. (상세 조회 → 병합 → PUT) */
export function useUpdateOrderMasterField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      orderId: number;
      registDt: string;
      corporationCd: string;
      storeCd?: string;
      field: string;
      value: string | null;
    }) => {
      const { orderId, registDt, corporationCd, storeCd, field, value } = params;
      const detail = await fetchOrderDetail(orderId, registDt, corporationCd, storeCd);
      const master = { ...detail.master, [field]: value ?? null };
      await updateOrder(orderId, { registDt, master, items: detail.items });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.orderId, variables.registDt] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 그리드 셀 편집: 라인 한 필드만 변경 후 저장 (수량·금액·할인금액). (상세 조회 → 해당 라인 병합 → PUT) */
export function useUpdateOrderItemField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      orderId: number;
      registDt: string;
      corporationCd: string;
      storeCd?: string;
      lineNo: number;
      field: 'lineQty' | 'lineAmount' | 'lineDiscountAmount';
      value: number;
    }) => {
      const { orderId, registDt, corporationCd, storeCd, lineNo, field, value } = params;
      const detail = await fetchOrderDetail(orderId, registDt, corporationCd, storeCd);
      const items = detail.items.map((item) =>
        item.lineNo === lineNo ? { ...item, [field]: value } : item
      );
      await updateOrder(orderId, { registDt, master: detail.master, items });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.orderId, variables.registDt] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 선택 주문 일괄 출고보류. payload: { corporationCd, items, storeCd? } */
export function useBulkHoldOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { corporationCd: string; items: OrderBulkItem[]; storeCd?: string }) =>
      bulkHoldOrders(payload.corporationCd, payload.items, payload.storeCd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 선택 주문 일괄 보류 해제. payload: { corporationCd, items, storeCd? } */
export function useBulkUnholdOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { corporationCd: string; items: OrderBulkItem[]; storeCd?: string }) =>
      bulkUnholdOrders(payload.corporationCd, payload.items, payload.storeCd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 선택 주문 라인 일괄 삭제. payload: { corporationCd, items, storeCd? } */
export function useBulkDeleteOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { corporationCd: string; items: OrderBulkItemItem[]; storeCd?: string }) =>
      bulkDeleteOrderItems(payload.corporationCd, payload.items, payload.storeCd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 선택 주문 일괄 주문서 처리. payload: { corporationCd, items, storeCd? } */
export function useBulkOrderProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { corporationCd: string; items: OrderBulkItem[]; storeCd?: string }) =>
      bulkOrderProcess(payload.corporationCd, payload.items, payload.storeCd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 필터 조건에 맞는 발주(접수) 주문 전체 일괄 주문서 처리. */
export function useBulkOrderProcessByFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: OrderBulkProcessByFilterParams) => bulkOrderProcessByFilter(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 선택 합포장 처리 주문 이전단계 처리. payload: { corporationCd, items, storeCd? } */
export function useBulkOrderReceivedProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { corporationCd: string; items: OrderBulkItem[]; storeCd?: string }) =>
      bulkOrderReceivedProcess(payload.corporationCd, payload.items, payload.storeCd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 필터 조건에 맞는 합포장 처리 주문 전체 이전단계 처리. */
export function useBulkOrderReceivedProcessByFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: OrderBulkProcessByFilterParams) => bulkOrderReceivedProcessByFilter(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 선택 합포장 처리 주문 다음단계(출고준비) 처리. */
export function useBulkShipOrderProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { corporationCd: string; items: OrderBulkItem[]; storeCd?: string }) =>
      bulkShipOrderProcess(payload.corporationCd, payload.items, payload.storeCd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 필터 조건에 맞는 합포장 처리 주문 전체 다음단계(출고준비) 처리. */
export function useBulkShipOrderProcessByFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: OrderBulkProcessByFilterParams) => bulkShipOrderProcessByFilter(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}

/** 선택 출고준비 주문을 합포장처리(PROCESSING)로 이동. */
export function useBulkProcessingProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { corporationCd: string; items: OrderBulkItem[]; storeCd?: string }) =>
      bulkProcessingProcess(payload.corporationCd, payload.items, payload.storeCd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'counts-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'status-log'] });
    },
  });
}
