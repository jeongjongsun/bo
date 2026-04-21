import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { FiRefreshCw } from 'react-icons/fi';

export interface PageLayoutProps {
  /** 페이지 제목. 공통 스타일: h2.mb-4.mt-2.lh-sm */
  title: ReactNode;
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
 * - 제목과 같은 줄 맨 오른쪽에 공통 새로고침 버튼 (전체 쿼리 invalidate 후 refetch)
 * - 제목: h2.mb-4.mt-2.lh-sm (actions 있으면 제목과 한 줄, 새로고침은 항상 맨 오른쪽)
 * - 부가설명: p.text-body-tertiary.lead.mb-4
 */
export function PageLayout({ title, actions, lead, children, className = '' }: PageLayoutProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className={className ? `page-layout ${className}` : 'page-layout'}>
      <div className="page-layout__header d-flex align-items-center justify-content-between gap-3 mb-4 mt-2 flex-wrap">
        <h2 className="mb-0 lh-sm">{title}</h2>
        <div className="page-layout__header-right d-flex align-items-center gap-1">
          {actions != null && <div className="page-layout__actions">{actions}</div>}
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
        </div>
      </div>
      {lead != null && <p className="text-body-tertiary lead mb-4">{lead}</p>}
      {children}
    </div>
  );
}
