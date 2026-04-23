import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMenu,
  deleteMenu,
  fetchMenuTree,
  updateMenu,
  type MenuCreateBody,
  type MenuUpdateBody,
} from '@/api/menuManage';

export function useMenuTree(systemSubCd: string) {
  return useQuery({
    queryKey: ['menuManage', 'tree', systemSubCd],
    queryFn: () => fetchMenuTree(systemSubCd),
    enabled: systemSubCd === 'OM' || systemSubCd === 'BO',
    staleTime: 15 * 1000,
  });
}

export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MenuCreateBody) => createMenu(body),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['menuManage', 'tree', variables.systemSubCd] });
    },
  });
}

export function useUpdateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { menuId: string; body: MenuUpdateBody; systemSubCd: string }) =>
      updateMenu(params.menuId, params.body),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['menuManage', 'tree', variables.systemSubCd] });
      void qc.invalidateQueries({ queryKey: ['menuManage', 'detail', variables.menuId] });
    },
  });
}

export function useDeleteMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { menuId: string; systemSubCd: string }) => deleteMenu(params.menuId),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['menuManage', 'tree', variables.systemSubCd] });
      void qc.invalidateQueries({ queryKey: ['menuManage', 'detail', variables.menuId] });
    },
  });
}
