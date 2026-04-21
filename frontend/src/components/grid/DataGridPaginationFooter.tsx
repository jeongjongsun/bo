/**
 * 그리드 하단 페이징 푸터 공통 컴포넌트.
 * 주문(서버 페이징)·상품·쇼핑몰(클라이언트 페이징) 모두 동일한 푸터로 통일.
 */
import { useTranslation } from 'react-i18next';

const DEFAULT_PAGE_SIZE_OPTIONS = [50, 100, 500, 1000, 5000];

export interface DataGridPaginationFooterProps {
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange: (size: number) => void;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  first: boolean;
  last: boolean;
}

export function DataGridPaginationFooter({
  total,
  page,
  pageSize,
  loading = false,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  onFirst,
  onPrev,
  onNext,
  onLast,
  first,
  last,
}: DataGridPaginationFooterProps) {
  const { t } = useTranslation();
  const formatNumber = (value: number) => value.toLocaleString();
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 0;
  const rangeFrom = total === 0 ? 0 : page * pageSize + 1;
  const rangeTo = total === 0 ? 0 : Math.min((page + 1) * pageSize, total);

  const rangeLabel =
    total === 0
      ? t('grid.pagination.noData')
      : t('grid.pagination.rangeToOf', {
          from: formatNumber(rangeFrom),
          to: formatNumber(rangeTo),
          total: formatNumber(total),
        });
  const pageOfLabel =
    totalPages <= 0
      ? t('grid.pagination.pageOf', { page: '0', totalPages: '0' })
      : t('grid.pagination.pageOf', { page: String(page + 1), totalPages: String(totalPages) });

  return (
    <div className="data-grid-footer-inner">
      <div className="data-grid-footer-left">
        <label className="data-grid-footer-label" htmlFor="data-grid-page-size">
          {t('grid.pagination.pageSizeLabel')}
        </label>
        <select
          id="data-grid-page-size"
          className="form-select form-select-sm w-auto"
          aria-label={t('grid.pagination.pageSize')}
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="data-grid-footer-center">
        <span className="data-grid-footer-range">{rangeLabel}</span>
      </div>
      <div className="data-grid-footer-right">
        <button
          type="button"
          className="data-grid-footer-btn"
          onClick={onFirst}
          disabled={first || loading || total === 0}
          aria-label={t('grid.pagination.first')}
        >
          &laquo;
        </button>
        <button
          type="button"
          className="data-grid-footer-btn"
          onClick={onPrev}
          disabled={first || loading || total === 0}
          aria-label={t('grid.pagination.prev')}
        >
          &lsaquo;
        </button>
        <span className="data-grid-footer-page-of">{pageOfLabel}</span>
        <button
          type="button"
          className="data-grid-footer-btn"
          onClick={onNext}
          disabled={last || loading || total === 0}
          aria-label={t('grid.pagination.next')}
        >
          &rsaquo;
        </button>
        <button
          type="button"
          className="data-grid-footer-btn"
          onClick={onLast}
          disabled={last || loading || total === 0}
          aria-label={t('grid.pagination.last')}
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}
