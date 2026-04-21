/**
 * 주문 목록·상세 타입. docs/menu/주문관리.md, om_order_m(라인 단위).
 */

export interface OrderListItem {
  /** 그리드 순번 컬럼용(API 미포함, valueGetter로 계산) */
  rowNum?: number;
  orderId: number;
  lineNo: number;
  orderNo: string;
  itemOrderNo: string | null;
  combinedShipNo: string | null;
  mallCd: string;
  mallNm: string | null;
  storeCd: string;
  storeNm: string | null;
  orderDt: string;
  registDt: string;
  orderProcessStatus: string;
  holdDate: string | null;
  holdBy: string | null;
  holdReason: string | null;
  deleteDate: string | null;
  deleteBy: string | null;
  deleteReason: string | null;
  salesTypeCd: string | null;
  orderTypeCd: string | null;
  productCd: string | null;
  productNm: string | null;
  lineQty: number;
  lineAmount: number;
  lineDiscountAmount: number;
  /** 라인별 확장(옵션·사은품 등). line_payload JSON 문자열 */
  linePayload?: string | null;
  receiverNm: string | null;
  receiverTel: string | null;
  receiverMobile: string | null;
  receiverAddr: string | null;
  receiverAddr2: string | null;
  receiverZip: string | null;
  invoiceNo: string | null;
  shipInstructionAt: string | null;
  shipInstructionBy: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
  createdBy: string | null;
}

/** 날짜 필터 기준: ORDER_DT=주문일, REGIST_DT=등록일 */
export type OrderDateType = 'ORDER_DT' | 'REGIST_DT';

export interface OrderListParams {
  corporationCd?: string;
  storeId?: number;
  /** 판매구분: B2C_DOMESTIC, B2C_OVERSEAS, B2B_DOMESTIC, B2B_OVERSEAS, ETC (메뉴별 그리드 필터) */
  salesTypeCd?: string;
  orderProcessStatus?: string;
  dateType?: OrderDateType;
  orderDtFrom?: string;
  orderDtTo?: string;
  /** true면 is_deleted=true 주문만 조회 (삭제주문 탭) */
  showDeletedOnly?: boolean;
  /** 검색 컬럼: ORDER_NO_CONTAINS, ITEM_ORDER_NO_EXACT, COMBINED_SHIP_NO_EXACT, PRODUCT_CD_EXACT, PRODUCT_NM_CONTAINS, ORDERER_NM_CONTAINS, RECEIVER_NM_CONTAINS, ORDER_ID_EXACT */
  searchColumn?: string;
  /** 검색어 (검색 컬럼 선택 시 사용) */
  searchKeyword?: string;
  /** 검색 버튼 클릭 시만 증가 (queryKey 변경용, API 전송 제외) */
  searchTrigger?: number;
  page?: number;
  size?: number;
  /** true면 간편 보기: 최소 필드만 응답(로딩·응답 용량 절감) */
  minimalColumns?: boolean;
}

/** 주문 마스터 상세. 수령인/주문자/메모 등은 order_info JSONB에서 flat으로 주고받음. */
export interface OrderMasterDetail {
  orderId: number;
  registDt: string;
  corporationCd?: string;
  mallCd?: string;
  storeCd?: string;
  orderDt?: string;
  orderNo?: string;
  combinedShipNo?: string | null;
  salesTypeCd?: string | null;
  orderProcessStatus?: string;
  orderTypeCd?: string | null;
  receiverNm?: string | null;
  receiverTel?: string | null;
  receiverMobile?: string | null;
  receiverAddr?: string | null;
  receiverAddr2?: string | null;
  receiverZip?: string | null;
  ordererNm?: string | null;
  ordererUserId?: string | null;
  ordererTel?: string | null;
  ordererMobile?: string | null;
  memo?: string | null;
  /** 배송비 (order_info.deliveryFee) */
  deliveryFee?: number | null;
  /** 결제방법 코드 (order_info.paymentMethodCd) */
  paymentMethodCd?: string | null;
  orderInfo?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

/** 주문 라인 상세 (line_payload = JSON 문자열) */
export interface OrderItemDetail {
  orderId?: number;
  registDt?: string;
  lineNo: number;
  itemOrderNo?: string | null;
  productCd?: string | null;
  productNm?: string | null;
  lineQty: number;
  lineAmount: number;
  lineDiscountAmount: number;
  linePayload?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface OrderDetailResponse {
  master: OrderMasterDetail;
  items: OrderItemDetail[];
}

export interface OrderUpdateRequest {
  registDt: string;
  master: OrderMasterDetail;
  items: OrderItemDetail[];
}

/** 수기 주문 등록 요청 (POST /orders/manual). */
export interface ManualOrderCreateRequest {
  corporationCd: string;
  mallCd: string;
  storeCd: string;
  salesTypeCd?: string;
  orderDt?: string;
  registDt?: string;
  receiverNm?: string | null;
  receiverTel?: string | null;
  receiverMobile?: string | null;
  receiverAddr?: string | null;
  receiverAddr2?: string | null;
  receiverZip?: string | null;
  ordererNm?: string | null;
  ordererTel?: string | null;
  ordererMobile?: string | null;
  memo?: string | null;
  /** 배송비 (order_info.deliveryFee) */
  deliveryFee?: number | null;
  /** 결제방법 코드 (order_info.paymentMethodCd, PAYMENT_METHOD) */
  paymentMethodCd?: string | null;
  items: ManualOrderLineItem[];
}

export interface ManualOrderLineItem {
  /** React key·라인 식별용 (API 전송 제외, 모달 내 생성 시 부여) */
  id?: string;
  /** 상품 PK (API와 동일한 문자열 유지로 select value 매칭) */
  productId?: string | number | null;
  productCd?: string | null;
  productNm?: string | null;
  lineQty?: number;
  lineAmount?: number;
  lineDiscountAmount?: number;
}

/** 수기 주문 등록 응답. */
export interface ManualOrderCreateResponse {
  orderId: number;
  registDt: string;
  orderNo: string;
  items: { lineNo: number; itemOrderNo: string }[];
}

/** 주문 상태 변경 이력(감사 로그) 1건. om_order_status_log. */
export interface OrderStatusLogItem {
  id: number;
  orderId: number;
  registDt: string;
  statusKind: string;
  statusValue: string;
  statusDt: string;
  statusBy: string | null;
  /** 처리자 이름 (API에서 JOIN 조회) */
  statusByNm?: string | null;
  createdAt: string;
}
