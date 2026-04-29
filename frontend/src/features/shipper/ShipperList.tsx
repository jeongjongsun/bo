import { useCallback, useMemo, useState } from 'react';
import type {
  ColDef,
  ICellRendererParams,
  CellValueChangedEvent,
  ProcessCellForExportParams,
} from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiFilter, FiPlus, FiRotateCcw, FiSearch } from 'react-icons/fi';
import { DataGrid, DataGridPaginationFooter } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { CorporationManageRow } from '@/api/corporationsManage';
import { downloadCorporationsExport } from '@/api/corporationsManage';
import { useHasMenuActionPermissionByPath } from '@/hooks/useActionPermission';
import { useCorporationManageList, useUpdateCorporationField } from './hooks';
import { CorporationRegisterModal } from './CorporationRegisterModal';
import { CorporationEditModal } from './CorporationEditModal';

export function ShipperList() {
  const { t, i18n } = useTranslation();
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editCd, setEditCd] = useState<string | null>(null);
  const canCreate = useHasMenuActionPermissionByPath('/basic/shipper', 'create');
  const canUpdate = useHasMenuActionPermissionByPath('/basic/shipper', 'update');
  const canExcelDownload = useHasMenuActionPermissionByPath('/basic/shipper', 'excel_download');

  const { data, isLoading } = useCorporationManageList({
    keyword: appliedKeyword || undefined,
    page,
    size: pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const first = data?.first ?? page === 0;
  const last = data?.last ?? true;

  const { mutate: updateField } = useUpdateCorporationField();

  const applySearch = useCallback(() => {
    setAppliedKeyword(keywordInput.trim());
    setPage(0);
  }, [keywordInput]);

  const showAll = useCallback(() => {
    setKeywordInput('');
    setAppliedKeyword('');
    setPage(0);
  }, []);

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<CorporationManageRow>) => {
      if (!canUpdate) {
        event.api.undoCellEditing();
        return;
      }
      const { data, colDef, newValue } = event;
      if (!data || !colDef.field) return;
      const field = colDef.field as 'corporationNm' | 'businessNo' | 'telNo' | 'email';
      if (field === 'corporationNm') {
        const v = newValue == null ? '' : String(newValue).trim();
        if (!v) {
          event.api.undoCellEditing();
          return;
        }
      }
      updateField(
        { corporationCd: data.corporationCd, field, value: newValue },
        {
          onError: (err) => {
            showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
            event.api.undoCellEditing();
          },
        },
      );
    },
    [canUpdate, updateField, t],
  );

  const handleExport = useCallback(async () => {
    if (!canExcelDownload) return;
    const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
    try {
      await downloadCorporationsExport(appliedKeyword || undefined, lang);
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    }
  }, [appliedKeyword, canExcelDownload, i18n.language, t]);

  const processCellForClipboard = useCallback(
    (params: ProcessCellForExportParams<CorporationManageRow>) => {
      const value = params.value == null ? '' : String(params.value);
      const normalized = value.replace(/\r?\n/g, ' ').replace(/\t/g, ' ').trim();
      if (!normalized) return '';

      const field = params.column.getColDef().field;
      if (field === 'businessNo' || field === 'telNo') {
        const escaped = normalized.replace(/"/g, '""');
        return `="${escaped}"`;
      }

      return normalized;
    },
    [],
  );

  const columnDefs = useMemo<ColDef<CorporationManageRow>[]>(
    () => [
      {
        colId: 'rowNum',
        headerName: t('shipper.col.rowNum'),
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
        field: 'corporationCd',
        headerName: t('shipper.col.corporationCd'),
        width: 130,
        pinned: 'left',
        sortable: false,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<CorporationManageRow>) => {
          const cd = params.value ?? '';
          const row = params.data;
          if (!row || !cd || !canUpdate) return cd;
          return (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary text-decoration-underline"
              onClick={() => setEditCd(cd)}
            >
              {cd}
            </button>
          );
        },
      },
      {
        field: 'corporationNm',
        headerName: t('shipper.col.corporationNm'),
        flex: 1,
        minWidth: 160,
        editable: canUpdate,
        sortable: false,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'businessNo',
        headerName: t('shipper.col.businessNo'),
        width: 140,
        editable: canUpdate,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'telNo',
        headerName: t('shipper.col.telNo'),
        width: 130,
        editable: canUpdate,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'email',
        headerName: t('shipper.col.email'),
        width: 200,
        editable: canUpdate,
        sortable: false,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'createdAt',
        headerName: t('shipper.col.createdAt'),
        width: 170,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
    ],
    [t, total, page, pageSize, canUpdate],
  );

  const toolbar = (
    <div className="d-flex align-items-center justify-content-between gap-2 flex-grow-1 flex-wrap w-100">
      <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-nowrap orders-filter-row">
        <div className="input-group input-group-sm orders-search-group" id="shipper-search-full-group">
          <span className="input-group-text orders-toolbar-addon" id="shipper-search-filter-addon">
            <FiFilter size={16} className="orders-filter-icon" aria-hidden />
          </span>
          <input
            type="text"
            className="form-control form-control-sm orders-search-keyword"
            placeholder={t('shipper.searchPlaceholder')}
            aria-label={t('shipper.searchPlaceholder')}
            aria-describedby="shipper-search-btn-addon"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
          />
          <button
            type="button"
            id="shipper-search-btn-addon"
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
            title={t('shipper.toolbar.showAll')}
            aria-label={t('shipper.toolbar.showAll')}
          >
            <FiRotateCcw size={16} className="me-1" aria-hidden />
            {t('shipper.toolbar.showAll')}
          </button>
        </div>
      </div>
      <div className="d-flex align-items-center gap-1 flex-shrink-0">
        {canCreate && (
          <button
            type="button"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
            onClick={() => setRegisterOpen(true)}
            title={t('shipper.toolbar.register')}
          >
            <FiPlus size={14} className="me-1" aria-hidden />
            {t('shipper.toolbar.register')}
          </button>
        )}
        {canExcelDownload && (
          <button
            type="button"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
            onClick={handleExport}
            title={t('shipper.toolbar.excelDownload')}
          >
            <FiDownload size={14} className="me-1" aria-hidden />
            {t('shipper.toolbar.excelDownload')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <PageLayout title={t('shipper.title')} showHeaderRefresh={false}>
      {registerOpen && canCreate && <CorporationRegisterModal onClose={() => setRegisterOpen(false)} />}
      {editCd && canUpdate && (
        <CorporationEditModal
          corporationCd={editCd}
          onClose={() => setEditCd(null)}
          onSuccess={() => setEditCd(null)}
        />
      )}
      <DataGrid<CorporationManageRow>
        columnDefs={columnDefs}
        rowData={items}
        loading={isLoading}
        pagination={false}
        exportFileName="shippers"
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
        getRowId={(params) => params.data?.corporationCd ?? ''}
        onCellValueChanged={handleCellValueChanged}
        processCellForClipboard={processCellForClipboard}
      />
    </PageLayout>
  );
}
