import { useMemo } from 'react';
import { useAuthMe } from './useAuthMe';
import { getBoAppRouteDef, normalizeBoPathname } from '@/config/boAppRoutes';

export function useHasActionPermission(permissionCode: string): boolean {
  const { data } = useAuthMe();
  const permissions = data?.permissions ?? [];

  return useMemo(() => {
    if (!permissionCode) return false;
    return permissions.includes(permissionCode);
  }, [permissionCode, permissions]);
}

function menuIdToResource(menuId: string): string {
  if (menuId === 'basic-users') return 'user';
  return menuId.replace(/-/g, '_');
}

export function toMenuActionPermissionCode(menuId: string | null, action: string): string | null {
  if (!menuId) return null;
  if (!action) return null;
  return `${menuIdToResource(menuId)}:${action}`;
}

export function useHasMenuActionPermissionByPath(pathname: string, action: string): boolean {
  const normalized = normalizeBoPathname(pathname);
  const def = getBoAppRouteDef(normalized);
  const code = toMenuActionPermissionCode(def?.menuId ?? null, action);
  return useHasActionPermission(code ?? '');
}

export function useHasMenuActionPermissionByMenuId(menuId: string | null, action: string): boolean {
  const code = toMenuActionPermissionCode(menuId, action);
  return useHasActionPermission(code ?? '');
}
