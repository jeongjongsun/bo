/** store_info JSONB 필드 (상점 수정/등록 공통). */
export interface StoreInfoLike {
  currency_cd?: string;
  gmt?: string;
  wms_yn?: string;
  store_type_cd?: string;
}

/** 쇼핑몰+상점 목록 한 행 (상점 단위). */
export interface MallStoreListItem {
  storeId: number;
  mallCd: string;
  mallNm: string;
  storeCd: string;
  storeNm: string;
  deliveryType: string | null;
  collectionType: string | null;
  salesTypeCd: string | null;
  isActive: boolean | null;
  /** 상점 부가정보 (목록 API store_info 반환). */
  storeInfo?: StoreInfoLike | null;
  createdAt: string | null;
  createdBy: string | null;
}

export interface MallListParams {
  keyword?: string;
  corporationCd?: string | null;
  page?: number;
  size?: number;
}
