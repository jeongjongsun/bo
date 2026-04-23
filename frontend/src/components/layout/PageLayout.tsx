import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiRefreshCw } from 'react-icons/fi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { getBoAppRouteDef, normalizeBoPathname } from '@/config/boAppRoutes';
import { useTabPanePath } from '@/components/layout/TabPanePathContext';
import { useAuthMe } from '@/hooks/useAuthMe';
import { readBoAllowedMenuIdsFromSession } from '@/utils/boAllowedMenuStorage';
import { addMenuFavorite, removeMenuFavorite } from '@/api/menuFavorites';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { showError } from '@/utils/swal';

export interface PageLayoutProps {
  /** 페이지 제목. 공통 스타일: h2.mb-4.mt-2.lh-sm */
  title: ReactNode;
  /**
   * false면 제목 줄 오른쪽의 공통 새로고침 버튼을 숨김 (기본 true).
   * 새로고침은 전역 쿼리 invalidate이며, 화면 전용 초기화(예: 검색 전체)와는 별개.
   */
  showHeaderRefresh?: boolean;
  /** 제목 오른쪽 액션(버튼 등). 있으면 제목과 한 줄에 표시 */
  actions?: ReactNode;
  /** 제목 아래 부가 설명. 공통 스타일: text-body-tertiary lead mb-4 */
  lead?: ReactNode;
  /** 본문. 없으면 제목·리드만 표시(로딩/에러 등) */
  children?: ReactNode;
  /** 루트 div에 붙을 추가 클래스 */
  className?: string;
}

/**
 * 모든 페이지에서 타이틀·리드·본문 영역을 theme(theme.min.css) 기준으로 통일하기 위한 레이아웃.
 * - 제목과 같은 줄 오른쪽: actions(선택) + 새로고침 버튼(기본 표시, `showHeaderRefresh={false}`로 숨김).
 *   새로고침은 `invalidateQueries()`로 앱 전역 활성 쿼리를 무효화·재조회함.
 * - 제목: h2.mb-4.mt-2.lh-sm
 * - 부가설명: p.text-body-tertiary.lead.mb-4
 */
export function PageLayout({
  title,
  showHeaderRefresh = true,
  actions,
  lead,
  children,
  className = '',
}: PageLayoutProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className={className ? `page-layout ${className}` : 'page-layout'}>
      <div className="page-layout__header d-flex align-items-center justify-content-between gap-3 mb-4 mt-2 flex-wrap">
        <div className="page-layout__title-wrap d-flex align-items-center gap-2 flex-wrap">
          <h2 className="page-layout__title mb-0 lh-sm">{title}</h2>
          <PageLayoutFavoriteStar locationPathname={location.pathname} />
        </div>
        <div className="page-layout__header-right d-flex align-items-center gap-1">
          {actions != null && <div className="page-layout__actions">{actions}</div>}
          {showHeaderRefresh && (
            <button
              type="button"
              className="btn btn-phoenix-primary btn-sm page-layout__refresh-btn"
              onClick={handleRefresh}
              title={t('common.refresh')}
              aria-label={t('common.refresh')}
            >
              <FiRefreshCw size={14} />
              <span>{t('common.refresh')}</span>
            </button>
          )}
        </div>
      </div>
      {lead != null && <p className="text-body-tertiary lead mb-4">{lead}</p>}
      {children}
    </div>
  );
}

const FAVORITES_MAX = 5;
const HOME_MENU_ID = 'home';

function PageLayoutFavoriteStar({ locationPathname }: { locationPathname: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: authMe } = useAuthMe();
  const tabPanePath = useTabPanePath();
  const rawPath = tabPanePath ?? locationPathname;
  const base = normalizeBoPathname(rawPath.split('?')[0] || '/');
  const def = getBoAppRouteDef(base);
  const menuId = def?.menuId ?? null;
  if (menuId == null || menuId === HOME_MENU_ID) {
    return null;
  }

  const fromApi = authMe?.allowedMenuIds;
  const fromSession = readBoAllowedMenuIdsFromSession();
  const allowed = fromApi ?? fromSession;
  if (allowed != null && !allowed.includes(menuId)) {
    return null;
  }

  const favs = authMe?.favoriteMenuIds ?? [];
  const isFav = favs.includes(menuId);

  const addMut = useMutation({
    mutationFn: () => addMenuFavorite(menuId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
    onError: async (e: unknown) => {
      await showError(t('common.error'), getApiErrorMessage(e, t('favorites.toggleError'), t));
    },
  });

  const removeMut = useMutation({
    mutationFn: () => removeMenuFavorite(menuId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
    onError: async (e: unknown) => {
      await showError(t('common.error'), getApiErrorMessage(e, t('favorites.toggleError'), t));
    },
  });

  const busy = addMut.isPending || removeMut.isPending;

  const toggle = () => {
    if (busy) return;
    if (isFav) {
      removeMut.mutate();
      return;
    }
    if (favs.length >= FAVORITES_MAX) {
      void showError(t('common.error'), t('favorites.limit'));
      return;
    }
    addMut.mutate();
  };

  return (
    <button
      type="button"
      className={`btn btn-link p-0 page-layout__favorite-btn ${isFav ? 'page-layout__favorite-btn--on' : ''}`}
      onClick={toggle}
      disabled={busy}
      title={isFav ? t('favorites.removeTitle') : t('favorites.addTitle')}
      aria-label={isFav ? t('favorites.removeTitle') : t('favorites.addTitle')}
      aria-pressed={isFav}
    >
      {isFav ? <AiFillStar size={22} /> : <AiOutlineStar size={22} />}
    </button>
  );
}
