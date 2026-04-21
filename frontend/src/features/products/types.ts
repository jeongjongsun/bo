export interface ProductListItem {
  rowNum: number;
  productId: string;
  productCd: string;
  productNm: string;
  productType: string;
  baseUnitCd: string | null;
  isSale: boolean;
  isDisplay: boolean;
  createdBy: string | null;
  createdAt: string | null;
}

export interface ProductListParams {
  corporationCd?: string;
}

export interface ProductFieldUpdateParams {
  productId: string;
  field: string;
  value: unknown;
}

export interface ProductUnit {
  unitCd: string;
  barcode?: string | null;
  packQty?: number | null;
  isBaseUnit: boolean;
}

export interface ProductSetComponent {
  componentProductId: string;
  componentQty: number;
}

export interface ProductDetail {
  productId: string;
  corporationCd: string;
  productCd: string;
  productNm: string;
  productType: string;
  baseUnitCd: string | null;
  isSale: boolean;
  isDisplay: boolean;
  /** product_info JSONB */
  productEnNm?: string | null;
  categoryCd?: string | null;
  brandCd?: string | null;
  costPrice?: number | null;
  supplyPrice?: number | null;
  taxType?: string | null;
  safetyStockQty?: number | null;
  minOrderQty?: number | null;
  maxOrderQty?: number | null;
  sortOrder?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  remark?: string | null;
  units?: ProductUnit[];
  setComponents?: ProductSetComponent[];
}

export interface ProductUpdateParams {
  productCd?: string;
  productNm?: string;
  productType?: string;
  baseUnitCd?: string | null;
  isSale?: boolean;
  isDisplay?: boolean;
  /** product_info JSONB */
  productEnNm?: string | null;
  categoryCd?: string | null;
  brandCd?: string | null;
  costPrice?: number | null;
  supplyPrice?: number | null;
  taxType?: string | null;
  safetyStockQty?: number | null;
  minOrderQty?: number | null;
  maxOrderQty?: number | null;
  sortOrder?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  remark?: string | null;
  units?: ProductUnit[];
  setComponents?: ProductSetComponent[];
}

/** 상품 등록 요청 (수정 파라미터 + corporationCd 필수) */
export interface ProductCreateParams extends ProductUpdateParams {
  corporationCd: string;
}
