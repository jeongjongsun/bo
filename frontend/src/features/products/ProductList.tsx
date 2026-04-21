import { useCallback, useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams, CellValueChangedEvent } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiDownload, FiUpload } from 'react-icons/fi';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { DataGrid, DataGridPaginationFooter, type DataGridRef } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useProductList, useUpdateProductField, useBulkImportProducts } from './hooks';
import { downloadImportTemplate, downloadFullExport } from '@/api/products';
import { useCorporationStore } from '@/store/useCorporationStore';
import type { ProductListItem } from './types';
import { ProductEditModal } from './ProductEditModal';
import type { BulkImportMode } from '@/api/products';

/** 상품 등록/수정 모달: 'create' = 등록, string = 수정(productId), null = 닫힘 */
type ProductEditModalOpen = 'create' | string | null;

export function ProductList() {
  const { t, i18n } = useTranslation();
  const { corporationCd } = useCorporationStore();
  const gridRef = useRef<DataGridRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registerDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const pendingImportModeRef = useRef<BulkImportMode | null>(null);
  const [registerDropdownOpen, setRegisterDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'SINGLE' | 'SET'>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1000);
  const [editModalOpen, setEditModalOpen] = useState<ProductEditModalOpen>(null);

  useClickOutside(registerDropdownRef, () => setRegisterDropdownOpen(false), registerDropdownOpen);
  useClickOutside(exportDropdownRef, () => setExportDropdownOpen(false), exportDropdownOpen);

  const { data: products = [], isLoading } = useProductList(
    corporationCd ? { corporationCd } : {},
  );

  const { singleCount, setCount, filteredProducts } = useMemo(() => {
    const single = products.filter((p) => p.productType === 'SINGLE').length;
    const set = products.filter((p) => p.productType === 'SET').length;
    const filtered =
      productTypeFilter === 'all'
        ? products
        : products.filter((p) => p.productType === productTypeFilter);
    return { singleCount: single, setCount: set, filteredProducts: filtered };
  }, [products, productTypeFilter]);

  const total = filteredProducts.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 0;
  const pagedProducts = useMemo(
    () => filteredProducts.slice(page * pageSize, (page + 1) * pageSize),
    [filteredProducts, page, pageSize],
  );
  const first = page === 0;
  const last = totalPages <= 0 || page >= totalPages - 1;

  const { mutate: updateField } = useUpdateProductField();
  const { mutateAsync: bulkImport, isPending: isImporting } = useBulkImportProducts();

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<ProductListItem>) => {
      const { data, colDef, newValue } = event;
      if (!data || !colDef.field) return;

      updateField(
        { productId: data.productId, field: colDef.field, value: newValue },
        {
          onError: (err) => {
            showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
            event.api.undoCellEditing();
          },
        },
      );
    },
    [updateField, t],
  );

  const columnDefs = useMemo<ColDef<ProductListItem>[]>(
    () => [
      {
        field: 'rowNum',
        headerName: t('products.col.rowNum'),
        width: 80,
        filter: 'agNumberColumnFilter',
        pinned: 'left',
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
        field: 'productCd',
        headerName: t('products.col.productCd'),
        width: 140,
        pinned: 'left',
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<ProductListItem>) => {
          const cd = params.value ?? '';
          const productId = params.data?.productId;
          if (!productId) return cd;
          return (
            <button
              type="button"
              className="btn btn-link p-0 text-start text-decoration-none"
              onClick={(e) => {
                e.stopPropagation();
                setEditModalOpen(productId);
              }}
            >
              {cd}
            </button>
          );
        },
      },
      {
        field: 'productNm',
        headerName: t('products.col.productNm'),
        flex: 1,
        minWidth: 200,
        editable: true,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'productType',
        headerName: t('products.col.productType'),
        width: 120,
        editable: false,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['SINGLE', 'SET'],
        },
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<ProductListItem>) => {
          const isSet = params.value === 'SET';
          const label = isSet ? t('products.type.set') : t('products.type.single');
          const badgeClass = isSet
            ? 'badge badge-phoenix badge-phoenix-success'
            : 'badge badge-phoenix badge-phoenix-primary';
          return <span className={badgeClass}>{label}</span>;
        },
      },
      {
        field: 'baseUnitCd',
        headerName: t('products.col.baseUnitCd'),
        width: 110,
        editable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'isSale',
        headerName: t('products.col.isSale'),
        width: 100,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [true, false],
        },
        cellStyle: { textAlign: 'center' },
        valueFormatter: (p) =>
          p.value === true || p.value === 'true'
            ? t('common.yes')
            : t('common.no'),
      },
      {
        field: 'isDisplay',
        headerName: t('products.col.isDisplay'),
        width: 100,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [true, false],
        },
        cellStyle: { textAlign: 'center' },
        valueFormatter: (p) =>
          p.value === true || p.value === 'true'
            ? t('common.yes')
            : t('common.no'),
      },
      {
        field: 'createdBy',
        headerName: t('products.col.createdBy'),
        width: 110,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'createdAt',
        headerName: t('products.col.createdAt'),
        width: 170,
        cellStyle: { textAlign: 'center' },
      },
    ],
    [t, total, page, pageSize],
  );

  const handleOpenCreateModal = useCallback(() => {
    if (!corporationCd) {
      showError(t('common.error'), t('products.corporation_required'));
      return;
    }
    setEditModalOpen('create');
  }, [corporationCd, t]);

  const handleToolbarAddClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      requestAnimationFrame(() => handleOpenCreateModal());
    },
    [handleOpenCreateModal],
  );

  const handleBulkRegisterClick = useCallback(() => {
    pendingImportModeRef.current = 'full';
    setRegisterDropdownOpen(false);
    requestAnimationFrame(() => fileInputRef.current?.click());
  }, []);

  const handleImportFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!corporationCd) {
        showError(t('common.error'), t('products.corporation_required'));
        return;
      }
      const mode = pendingImportModeRef.current ?? 'full';
      pendingImportModeRef.current = null;
      bulkImport({ file, corporationCd: corporationCd!, mode }, {
        onSuccess: (res) => {
          let msg: string;
          if (mode === 'unitsOnly') {
            msg = t('products.import.successUnitsOnly', { count: res.successCount });
          } else if (mode === 'setOnly') {
            msg = t('products.import.successSetOnly', { count: res.successCount });
          } else if (res.skippedCount) {
            msg = t('products.import.successWithSkipped', { count: res.successCount, skipped: res.skippedCount });
          } else {
            msg = t('products.import.success', { count: res.successCount });
          }
          showSuccess(msg);
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      });
    },
    [bulkImport, corporationCd, t],
  );

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const lang = i18n?.language?.startsWith('ko') ? 'ko' : 'en';
      await downloadImportTemplate(lang);
      showSuccess(t('products.import.templateDownloaded'));
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    }
  }, [i18n, t]);

  const handleDownloadFullExport = useCallback(async () => {
    if (!corporationCd) return;
    const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
    try {
      await downloadFullExport(corporationCd, lang);
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    }
  }, [corporationCd, i18n, t]);

  const toolbar = (
    <div className="d-flex flex-wrap align-items-center justify-content-between w-100 gap-2">
      <ul className="nav nav-links mb-0 mx-n3 flex-shrink-0">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${productTypeFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setProductTypeFilter('all'); setPage(0); }}
            aria-current={productTypeFilter === 'all' ? 'page' : undefined}
          >
            <span>{t('products.filter.all')}</span>
            <span className="text-body-tertiary fw-semibold ms-1">({products.length})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${productTypeFilter === 'SINGLE' ? 'active' : ''}`}
            onClick={() => { setProductTypeFilter('SINGLE'); setPage(0); }}
            aria-current={productTypeFilter === 'SINGLE' ? 'page' : undefined}
          >
            <span>{t('products.filter.single')}</span>
            <span className="text-body-tertiary fw-semibold ms-1">({singleCount})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${productTypeFilter === 'SET' ? 'active' : ''}`}
            onClick={() => { setProductTypeFilter('SET'); setPage(0); }}
            aria-current={productTypeFilter === 'SET' ? 'page' : undefined}
          >
            <span>{t('products.filter.set')}</span>
            <span className="text-body-tertiary fw-semibold ms-1">({setCount})</span>
          </button>
        </li>
      </ul>
      <div className="d-flex flex-wrap gap-1 align-items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="d-none"
        aria-hidden
        onChange={handleImportFileChange}
      />
      {/* 상품등록 그룹: 드롭다운(상품 수기 등록, 엑셀양식 다운로드, 상품 일괄 등록) */}
      <div className="btn-group position-relative" role="group" ref={registerDropdownRef}>
        <button
          type="button"
          className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
          onClick={() => setRegisterDropdownOpen((v) => !v)}
          disabled={isImporting || !corporationCd}
          aria-expanded={registerDropdownOpen}
          aria-haspopup="true"
          title={t('products.toolbar.groupProductRegister')}
        >
          <FiUpload size={14} className="me-1" aria-hidden />
          {t('products.toolbar.groupProductRegister')}
        </button>
        <ul
          className={`dropdown-menu dropdown-menu-end ${registerDropdownOpen ? 'show' : ''}`}
          style={
            registerDropdownOpen
              ? {
                  display: 'block',
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  left: 'auto',
                  zIndex: 1050,
                  minWidth: 'max(100%, 12rem)',
                }
              : undefined
          }
        >
          <li>
            <button
              type="button"
              className="dropdown-item d-inline-flex align-items-center"
              onClick={(e) => { setRegisterDropdownOpen(false); handleToolbarAddClick(e); }}
              data-testid="product-add-toolbar"
            >
              <FiPlus size={14} className="me-1" aria-hidden />
              {t('products.toolbar.manualRegister')}
            </button>
          </li>
          <li>
            <button
              type="button"
              className="dropdown-item d-inline-flex align-items-center"
              onClick={handleBulkRegisterClick}
              disabled={isImporting}
            >
              <FiUpload size={14} className="me-1" aria-hidden />
              {isImporting ? t('products.import.uploading') : t('products.import.modeFull')}
            </button>
          </li>
          <li>
            <button
              type="button"
              className="dropdown-item d-inline-flex align-items-center"
              onClick={() => { setRegisterDropdownOpen(false); handleDownloadTemplate(); }}
            >
              <FiDownload size={14} className="me-1" aria-hidden />
              {t('products.toolbar.downloadTemplate')}
            </button>
          </li>
        </ul>
      </div>
      </div>
    </div>
  );

  /** 페이지 헤더(새로고침 버튼 왼쪽)에 둘 엑셀 다운로드 — 주문관리와 위치 통일 */
  const excelDownloadActions = (
    <div className="btn-group position-relative" role="group" ref={exportDropdownRef}>
      <button
        type="button"
        className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
        onClick={() => setExportDropdownOpen((v) => !v)}
        aria-expanded={exportDropdownOpen}
        aria-haspopup="true"
        title={t('products.toolbar.exportExcelGroup')}
      >
        <FiDownload size={14} className="me-1" aria-hidden />
        {t('products.toolbar.exportExcelGroup')}
      </button>
      <ul
        className={`dropdown-menu dropdown-menu-end ${exportDropdownOpen ? 'show' : ''}`}
        style={exportDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050, minWidth: 200 } : undefined}
      >
        <li>
          <button
            type="button"
            className="dropdown-item d-inline-flex align-items-center"
            onClick={() => { setExportDropdownOpen(false); gridRef.current?.exportExcel(); }}
          >
            <FiDownload size={14} className="me-1" aria-hidden />
            {t('products.toolbar.exportGrid')}
          </button>
        </li>
        <li>
          <button
            type="button"
            className="dropdown-item d-inline-flex align-items-center"
            onClick={() => { setExportDropdownOpen(false); handleDownloadFullExport(); }}
            disabled={!corporationCd}
          >
            <FiDownload size={14} className="me-1" aria-hidden />
            {t('products.toolbar.exportFull')}
          </button>
        </li>
      </ul>
    </div>
  );

  return (
    <PageLayout title={t('products.title')} actions={excelDownloadActions}>
      {editModalOpen !== null && (
        <ProductEditModal
          productId={editModalOpen === 'create' ? null : editModalOpen}
          onSuccess={() => setEditModalOpen(null)}
          onClose={() => setEditModalOpen(null)}
        />
      )}
      <DataGrid<ProductListItem>
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={pagedProducts}
        loading={isLoading}
        pagination={false}
        exportFileName="products"
        showExportButton={false}
        toolbar={toolbar}
        footer={
          <DataGridPaginationFooter
            total={total}
            page={page}
            pageSize={pageSize}
            pageSizeOptions={[100, 1000, 5000, 10000]}
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
        getRowId={(params) => params.data.productId}
        onCellValueChanged={handleCellValueChanged}
      />
    </PageLayout>
  );
}
