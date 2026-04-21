import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCorporationManageList,
  fetchCorporationDetail,
  updateCorporationField,
  updateCorporationDetail,
  registerCorporation,
  type CorporationManageListParams,
  type CorporationDetailUpdateBody,
  type CorporationRegisterBody,
  type CorporationGridEditableField,
} from '@/api/corporationsManage';

export function useCorporationManageList(params: CorporationManageListParams) {
  return useQuery({
    queryKey: ['corporations', 'manage', params.keyword ?? '', params.page ?? 0, params.size ?? 100],
    queryFn: () => fetchCorporationManageList(params),
    placeholderData: (prev) => prev,
  });
}

export function useCorporationDetail(corporationCd: string | null) {
  return useQuery({
    queryKey: ['corporations', 'detail', corporationCd],
    queryFn: () => fetchCorporationDetail(corporationCd!),
    enabled: !!corporationCd,
  });
}

export function useUpdateCorporationField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (p: { corporationCd: string; field: CorporationGridEditableField; value: unknown }) =>
      updateCorporationField(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporations', 'manage'] });
      queryClient.invalidateQueries({ queryKey: ['corporations', 'list'] });
    },
  });
}

export function useUpdateCorporationDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CorporationDetailUpdateBody) => updateCorporationDetail(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporations', 'manage'] });
      queryClient.invalidateQueries({ queryKey: ['corporations', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['corporations', 'detail'] });
    },
  });
}

export function useRegisterCorporation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CorporationRegisterBody) => registerCorporation(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporations', 'manage'] });
      queryClient.invalidateQueries({ queryKey: ['corporations', 'list'] });
    },
  });
}
