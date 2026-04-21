/**
 * 상품 API (GET 목록/상세, PUT 수정/필드단건).
 * 상세 응답은 snake_case → camelCase 정규화 후 반환 (normalizeProductDetail).
 */
import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  ProductListItem,
  ProductListParams,
  ProductFieldUpdateParams,
  ProductDetail,
  ProductUpdateParams,
  ProductCreateParams,
} from '@/features/products/types';

export async function fetchProductList(params: ProductListParams = {}) {
  const { data } = await apiClient.get<ApiResponse<ProductListItem[]>>('/products', { params });
  if (!data.success || !data.data) throw new Error(data.message || '상품 목록 조회 실패');
  return data.data;
}

/** 백엔드 product_info/상세 응답 snake_case → 프론트 camelCase 매핑 */
const productDetailKeys: Record<string, string> = {
  product_en_nm: 'productEnNm',
  category_cd: 'categoryCd',
  brand_cd: 'brandCd',
  cost_price: 'costPrice',
  supply_price: 'supplyPrice',
  tax_type: 'taxType',
  safety_stock_qty: 'safetyStockQty',
  min_order_qty: 'minOrderQty',
  max_order_qty: 'maxOrderQty',
  sort_order: 'sortOrder',
  description: 'description',
  image_url: 'imageUrl',
  remark: 'remark',
};

/** OM_PRODUCT_UNIT 행을 프론트 ProductUnit 형태로 정규화 (snake_case → camelCase) */
function normalizeUnit(raw: Record<string, unknown>): {
  unitCd: string;
  barcode: string | null;
  packQty: number | null;
  isBaseUnit: boolean;
} {
  const unitCd = (raw.unit_cd ?? raw.unitCd) as string | undefined;
  const barcode = (raw.barcode ?? null) as string | null;
  const packQty = raw.pack_qty ?? raw.packQty;
  const isBaseUnit = raw.is_base_unit ?? raw.isBaseUnit ?? false;
  return {
    unitCd: unitCd ?? '',
    barcode: barcode ?? null,
    packQty: packQty != null ? Number(packQty) : null,
    isBaseUnit: Boolean(isBaseUnit),
  };
}

/** OM_PRODUCT_SET_COMPONENT 행을 프론트 ProductSetComponent 형태로 정규화 */
function normalizeSetComponent(raw: Record<string, unknown>): {
  componentProductId: string;
  componentQty: number;
} {
  const componentProductId = (raw.component_product_id ?? raw.componentProductId) as string | undefined;
  const componentQty = raw.component_qty ?? raw.componentQty ?? 1;
  return {
    componentProductId: componentProductId ?? '',
    componentQty: Number(componentQty),
  };
}

/** 상세 응답(raw)을 ProductDetail로 변환. product_info·units·setComponents 정규화 포함 */
function normalizeProductDetail(raw: Record<string, unknown>): ProductDetail {
  const out = { ...raw } as Record<string, unknown>;
  for (const [snake, camel] of Object.entries(productDetailKeys)) {
    if (snake in raw && raw[snake] !== undefined && !(camel in raw)) {
      out[camel] = raw[snake];
    }
  }
  if (out.units == null && (raw.units_json != null || raw.units != null)) {
    let src: unknown = raw.units;
    if (src == null && typeof raw.units_json === 'string') {
      try {
        src = JSON.parse(raw.units_json) as unknown;
      } catch {
        src = [];
      }
    } else if (src == null) {
      src = raw.units_json;
    }
    out.units = Array.isArray(src) ? src.map((u: Record<string, unknown>) => normalizeUnit(u)) : [];
  } else if (Array.isArray(out.units)) {
    out.units = (out.units as Record<string, unknown>[]).map((u) => normalizeUnit(u));
  }
  if (out.setComponents == null && (raw.set_components_json != null || raw.set_components != null)) {
    let src: unknown = raw.set_components ?? raw.setComponents;
    if (src == null && typeof raw.set_components_json === 'string') {
      try {
        src = JSON.parse(raw.set_components_json) as unknown;
      } catch {
        src = [];
      }
    } else if (src == null) {
      src = raw.set_components_json;
    }
    out.setComponents = Array.isArray(src) ? src.map((c: Record<string, unknown>) => normalizeSetComponent(c)) : [];
  } else if (Array.isArray(out.setComponents)) {
    out.setComponents = (out.setComponents as Record<string, unknown>[]).map((c) => normalizeSetComponent(c));
  }
  return out as ProductDetail;
}

export async function fetchProductDetail(productId: string) {
  const { data } = await apiClient.get<ApiResponse<ProductDetail>>(`/products/${productId}`);
  if (!data.success || !data.data) throw new Error(data.message || '상품 상세 조회 실패');
  return normalizeProductDetail(data.data as Record<string, unknown>);
}

export async function updateProduct(productId: string, params: ProductUpdateParams) {
  const { data } = await apiClient.put<ApiResponse<void>>(`/products/${productId}`, params);
  if (!data.success) throw new Error(data.message || '상품 수정 실패');
}

export async function createProduct(params: ProductCreateParams): Promise<ProductDetail> {
  const { data } = await apiClient.post<ApiResponse<ProductDetail>>('/products', params);
  if (!data.success || !data.data) throw new Error(data.message || '상품 등록 실패');
  return normalizeProductDetail(data.data as Record<string, unknown>);
}

export async function updateProductField(params: ProductFieldUpdateParams) {
  const { data } = await apiClient.put<ApiResponse<void>>('/products/field', params);
  if (!data.success) throw new Error(data.message || '상품 수정 실패');
}

/** 엑셀 일괄 등록 결과 */
export interface BulkImportResult {
  successCount: number;
  skippedCount?: number;
  skippedProductCodes?: string[];
  errorMessage?: string;
}

/** 엑셀 등록 모드: full=상품 일괄, unitsOnly=단위/바코드만, setOnly=세트 구성만 */
export type BulkImportMode = 'full' | 'unitsOnly' | 'setOnly';

export async function bulkImportProducts(
  file: File,
  corporationCd: string,
  mode: BulkImportMode = 'full',
): Promise<BulkImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('corporationCd', corporationCd);
  formData.append('mode', mode);
  const { data } = await apiClient.post<ApiResponse<BulkImportResult>>('/products/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.success || data.data == null) throw new Error(data.message || '엑셀 등록 실패');
  return data.data;
}

/** 엑셀 업로드 양식 다운로드. lang에 따라 헤더 한글/영문 (ko, en) */
export async function downloadImportTemplate(lang: string): Promise<void> {
  const params = lang ? { params: { lang } } : {};
  const { data } = await apiClient.get<Blob>('/products/import-template', {
    responseType: 'blob',
    ...params,
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'product_import_template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

/** OM_PRODUCT_M 전체 컬럼 엑셀 다운로드. 법인별 전체 상품, 헤더는 lang(ko/en) 적용 */
export async function downloadFullExport(corporationCd: string, lang?: string): Promise<void> {
  const langVal = lang && lang.trim() ? lang.trim() : 'en';
  const params = { corporationCd, lang: langVal };
  const { data } = await apiClient.get<Blob>('/products/export-full', {
    params,
    responseType: 'blob',
    headers: { 'X-Requested-Lang': langVal },
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products_full_export.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
