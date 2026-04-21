/**
 * 주문 API. 목록 페이징. docs/menu/주문관리.md.
 */
import { apiClient } from './client';
import type { PagedResponse } from '@/types/api';
import type {
  OrderDetailResponse,
  OrderListItem,
  OrderListParams,
  OrderUpdateRequest,
  ManualOrderCreateRequest,
  ManualOrderCreateResponse,
  OrderStatusLogItem,
} from '@/features/orders/types';

function normalizeOrderListItem(raw: Record<string, unknown>): OrderListItem {
  return {
    orderId: Number(raw.orderId ?? raw.order_id ?? 0),
    lineNo: Number(raw.lineNo ?? raw.line_no ?? 0),
    orderNo: (raw.orderNo ?? raw.order_no ?? '') as string,
    itemOrderNo: (raw.itemOrderNo ?? raw.item_order_no ?? null) as string | null,
    combinedShipNo: (raw.combinedShipNo ?? raw.combined_ship_no ?? null) as string | null,
    mallCd: (raw.mallCd ?? raw.mall_cd ?? '') as string,
    mallNm: (raw.mallNm ?? raw.mall_nm ?? null) as string | null,
    storeCd: (raw.storeCd ?? raw.store_cd ?? '') as string,
    storeNm: (raw.storeNm ?? raw.store_nm ?? null) as string | null,
    orderDt: (raw.orderDt ?? raw.order_dt ?? '') as string,
    registDt: (raw.registDt ?? raw.regist_dt ?? '') as string,
    orderProcessStatus: (raw.orderProcessStatus ?? raw.order_process_status ?? '') as string,
    holdDate: (raw.holdDate ?? raw.hold_date ?? null) as string | null,
    holdBy: (raw.holdBy ?? raw.hold_by ?? null) as string | null,
    holdReason: (raw.holdReason ?? raw.hold_reason ?? null) as string | null,
    deleteDate: (raw.deleteDate ?? raw.delete_date ?? raw.deletedAt ?? raw.deleted_at ?? null) as string | null,
    deleteBy: (raw.deleteBy ?? raw.delete_by ?? raw.deletedBy ?? raw.deleted_by ?? null) as string | null,
    deleteReason: (raw.deleteReason ?? raw.delete_reason ?? null) as string | null,
    salesTypeCd: (raw.salesTypeCd ?? raw.sales_type_cd ?? null) as string | null,
    orderTypeCd: (raw.orderTypeCd ?? raw.order_type_cd ?? null) as string | null,
    productCd: (raw.productCd ?? raw.product_cd ?? null) as string | null,
    productNm: (raw.productNm ?? raw.product_nm ?? null) as string | null,
    lineQty: Number(raw.lineQty ?? raw.line_qty ?? 0),
    lineAmount: Number(raw.lineAmount ?? raw.line_amount ?? 0),
    lineDiscountAmount: Number(raw.lineDiscountAmount ?? raw.line_discount_amount ?? 0),
    linePayload: (raw.linePayload ?? raw.line_payload ?? null) as string | null,
    receiverNm: (raw.receiverNm ?? raw.receiver_nm ?? null) as string | null,
    receiverTel: (raw.receiverTel ?? raw.receiver_tel ?? null) as string | null,
    receiverMobile: (raw.receiverMobile ?? raw.receiver_mobile ?? null) as string | null,
    receiverAddr: (raw.receiverAddr ?? raw.receiver_addr ?? null) as string | null,
    receiverAddr2: (raw.receiverAddr2 ?? raw.receiver_addr2 ?? null) as string | null,
    receiverZip: (raw.receiverZip ?? raw.receiver_zip ?? null) as string | null,
    invoiceNo: (raw.invoiceNo ?? raw.invoice_no ?? null) as string | null,
    shipInstructionAt: (raw.shipInstructionAt ?? raw.ship_instruction_at ?? null) as string | null,
    shipInstructionBy: (raw.shipInstructionBy ?? raw.ship_instruction_by ?? null) as string | null,
    shippedAt: (raw.shippedAt ?? raw.shipped_at ?? null) as string | null,
    deliveredAt: (raw.deliveredAt ?? raw.delivered_at ?? null) as string | null,
    createdAt: (raw.createdAt ?? raw.created_at ?? null) as string | null,
    createdBy: (raw.createdBy ?? raw.created_by ?? null) as string | null,
  };
}

export async function fetchOrderList(params: OrderListParams = {}) {
  const { searchTrigger: _skip, ...apiParams } = params;
  const { data } = await apiClient.get<PagedResponse<OrderListItem>>('/orders', { params: apiParams });
  if (!data.success || !data.data) throw new Error(data.message || '주문 목록 조회 실패');
  const d = data.data;
  return {
    ...d,
    items: (d.items ?? []).map((item) => normalizeOrderListItem(item as unknown as Record<string, unknown>)),
  };
}

/** 주문 전체 엑셀 다운로드. 페이지 크기와 무관하게 현재 필터 전체를 파일로 다운로드한다. */
export async function downloadOrderFullExport(params: OrderListParams, lang?: string): Promise<void> {
  const { searchTrigger: _skip, page: _page, size: _size, ...apiParams } = params;
  const langVal = lang && lang.trim() ? lang.trim() : 'ko';
  const { data } = await apiClient.get<Blob>('/orders/export-full', {
    params: { ...apiParams, lang: langVal },
    responseType: 'blob',
    headers: { 'X-Requested-Lang': langVal },
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  a.download = `orders_full_export_${yyyy}${mm}${dd}_${hh}${mi}${ss}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 주문 상태별 건수 (툴바 탭 표시용) */
export interface OrderCountsByStatus {
  total: number;
  counts: Record<string, number>;
  deletedCount?: number;
}

export async function fetchOrderCountsByStatus(params: {
  corporationCd: string;
  storeId?: number;
  salesTypeCd?: string;
  dateType?: string;
  orderDtFrom?: string;
  orderDtTo?: string;
}): Promise<OrderCountsByStatus> {
  const { data } = await apiClient.get<{ success: boolean; data?: OrderCountsByStatus }>(
    '/orders/counts-by-status',
    { params }
  );
  if (!data.success || data.data == null) throw new Error('주문 상태별 건수 조회 실패');
  const d = data.data;
  return {
    total: Number(d.total ?? 0),
    counts: (d.counts && typeof d.counts === 'object') ? d.counts as Record<string, number> : {},
    deletedCount: Number((d as { deletedCount?: number }).deletedCount ?? 0),
  };
}

/** 주문 상세 조회 (마스터 + 라인 + JSONB 문자열). corporationCd 필수, storeCd 선택. */
export async function fetchOrderDetail(
  orderId: number,
  registDt: string,
  corporationCd: string,
  storeCd?: string
): Promise<OrderDetailResponse> {
  const params: Record<string, string> = { registDt, corporationCd };
  if (storeCd != null && storeCd !== '') params.storeCd = storeCd;
  const { data } = await apiClient.get<{ success: boolean; data?: OrderDetailResponse; message?: string }>(
    `/orders/${orderId}`,
    { params }
  );
  if (!data.success || data.data == null) throw new Error(data.message || '주문 상세 조회 실패');
  return data.data;
}

/** 주문 상태 변경 이력(감사 로그) 조회. */
export async function fetchOrderStatusLog(
  orderId: number,
  registDt: string,
  corporationCd: string,
  storeCd?: string
): Promise<OrderStatusLogItem[]> {
  const params: Record<string, string> = { registDt, corporationCd };
  if (storeCd != null && storeCd !== '') params.storeCd = storeCd;
  const { data } = await apiClient.get<{ success: boolean; data?: OrderStatusLogItem[] }>(
    `/orders/${orderId}/status-log`,
    { params }
  );
  if (!data.success) throw new Error((data as { message?: string }).message || '상태 이력 조회 실패');
  return Array.isArray(data.data) ? data.data : [];
}

/** 주문 수정 (마스터 + 라인 + JSONB) */
export async function updateOrder(
  orderId: number,
  request: OrderUpdateRequest
): Promise<void> {
  const { data } = await apiClient.put<{ success: boolean; message?: string }>(`/orders/${orderId}`, request);
  if (!data.success) throw new Error(data.message || '주문 수정 실패');
}

/** 일괄 처리 요청용 (orderId + registDt, 출고보류/보류해제) */
export interface OrderBulkItem {
  orderId: number;
  registDt: string;
}

/** 일괄 삭제 요청용 (라인 단위: orderId + registDt + lineNo) */
export interface OrderBulkItemItem {
  orderId: number;
  registDt: string;
  lineNo: number;
}

/** 일괄 단계 이동/보류 등 처리 결과: 실제 처리된 주문 건수·라인 수 */
export interface OrderBulkCountResult {
  orderCount: number;
  lineCount: number;
}

export async function bulkHoldOrders(corporationCd: string, items: OrderBulkItem[], storeCd?: string): Promise<OrderBulkCountResult> {
  const body: { corporationCd: string; storeCd?: string; items: OrderBulkItem[] } = { corporationCd, items };
  if (storeCd != null && storeCd !== '') body.storeCd = storeCd;
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkCountResult }>('/orders/bulk-hold', body);
  if (!data.success) throw new Error((data as { message?: string }).message || '일괄 출고보류 실패');
  const raw = data.data;
  return { orderCount: raw?.orderCount ?? 0, lineCount: raw?.lineCount ?? 0 };
}

export async function bulkUnholdOrders(corporationCd: string, items: OrderBulkItem[], storeCd?: string): Promise<OrderBulkCountResult> {
  const body: { corporationCd: string; storeCd?: string; items: OrderBulkItem[] } = { corporationCd, items };
  if (storeCd != null && storeCd !== '') body.storeCd = storeCd;
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkCountResult }>('/orders/bulk-unhold', body);
  if (!data.success) throw new Error((data as { message?: string }).message || '일괄 보류 해제 실패');
  const raw = data.data;
  return { orderCount: raw?.orderCount ?? 0, lineCount: raw?.lineCount ?? 0 };
}

export async function bulkDeleteOrderItems(
  corporationCd: string,
  items: OrderBulkItemItem[],
  storeCd?: string
): Promise<number> {
  const body: { corporationCd: string; storeCd?: string; items: OrderBulkItemItem[] } = { corporationCd, items };
  if (storeCd != null && storeCd !== '') body.storeCd = storeCd;
  const { data } = await apiClient.post<{ success: boolean; data?: number }>('/orders/bulk-delete', body);
  if (!data.success) throw new Error((data as { message?: string }).message || '일괄 삭제 실패');
  return data.data ?? 0;
}

/** 주문서 처리 일괄 API 응답: 처리 건수, 제외 건수, 제외 건별 처리자. 표시용으로 processedByNm(사용자 이름) 사용. */
export interface OrderBulkProcessResult {
  processedCount: number;
  /** 실제 처리된 주문의 라인 수 (표시용) */
  processedLineCount?: number;
  skippedCount: number;
  skipped: { processedBy?: string; processedByNm?: string; processedAt?: string }[];
}

/** 선택 주문 일괄 주문서 처리 (PROCESSING + 합포장번호 부여). */
export async function bulkOrderProcess(
  corporationCd: string,
  items: OrderBulkItem[],
  storeCd?: string
): Promise<OrderBulkProcessResult> {
  const body: { corporationCd: string; storeCd?: string; items: OrderBulkItem[] } = { corporationCd, items };
  if (storeCd != null && storeCd !== '') body.storeCd = storeCd;
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkProcessResult }>('/orders/bulk-order-process', body);
  if (!data.success) throw new Error((data as { message?: string }).message || '주문서 처리 실패');
  const result = data.data;
  return result ?? { processedCount: 0, processedLineCount: 0, skippedCount: 0, skipped: [] };
}

/** 필터 조건에 맞는 발주(접수) 주문 전체 일괄 주문서 처리. 날짜범위·검색조건·검색어 적용. */
export interface OrderBulkProcessByFilterParams {
  corporationCd: string;
  storeId?: number;
  salesTypeCd?: string;
  dateType?: string;
  orderDtFrom?: string;
  orderDtTo?: string;
  searchColumn?: string;
  searchKeyword?: string;
}

export async function bulkOrderProcessByFilter(params: OrderBulkProcessByFilterParams): Promise<OrderBulkProcessResult> {
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkProcessResult }>(
    '/orders/bulk-order-process-by-filter',
    params
  );
  if (!data.success) throw new Error((data as { message?: string }).message || '일괄 주문서 처리 실패');
  const result = data.data;
  return result ?? { processedCount: 0, processedLineCount: 0, skippedCount: 0, skipped: [] };
}

/** 선택 주문 이전단계 처리 (ORDER_RECEIVED + combined_ship_no NULL). */
export async function bulkOrderReceivedProcess(
  corporationCd: string,
  items: OrderBulkItem[],
  storeCd?: string
): Promise<OrderBulkCountResult> {
  const body: { corporationCd: string; storeCd?: string; items: OrderBulkItem[] } = { corporationCd, items };
  if (storeCd != null && storeCd !== '') body.storeCd = storeCd;
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkCountResult }>('/orders/bulk-order-received-process', body);
  if (!data.success) throw new Error((data as { message?: string }).message || '이전단계 처리 실패');
  const raw = data.data;
  return { orderCount: raw?.orderCount ?? 0, lineCount: raw?.lineCount ?? 0 };
}

/** 필터 조건에 맞는 합포장 처리 주문 전체 이전단계 처리. */
export async function bulkOrderReceivedProcessByFilter(params: OrderBulkProcessByFilterParams): Promise<OrderBulkCountResult> {
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkCountResult }>(
    '/orders/bulk-order-received-process-by-filter',
    params
  );
  if (!data.success) throw new Error((data as { message?: string }).message || '일괄 이전단계 처리 실패');
  const raw = data.data;
  return { orderCount: raw?.orderCount ?? 0, lineCount: raw?.lineCount ?? 0 };
}

/** 수기 주문 등록. order_info.registrationType = MANUAL. */
export async function createManualOrder(request: ManualOrderCreateRequest): Promise<ManualOrderCreateResponse> {
  const { data } = await apiClient.post<{ success: boolean; data?: ManualOrderCreateResponse; message?: string }>(
    '/orders/manual',
    request
  );
  if (!data.success) throw new Error(data.message || '수기 주문 등록 실패');
  if (data.data == null) throw new Error('수기 주문 등록 응답 없음');
  return data.data;
}

/** 주문 엑셀 일괄등록 결과 */
export interface OrderBulkImportResult {
  successOrderCount: number;
  failOrderCount: number;
  successLineCount: number;
  errors?: string[];
}

/** 주문 엑셀 일괄등록. multipart: file, corporationCd(필수), salesTypeCd(선택, 선택 메뉴의 판매유형). */
export async function bulkImportOrders(
  file: File,
  corporationCd: string,
  salesTypeCd?: string,
): Promise<OrderBulkImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('corporationCd', corporationCd);
  if (salesTypeCd != null && salesTypeCd !== '') formData.append('salesTypeCd', salesTypeCd);
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkImportResult; message?: string }>(
    '/orders/bulk-import',
    formData,
    { timeout: 120000 }
  );
  if (!data.success) throw new Error(data.message || '주문 일괄등록 실패');
  if (data.data == null) return { successOrderCount: 0, failOrderCount: 0, successLineCount: 0, errors: [] };
  return data.data;
}

/** 선택 합포장 처리 주문 다음단계 처리 (SHIP_READY). */
export async function bulkShipOrderProcess(
  corporationCd: string,
  items: OrderBulkItem[],
  storeCd?: string
): Promise<OrderBulkCountResult> {
  const body: { corporationCd: string; storeCd?: string; items: OrderBulkItem[] } = { corporationCd, items };
  if (storeCd != null && storeCd !== '') body.storeCd = storeCd;
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkCountResult }>('/orders/bulk-ship-order-process', body);
  if (!data.success) throw new Error((data as { message?: string }).message || '출고주문 처리 실패');
  const raw = data.data;
  return { orderCount: raw?.orderCount ?? 0, lineCount: raw?.lineCount ?? 0 };
}

/** 필터 조건에 맞는 합포장 처리 주문 전체 다음단계 처리 (SHIP_READY). */
export async function bulkShipOrderProcessByFilter(params: OrderBulkProcessByFilterParams): Promise<OrderBulkCountResult> {
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkCountResult }>(
    '/orders/bulk-ship-order-process-by-filter',
    params
  );
  if (!data.success) throw new Error((data as { message?: string }).message || '일괄 출고주문 처리 실패');
  const raw = data.data;
  return { orderCount: raw?.orderCount ?? 0, lineCount: raw?.lineCount ?? 0 };
}

/** 선택 출고준비 주문을 합포장처리(PROCESSING) 단계로 이동. */
export async function bulkProcessingProcess(
  corporationCd: string,
  items: OrderBulkItem[],
  storeCd?: string
): Promise<OrderBulkCountResult> {
  const body: { corporationCd: string; storeCd?: string; items: OrderBulkItem[] } = { corporationCd, items };
  if (storeCd != null && storeCd !== '') body.storeCd = storeCd;
  const { data } = await apiClient.post<{ success: boolean; data?: OrderBulkCountResult }>('/orders/bulk-processing-process', body);
  if (!data.success) throw new Error((data as { message?: string }).message || '합포장처리 이동 실패');
  const raw = data.data;
  return { orderCount: raw?.orderCount ?? 0, lineCount: raw?.lineCount ?? 0 };
}
