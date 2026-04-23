/**
 * BO 브라우저 경로 ↔ 권한(om_menu_m.menu_id) ↔ 탭 id.
 * pageRegistry, Sidebar menu id, DB 시드와 일치해야 함.
 */
export interface BoAppRouteDef {
  /** pathname 기준 (쿼리 제외), 선행·후행 슬래시 정규화 전 입력 */
  path: string;
  /** 권한 검사용 menu_id; '/' 대시보드는 null */
  menuId: string | null;
  /** 탭 id (Sidebar child.id / 단일 메뉴는 group.id) */
  tabId: string;
  /** i18n 키 (title) */
  titleKey: string;
}

export const BO_APP_ROUTES: BoAppRouteDef[] = [
  { path: '/', menuId: null, tabId: 'home', titleKey: 'dashboard.title' },
  { path: '/basic/shipper', menuId: 'basic-shipper', tabId: 'basic-shipper', titleKey: 'shipper.title' },
  { path: '/basic/users', menuId: 'basic-users', tabId: 'basic-users', titleKey: 'users.title' },
  { path: '/system/common-code', menuId: 'system-common-code', tabId: 'system-common-code', titleKey: 'commonCode.title' },
  { path: '/system/menus', menuId: 'system-menus', tabId: 'system-menus', titleKey: 'menuManage.title' },
  { path: '/system/authorities', menuId: 'system-authorities', tabId: 'system-authorities', titleKey: 'authGroupManage.title' },
  { path: '/log/audit', menuId: 'log-audit', tabId: 'log-audit', titleKey: 'boPages.audit_log' },
  { path: '/log/error', menuId: 'log-error', tabId: 'log-error', titleKey: 'boPages.error_log' },
  { path: '/settings', menuId: 'settings', tabId: 'settings', titleKey: 'settings.title' },
];

const routeByPath = new Map<string, BoAppRouteDef>();
BO_APP_ROUTES.forEach((def) => {
  routeByPath.set(normalizeBoPathname(def.path), def);
});

export function normalizeBoPathname(pathname: string): string {
  let p = pathname || '/';
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

export function getBoAppRouteDef(pathnameOnly: string): BoAppRouteDef | undefined {
  return routeByPath.get(normalizeBoPathname(pathnameOnly));
}

/**
 * @param allowedMenuIds null → 제한 정보 없음(모든 등록 경로 허용). [] → 대시보드만.
 */
export function isBoRouteMenuAllowed(menuId: string | null, allowedMenuIds: string[] | null): boolean {
  if (menuId == null) {
    return true;
  }
  if (allowedMenuIds == null) {
    return true;
  }
  return allowedMenuIds.includes(menuId);
}
