import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAuthGroup,
  deleteAuthGroup,
  fetchAuthGroupManageList,
  fetchAuthGroupMenuAudits,
  fetchAuthGroupMenuConfig,
  saveAuthGroupMenus,
  updateAuthGroup,
  type AuthGroupCreateBody,
  type AuthGroupMenuSaveBody,
  type AuthGroupUpdateBody,
} from '@/api/authGroupManage';

export function useAuthGroupManageList() {
  return useQuery({
    queryKey: ['authGroups', 'manage', 'list'],
    queryFn: () => fetchAuthGroupManageList(),
  });
}

export function useCreateAuthGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AuthGroupCreateBody) => createAuthGroup(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['authGroups', 'manage', 'list'] });
      void qc.invalidateQueries({ queryKey: ['auth-groups', 'options'] });
    },
  });
}

export function useAuthGroupMenuConfig(
  authGroupCd: string | null,
  systemSubCd: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['authGroups', 'manage', 'menus', authGroupCd ?? '', systemSubCd],
    queryFn: () => fetchAuthGroupMenuConfig(authGroupCd!, systemSubCd),
    enabled: enabled && !!authGroupCd,
  });
}

export function useSaveAuthGroupMenus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { authGroupCd: string; body: AuthGroupMenuSaveBody }) =>
      saveAuthGroupMenus(params.authGroupCd, params.body),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['authGroups', 'manage', 'menus', variables.authGroupCd] });
      void qc.invalidateQueries({ queryKey: ['authGroups', 'manage', 'audits', variables.authGroupCd] });
    },
  });
}

export function useDeleteAuthGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authGroupCd: string) => deleteAuthGroup(authGroupCd),
    onSuccess: (_data, authGroupCd) => {
      void qc.invalidateQueries({ queryKey: ['authGroups', 'manage', 'list'] });
      void qc.invalidateQueries({ queryKey: ['authGroups', 'manage', 'menus', authGroupCd] });
      void qc.invalidateQueries({ queryKey: ['authGroups', 'manage', 'audits', authGroupCd] });
    },
  });
}

export function useUpdateAuthGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { authGroupCd: string; body: AuthGroupUpdateBody }) =>
      updateAuthGroup(params.authGroupCd, params.body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['authGroups', 'manage', 'list'] });
    },
  });
}

export function useAuthGroupMenuAudits(authGroupCd: string | null, page: number, size: number, enabled: boolean) {
  return useQuery({
    queryKey: ['authGroups', 'manage', 'audits', authGroupCd ?? '', page, size],
    queryFn: () => fetchAuthGroupMenuAudits(authGroupCd!, page, size),
    enabled: enabled && !!authGroupCd,
    placeholderData: (prev) => prev,
  });
}
