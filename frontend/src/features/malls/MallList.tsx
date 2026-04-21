import { useMemo, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ColDef, ICellRendererParams, CellValueChangedEvent } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiDownload } from 'react-icons/fi';
import { DataGrid, DataGridPaginationFooter, type DataGridRef } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useCorporationStore } from '@/store/useCorporationStore';
import { useMallList, useSalesTypeCodes, useCurrencyCodes, useUpdateStore } from './hooks';
import { StoreRegisterModal } from './StoreRegisterModal';
import { StoreEditModal } from './StoreEditModal';
import { StoreConnectionPanel } from './StoreConnectionPanel';
import type { MallStoreListItem, StoreInfoLike } from './types';

/** 판매구분 뱃지 클래스 (순서대로 적용, 없으면 secondary). */
const SALES_TYPE_BADGE_CLASSES = [
  'badge badge-phoenix badge-phoenix-primary',
  'badge badge-phoenix badge-phoenix-info',
  'badge badge-phoenix badge-phoenix-success',
  'badge badge-phoenix badge-phoenix-warning',
  'badge badge-phoenix badge-phoenix-secondary',
];

/** 그리드 셀 편집 후 API 전송용 storeInfo (빈 값 제외). */
function buildStoreInfoForApi(storeInfo: StoreInfoLike | null | undefined): StoreInfoLike | undefined {
  if (!storeInfo || typeof storeInfo !== 'object') return undefined;
  const out: StoreInfoLike = {};
  if (storeInfo.store_type_cd?.trim()) out.store_type_cd = storeInfo.store_type_cd.trim();
  if (storeInfo.wms_yn) out.wms_yn = storeInfo.wms_yn;
  if (storeInfo.currency_cd?.trim()) out.currency_cd = storeInfo.currency_cd.trim();
  if (storeInfo.gmt?.trim()) out.gmt = storeInfo.gmt.trim();
  return Object.keys(out).length > 0 ? out : undefined;
}

export type SalesTypeFilter = 'all' | string;

export function MallList() {
  const { t } = useTranslation();
  const { corporationCd } = useCorporationStore();
  const [salesTypeFilter, setSalesTypeFilter] = useState<SalesTypeFilter>('all');
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<MallStoreListItem | null>(null);
  const [connectionPanelStore, setConnectionPanelStore] = useState<MallStoreListItem | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1000);
  const gridRef = useRef<DataGridRef>(null);

  const { data: salesTypeCodes = [] } = useSalesTypeCodes();
  const { data: currencyCodes = [] } = useCurrencyCodes();
  const { data, isLoading } = useMallList({
    corporationCd: corporationCd ?? undefined,
    page: 0,
    size: 5000,
  });

  const { mutate: updateStoreMutation } = useUpdateStore();
  const items = data?.items ?? [];

  const { counts, filteredItems } = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    salesTypeCodes.forEach((code) => {
      counts[code.subCd] = items.filter((m) => m.salesTypeCd === code.subCd).length;
    });
    const filtered =
      salesTypeFilter === 'all'
        ? items
        : items.filter((m) => m.salesTypeCd === salesTypeFilter);
    return { counts, filteredItems: filtered };
  }, [items, salesTypeFilter, salesTypeCodes]);

  const total = filteredItems.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 0;
  const pagedItems = useMemo(
    () => filteredItems.slice(page * pageSize, (page + 1) * pageSize),
    [filteredItems, page, pageSize],
  );
  const first = page === 0;
  const last = totalPages <= 0 || page >= totalPages - 1;

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<MallStoreListItem>) => {
      const field = event.colDef?.field;
      const { data } = event;
      if (!data) return;

      if (field === 'storeNm') {
        const newValue = event.newValue;
        if (newValue === undefined || String(newValue).trim() === '') return;
        updateStoreMutation(
          { storeId: data.storeId, storeNm: String(newValue).trim() },
          {
            onError: (err) => {
              showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
              event.api.undoCellEditing();
            },
          },
        );
        return;
      }

      if (field === 'isActive') {
        updateStoreMutation(
          { storeId: data.storeId, storeNm: data.storeNm, isActive: data.isActive ?? false },
          {
            onError: (err) => {
              showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
              event.api.undoCellEditing();
            },
          },
        );
        return;
      }

      if (field === 'storeTypeCd' || field === 'wmsYn' || field === 'currencyCd' || field === 'gmt') {
        const storeInfo = buildStoreInfoForApi(data.storeInfo);
        updateStoreMutation(
          {
            storeId: data.storeId,
            storeNm: data.storeNm,
            storeInfo,
            isActive: data.isActive ?? false,
          },
          {
            onError: (err) => {
              showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
              event.api.undoCellEditing();
            },
          },
        );
      }
    },
    [updateStoreMutation, t],
  );

  const columnDefs = useMemo<ColDef<MallStoreListItem>[]>(
    () => [
      {
        field: 'rowNum',
        headerName: t('malls.col.rowNum'),
        width: 80,
        pinned: 'left',
        filter: 'agNumberColumnFilter',
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) => {
          const displayed = params.api?.getDisplayedRowCount?.() ?? 0;
          const idx = params.node?.rowIndex ?? 0;
          return total > 0 && displayed > 0 ? total - (page * pageSize) - idx : undefined;
        },
        valueFormatter: (params) =>
          params.value != null ? Number(params.value).toLocaleString() : '',
      },
      {
        field: 'mallCd',
        headerName: t('malls.col.mallCd'),
        width: 120,
        pinned: 'left',
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'mallNm',
        headerName: t('malls.col.mallNm'),
        width: 140,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'storeCd',
        headerName: t('malls.col.storeCd'),
        width: 140,
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) =>
          params.data?.storeCd ?? (params.data as Record<string, unknown>)?.store_cd ?? '',
        cellRenderer: (params: ICellRendererParams<MallStoreListItem>) => {
          const row = params.data;
          const cd = row?.storeCd ?? (row as Record<string, unknown>)?.store_cd ?? '';
          if (!row || !cd) return null;
          return (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary text-decoration-underline"
              onClick={() => setStoreToEdit(row)}
              aria-label={t('malls.modal.editTitle')}
            >
              {cd}
            </button>
          );
        },
      },
      {
        field: 'connections',
        headerName: t('malls.col.connections'),
        width: 100,
        cellStyle: { textAlign: 'center' },
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<MallStoreListItem>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary text-decoration-underline"
              onClick={() => setConnectionPanelStore(row)}
              aria-label={t('malls.connections.link')}
            >
              {t('malls.connections.link')}
            </button>
          );
        },
      },
      {
        field: 'storeNm',
        headerName: t('malls.col.storeNm'),
        width: 180,
        flex: 1,
        editable: true,
        cellStyle: { textAlign: 'left' },
        valueGetter: (params) =>
          params.data?.storeNm ?? (params.data as Record<string, unknown>)?.store_nm ?? '',
        valueSetter: (params) => {
          if (params.data) {
            (params.data as MallStoreListItem).storeNm = params.newValue ?? '';
            (params.data as Record<string, unknown>).store_nm = params.newValue ?? '';
          }
        },
      },
      {
        field: 'storeTypeCd',
        headerName: t('malls.col.storeTypeCd'),
        width: 110,
        editable: true,
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) => {
          const code = params.data?.storeInfo?.store_type_cd ?? '';
          return code ? t(`malls.storeType.${code}` as 'malls.storeType.OWN') : '';
        },
        valueSetter: (params) => {
          if (params.data) {
            if (!params.data.storeInfo) params.data.storeInfo = {};
            const v = params.newValue as string;
            const code =
              v === t('malls.storeType.OWN')
                ? 'OWN'
                : v === t('malls.storeType.OPEN')
                  ? 'OPEN'
                  : v === t('malls.storeType.OFFLINE')
                    ? 'OFFLINE'
                    : v || '';
            params.data.storeInfo.store_type_cd = code;
          }
        },
        valueFormatter: (params) => params.value ?? '',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [t('malls.storeType.OWN'), t('malls.storeType.OPEN'), t('malls.storeType.OFFLINE')],
        },
      },
      {
        field: 'wmsYn',
        headerName: t('malls.col.wmsYn'),
        width: 90,
        editable: true,
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) => {
          const yn = params.data?.storeInfo?.wms_yn;
          return yn === 'Y' ? t('common.yes') : yn === 'N' ? t('common.no') : '';
        },
        valueSetter: (params) => {
          if (params.data) {
            if (!params.data.storeInfo) params.data.storeInfo = {};
            const v = params.newValue as string;
            params.data.storeInfo.wms_yn = v === t('common.yes') ? 'Y' : v === t('common.no') ? 'N' : v || '';
          }
        },
        valueFormatter: (params) => params.value ?? '',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: [t('common.yes'), t('common.no')] },
      },
      {
        field: 'currencyCd',
        headerName: t('malls.col.currencyCd'),
        width: 90,
        editable: true,
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) => params.data?.storeInfo?.currency_cd ?? '',
        valueSetter: (params) => {
          if (params.data) {
            if (!params.data.storeInfo) params.data.storeInfo = {};
            params.data.storeInfo.currency_cd = (params.newValue as string) ?? '';
          }
        },
        valueFormatter: (params) => {
          const subCd = params.value as string;
          if (!subCd) return '';
          const c = currencyCodes.find((x) => x.subCd === subCd);
          return c ? `${c.codeNm} (${c.subCd})` : subCd;
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: currencyCodes.map((c) => c.subCd),
        },
      },
      {
        field: 'gmt',
        headerName: t('malls.col.gmt'),
        width: 90,
        editable: true,
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) => params.data?.storeInfo?.gmt ?? '',
        valueSetter: (params) => {
          if (params.data) {
            if (!params.data.storeInfo) params.data.storeInfo = {};
            params.data.storeInfo.gmt = (params.newValue as string) ?? '';
          }
        },
      },
      {
        field: 'deliveryType',
        headerName: t('malls.col.deliveryType'),
        width: 110,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'collectionType',
        headerName: t('malls.col.collectionType'),
        width: 110,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'salesTypeCd',
        headerName: t('malls.col.salesTypeCd'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<MallStoreListItem>) => {
          const subCd = params.value as string | null | undefined;
          if (!subCd) return null;
          const idx = salesTypeCodes.findIndex((c) => c.subCd === subCd);
          const label = idx >= 0 ? salesTypeCodes[idx].codeNm : subCd;
          const badgeClass =
            idx >= 0
              ? SALES_TYPE_BADGE_CLASSES[idx % SALES_TYPE_BADGE_CLASSES.length]
              : 'badge badge-phoenix badge-phoenix-secondary';
          return <span className={badgeClass}>{label}</span>;
        },
      },
      {
        field: 'isActive',
        headerName: t('malls.col.isActive'),
        width: 90,
        editable: true,
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) => (params.data?.isActive === true ? t('common.yes') : t('common.no')),
        valueSetter: (params) => {
          if (params.data) (params.data as MallStoreListItem).isActive = params.newValue === t('common.yes');
        },
        valueFormatter: (params) => params.value ?? '',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: [t('common.yes'), t('common.no')] },
      },
      {
        field: 'createdBy',
        headerName: t('malls.col.createdBy'),
        width: 100,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'createdAt',
        headerName: t('malls.col.createdAt'),
        width: 160,
        cellStyle: { textAlign: 'center' },
      },
    ],
    [t, salesTypeCodes, currencyCodes, total, page, pageSize],
  );

  /** 페이지 헤더(새로고침 버튼 왼쪽)에 둘 엑셀 다운로드 — 주문관리와 위치 통일 */
  const excelDownloadActions = (
    <button
      type="button"
      className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
      onClick={() => gridRef.current?.exportExcel()}
      title={t('grid.exportExcel')}
    >
      <FiDownload size={14} className="me-1" aria-hidden />
      {t('grid.exportExcel')}
    </button>
  );

  const toolbarSecondary = (_exportButton: ReactNode) => (
    <div className="d-flex align-items-center justify-content-between gap-1 flex-1 min-w-0">
      <ul className="nav nav-links mb-0 mx-n3 flex-shrink-0">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${salesTypeFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setSalesTypeFilter('all'); setPage(0); }}
            aria-current={salesTypeFilter === 'all' ? 'page' : undefined}
          >
            <span>{t('malls.filter.all')}</span>
            <span className="text-body-tertiary fw-semibold ms-1">({counts.all})</span>
          </button>
        </li>
        {salesTypeCodes.map((code) => (
          <li key={code.subCd} className="nav-item">
            <button
              type="button"
              className={`nav-link ${salesTypeFilter === code.subCd ? 'active' : ''}`}
              onClick={() => { setSalesTypeFilter(code.subCd); setPage(0); }}
              aria-current={salesTypeFilter === code.subCd ? 'page' : undefined}
            >
              <span>{code.codeNm}</span>
              <span className="text-body-tertiary fw-semibold ms-1">({counts[code.subCd] ?? 0})</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="d-inline-flex align-items-center gap-1 flex-shrink-0">
        <button
          type="button"
          className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center flex-shrink-0"
          onClick={() => setStoreModalOpen(true)}
          title={t('malls.toolbar.addStore')}
        >
          <FiPlus size={14} className="me-1" aria-hidden />
          {t('malls.toolbar.addStore')}
        </button>
      </div>
    </div>
  );

  return (
    <PageLayout title={t('malls.title')} actions={excelDownloadActions}>
      {storeModalOpen && (
        <StoreRegisterModal
          onClose={() => setStoreModalOpen(false)}
          onSuccess={() => setStoreModalOpen(false)}
        />
      )}
      {storeToEdit && (
        <StoreEditModal
          store={storeToEdit}
          onClose={() => setStoreToEdit(null)}
          onSuccess={() => setStoreToEdit(null)}
        />
      )}
      {connectionPanelStore && (
        <StoreConnectionPanel
          store={connectionPanelStore}
          onClose={() => setConnectionPanelStore(null)}
        />
      )}
      <DataGrid<MallStoreListItem>
        ref={gridRef}
        key={`mall-store-${salesTypeFilter}-${filteredItems.length}`}
        columnDefs={columnDefs}
        rowData={pagedItems}
        loading={isLoading}
        pagination={false}
        exportFileName="malls"
        showExportButton={false}
        footer={
          <DataGridPaginationFooter
            total={total}
            page={page}
            pageSize={pageSize}
            pageSizeOptions={[100, 1000, 5000]}
            loading={isLoading}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            onFirst={() => setPage(0)}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            onLast={() => setPage(totalPages - 1)}
            first={first}
            last={last}
          />
        }
        getRowId={(params) => {
          const id = params.data?.storeId ?? params.node?.rowIndex ?? params.rowIndex;
          return id != null ? String(id) : `row-${params.node?.rowIndex ?? 0}`;
        }}
        toolbarSecondary={toolbarSecondary}
        onCellValueChanged={handleCellValueChanged}
      />
    </PageLayout>
  );
}
