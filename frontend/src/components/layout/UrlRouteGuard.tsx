import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBoAppRouteDef, isBoRouteMenuAllowed, normalizeBoPathname } from '@/config/boAppRoutes';
import { getPageComponent } from '@/pages/pageRegistry';
import { useAuthMe } from '@/hooks/useAuthMe';
import { DASHBOARD_TAB_ID, useTabStore } from '@/store/useTabStore';
import { readBoAllowedMenuIdsFromSession } from '@/utils/boAllowedMenuStorage';
import { showError } from '@/utils/swal';

/**
 * 브라우저 주소(URL)로 진입 시 탭을 열고, 허용된 BO 메뉴가 아니면 대시보드로 보냄.
 * Sidebar는 URL을 바꾸지 않으므로, 직접 주소 입력·북마크·외부 링크 위주로 동작.
 */
export function UrlRouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: authMe } = useAuthMe();
  const { openTab, setActiveTab } = useTabStore();

  useEffect(() => {
    const base = normalizeBoPathname(location.pathname);
    const pathWithQuery = base + (location.search || '');

    if (base === '/') {
      setActiveTab(DASHBOARD_TAB_ID);
      return;
    }

    const Page = getPageComponent(base);
    if (!Page) {
      void showError(t('common.error'), t('auth.route_unknown'));
      navigate('/', { replace: true });
      return;
    }

    const def = getBoAppRouteDef(base);
    if (!def) {
      void showError(t('common.error'), t('auth.route_unknown'));
      navigate('/', { replace: true });
      return;
    }

    const fromApi = authMe?.allowedMenuIds;
    const fromSession = readBoAllowedMenuIdsFromSession();
    const rawIds = fromApi ?? fromSession;

    if (!isBoRouteMenuAllowed(def.menuId, rawIds ?? null)) {
      void showError(t('auth.forbidden'), t('auth.route_denied'));
      navigate('/', { replace: true });
      return;
    }

    openTab({
      id: def.tabId,
      title: t(def.titleKey),
      path: pathWithQuery,
    });
  }, [location.pathname, location.search, authMe?.allowedMenuIds, navigate, openTab, setActiveTab, t]);

  return null;
}
