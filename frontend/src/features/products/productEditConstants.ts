/**
 * 상품 편집 폼 공통 상수·타입 (ProductEditPage / ProductEditModal)
 */
import type { ProductUnit, ProductSetComponent } from './types';

/** DDL(om_product_m) NOT NULL 컬럼 중 편집 폼에 노출되는 필수 입력 항목 */
export const REQUIRED_FIELDS_BASIC = ['productCd', 'productNm', 'productType'] as const;

export function isRequired(fieldName: string): boolean {
  return (REQUIRED_FIELDS_BASIC as readonly string[]).includes(fieldName);
}

export type SectionKey = 'basic' | 'info' | 'units' | 'setComponents';

export type ProductDetailLike = {
  productId: string;
  corporationCd: string;
  productCd: string;
  productNm: string;
  productType: string;
  baseUnitCd: string | null;
  isSale: boolean;
  isDisplay: boolean;
  units?: ProductUnit[];
  setComponents?: ProductSetComponent[];
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
};

export const EMPTY_PRODUCT: ProductDetailLike = {
  productId: '',
  corporationCd: '',
  productCd: '',
  productNm: '',
  productType: 'SINGLE',
  baseUnitCd: null,
  isSale: true,
  isDisplay: true,
  units: [],
  setComponents: [],
};
