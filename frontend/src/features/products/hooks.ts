import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  fetchProductList,
  fetchProductDetail,
  updateProduct,
  updateProductField,
  createProduct,
  bulkImportProducts,
  type BulkImportMode,
} from '@/api/products';
import { fetchUnitCodes } from '@/api/codes';
import type {
  ProductListParams,
  ProductFieldUpdateParams,
  ProductUpdateParams,
  ProductCreateParams,
} from './types';

/** 공통코드(단위 등)는 변경이 잦지 않으므로 1시간 동안 캐시해 API/DB 비용 절감 */
const CODE_LIST_STALE_MS = 60 * 60 * 1000; // 1시간

export function useUnitCodes() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
  return useQuery({
    queryKey: ['codes', 'PACK_UNIT', lang],
    queryFn: () => fetchUnitCodes(lang),
    staleTime: CODE_LIST_STALE_MS,
    gcTime: CODE_LIST_STALE_MS * 2, // 2시간 동안 미사용 시에도 캐시 유지
    placeholderData: (prev) => prev,
  });
}

export function useProductList(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ['products', 'list', params],
    queryFn: () => fetchProductList(params),
    enabled: !!params.corporationCd,
    placeholderData: (prev) => prev,
  });
}

export function useProductDetail(productId: string | null) {
  return useQuery({
    queryKey: ['products', 'detail', productId],
    queryFn: () => fetchProductDetail(productId!),
    enabled: !!productId,
  });
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ProductUpdateParams) => updateProduct(productId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', productId] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ProductCreateParams) => createProduct(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProductField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ProductFieldUpdateParams) => updateProductField(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      if (variables?.productId) {
        queryClient.invalidateQueries({ queryKey: ['products', 'detail', variables.productId] });
      }
    },
  });
}

export function useBulkImportProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      corporationCd,
      mode = 'full',
    }: {
      file: File;
      corporationCd: string;
      mode?: BulkImportMode;
    }) => bulkImportProducts(file, corporationCd, mode ?? 'full'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
