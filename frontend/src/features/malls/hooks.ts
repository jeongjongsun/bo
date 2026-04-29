import { useQuery } from '@tanstack/react-query';
import { fetchMallManageList, type MallManageListParams } from '@/api/mallsManage';

export function useMallManageList(params: MallManageListParams) {
  return useQuery({
    queryKey: ['malls', 'manage', params.keyword ?? '', params.page ?? 0, params.size ?? 100],
    queryFn: () => fetchMallManageList(params),
    placeholderData: (prev) => prev,
  });
}
