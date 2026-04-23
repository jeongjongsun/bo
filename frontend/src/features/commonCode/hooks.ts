import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCodeGroups,
  updateCodeField,
  type CodeGridEditableField,
} from '@/api/codeManage';

export function useCodeManageGroups(keyword: string | undefined) {
  return useQuery({
    queryKey: ['codeManage', 'groups', keyword ?? ''],
    queryFn: () => fetchCodeGroups(keyword),
    staleTime: 30 * 1000,
  });
}

export function useUpdateCodeField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { mainCd: string; subCd: string; field: CodeGridEditableField; value: unknown }) =>
      updateCodeField(params),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['codeManage'] });
      void qc.invalidateQueries({ queryKey: ['codes'] });
    },
  });
}
