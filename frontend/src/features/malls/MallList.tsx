import { useCallback, useMemo, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { FiFilter, FiRotateCcw, FiSearch } from 'react-icons/fi';
import { DataGrid, DataGridPaginationFooter } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import type { MallManageRow } from '@/api/mallsManage';
import { useMallManageList } from './hooks';

export function MallList() {
  const { t } = useTranslation();
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  const { data, isLoading } = useMallManageList({
    keyword: appliedKeyword || undefined,
    page,
    size: pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const first = data?.first ?? page === 0;
  const last = data?.last ?? true;

  const applySearch = useCallback(() => {
    setAppliedKeyword(keywordInput.trim());
    setPage(0);
  }, [keywordInput]);

  const showAll = useCallback(() => {
    setKeywordInput('');
    setAppliedKeyword('');
    setPage(0);
  }, []);

  const columnDefs = useMemo<ColDef<MallManageRow>[]>(
    () => [
      {
        colId: 'rowNum',
        headerName: t('malls.col.rowNum'),
        width: 72,
        pinned: 'left',
        sortable: false,
        filter: false,
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) => {
          const displayed = params.api?.getDisplayedRowCount?.() ?? 0;
          const idx = params.node?.rowIndex ?? 0;
          return total > 0 && displayed > 0 ? total - page * pageSize - idx : undefined;
        },
        valueFormatter: (params) =>
          params.value != null ? Number(params.value).toLocaleString() : '',
      },
      {
        field: 'mallCd',
        headerName: t('malls.col.mallCd'),
        width: 130,
        pinned: 'left',
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'mallNm',
        headerName: t('malls.col.mallNm'),
        flex: 1,
        minWidth: 140,
        sortable: false,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'mallUrl',
        headerName: t('malls.col.mallUrl'),
        minWidth: 180,
        flex: 1,
        sortable: false,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'apiConnectionInfoJson',
        headerName: t('malls.col.apiConnectionInfo'),
        minWidth: 220,
        flex: 1,
        sortable: false,
        cellStyle: { textAlign: 'left' },
        tooltipField: 'apiConnectionInfoJson',
      },
      {
        field: 'salesTypeCd',
        headerName: t('malls.col.salesTypeCd'),
        width: 140,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'isActive',
        headerName: t('malls.col.isActive'),
        width: 88,
        sortable: false,
        cellStyle: { textAlign: 'center' },
        valueFormatter: (params) =>
          params.value === true ? t('common.yes') : params.value === false ? t('common.no') : '',
      },
      {
        field: 'createdAt',
        headerName: t('malls.col.createdAt'),
        width: 170,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'updatedAt',
        headerName: t('malls.col.updatedAt'),
        width: 170,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'createdBy',
        headerName: t('malls.col.createdBy'),
        width: 120,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'updatedBy',
        headerName: t('malls.col.updatedBy'),
        width: 120,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
    ],
    [t, total, page, pageSize],
  );

  const toolbar = (
    <div className="d-flex align-items-center justify-content-between gap-2 flex-grow-1 flex-wrap w-100">
      <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-nowrap orders-filter-row">
        <div className="input-group input-group-sm orders-search-group" id="malls-search-full-group">
          <span className="input-group-text orders-toolbar-addon" id="malls-search-filter-addon">
            <FiFilter size={16} className="orders-filter-icon" aria-hidden />
          </span>
          <input
            type="text"
            className="form-control form-control-sm orders-search-keyword"
            placeholder={t('malls.searchPlaceholder')}
            aria-label={t('malls.searchPlaceholder')}
            aria-describedby="malls-search-btn-addon"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
          />
          <button
            type="button"
            id="malls-search-btn-addon"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center orders-search-btn"
            onClick={applySearch}
            title={t('common.search')}
            aria-label={t('common.search')}
          >
            <FiSearch size={16} className="me-1" aria-hidden />
            {t('common.search')}
          </button>
          <button
            type="button"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center orders-search-btn"
            onClick={showAll}
            title={t('malls.toolbar.showAll')}
            aria-label={t('malls.toolbar.showAll')}
          >
            <FiRotateCcw size={16} className="me-1" aria-hidden />
            {t('malls.toolbar.showAll')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout title={t('malls.title')} showHeaderRefresh={false}>
      <DataGrid<MallManageRow>
        columnDefs={columnDefs}
        rowData={items}
        loading={isLoading}
        pagination={false}
        exportFileName="malls"
        showExportButton={false}
        toolbar={toolbar}
        defaultColDef={{ sortable: false, resizable: true }}
        footer={
          <DataGridPaginationFooter
            total={total}
            page={page}
            pageSize={pageSize}
            pageSizeOptions={[50, 100, 500, 1000]}
            loading={isLoading}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            onFirst={() => setPage(0)}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(Math.max(0, totalPages - 1), p + 1))}
            onLast={() => setPage(Math.max(0, totalPages - 1))}
            first={first}
            last={last}
          />
        }
        getRowId={(params) => params.data?.mallCd ?? ''}
      />
    </PageLayout>
  );
}
