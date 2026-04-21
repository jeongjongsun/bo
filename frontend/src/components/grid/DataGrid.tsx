import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  AllCommunityModule,
  themeBalham,
  colorSchemeLightCold,
} from 'ag-grid-community';
import type {
  ColDef,
  GridReadyEvent,
  CellValueChangedEvent,
  GetRowIdParams,
  SelectionChangedEvent,
} from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';
import { useTranslation } from 'react-i18next';
import { FiDownload } from 'react-icons/fi';
import { exportToExcel } from '@/utils/exportExcel';
import { AG_GRID_LOCALE_KO } from './agGridLocaleKo';
import './DataGrid.css';

export interface DataGridRef {
  exportExcel: () => void;
  scrollToTop: () => void;
}

const modules = [AllCommunityModule];

/**
 * 그리드 컨테이너 위치 ~ 뷰포트 하단까지 남은 높이를 실시간 계산.
 * height="auto" 일 때만 사용된다.
 */
function useAutoHeight(
  containerRef: React.RefObject<HTMLDivElement | null>,
  bottomOffset = 16,
) {
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const top = el.getBoundingClientRect().top;
      setHeight(Math.max(200, window.innerHeight - top - bottomOffset));
    };

    update();
    window.addEventListener('resize', update);

    const ro = new ResizeObserver(update);
    ro.observe(el.parentElement ?? document.body);

    return () => {
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, [containerRef, bottomOffset]);

  return height;
}

export interface DataGridProps<TData = unknown> {
  columnDefs: ColDef<TData>[];
  rowData: TData[];
  pagination?: boolean;
  paginationPageSize?: number;
  paginationPageSizeSelector?: number[] | boolean;
  loading?: boolean;
  /** 고정 px 값 또는 'auto'(뷰포트 하단까지 자동 채움). 기본값 'auto'. */
  height?: 'auto' | number;
  /** height="auto" 일 때 하단 여백(px). 기본 16. */
  bottomOffset?: number;
  exportFileName?: string;
  showExportButton?: boolean;
  defaultColDef?: ColDef<TData>;
  onCellValueChanged?: (event: CellValueChangedEvent<TData>) => void;
  onGridReady?: (event: GridReadyEvent<TData>) => void;
  getRowId?: (params: GetRowIdParams<TData>) => string;
  /** 다중 선택 시 'multiple', 단일 선택 시 'single'. AG Grid v32+ 객체 형식으로 전달. */
  rowSelection?: 'single' | 'multiple';
  onSelectionChanged?: (event: SelectionChangedEvent<TData>) => void;
  toolbar?: React.ReactNode;
  /** 두 번째 툴바 행. ReactNode 또는 (엑셀버튼) => ReactNode. 함수면 전달받은 버튼을 원하는 위치에 배치. */
  toolbarSecondary?: React.ReactNode | ((exportButton: React.ReactNode) => React.ReactNode);
  /** 그리드 하단에 표시 (페이징 바 등). 다른 그리드와 위치 통일용. */
  footer?: React.ReactNode;
  /** true면 인접 행의 동일한 셀 값을 세로로 묶어 표시 (AG Grid enableCellSpan). */
  enableCellSpan?: boolean;
}

function DataGridInner<TData = unknown>({
  columnDefs,
  rowData,
  pagination = true,
  paginationPageSize = 100,
  paginationPageSizeSelector = [50, 100, 500, 1000, 5000],
  loading = false,
  height = 'auto',
  bottomOffset = 16,
  exportFileName,
  showExportButton = true,
  defaultColDef,
  onCellValueChanged,
  onGridReady,
  getRowId,
  rowSelection,
  onSelectionChanged,
  toolbar,
  toolbarSecondary,
  footer,
  enableCellSpan = false,
}: DataGridProps<TData>, ref: React.Ref<DataGridRef>) {
  const { t, i18n } = useTranslation();
  const gridRef = useRef<AgGridReact<TData>>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const autoHeight = useAutoHeight(gridContainerRef, bottomOffset);
  const resolvedHeight = height === 'auto' ? autoHeight : height;

  const handleExportExcel = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const columns = api.getAllDisplayedColumns();
    const headers = columns.map(
      (col) => api.getDisplayNameForColumn(col, null) ?? col.getColId(),
    );

    const rows: unknown[][] = [];
    api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) {
        const row = columns.map((col) =>
          api.getCellValue({ rowNode: node, colKey: col.getColId() }),
        );
        rows.push(row);
      }
    });

    exportToExcel(headers, rows, exportFileName ?? 'export');
  }, [exportFileName]);

  const handleScrollToTop = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const rowCount = api.getDisplayedRowCount();
    if (rowCount > 0) api.ensureIndexVisible(0, 'top');
  }, []);

  useImperativeHandle(ref, () => ({
    exportExcel: handleExportExcel,
    scrollToTop: handleScrollToTop,
  }), [handleExportExcel, handleScrollToTop]);

  const mergedDefaultColDef = useMemo<ColDef<TData>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 80,
      ...defaultColDef,
    }),
    [defaultColDef],
  );

  const localeText = useMemo(
    () => (i18n.language === 'ko' ? AG_GRID_LOCALE_KO : undefined),
    [i18n.language],
  );

  /** AG Grid v32+ rowSelection 객체 형식 (deprecation 제거) */
  const resolvedRowSelection = useMemo(() => {
    if (rowSelection === 'multiple') {
      return { mode: 'multiRow' as const, checkboxes: true, headerCheckbox: true };
    }
    if (rowSelection === 'single') {
      return { mode: 'singleRow' as const };
    }
    return undefined;
  }, [rowSelection]);

  const selectionColumnDef = useMemo(
    () => (rowSelection === 'multiple' ? { pinned: 'left' as const } : undefined),
    [rowSelection],
  );

  return (
    <div className="data-grid-wrapper">
      {(showExportButton || toolbar != null || toolbarSecondary != null) && (
        <div className={`data-grid-toolbar${toolbarSecondary != null ? ' data-grid-toolbar--rows' : ''}`}>
          {toolbarSecondary != null ? (
            <>
              {toolbar != null && <div className="data-grid-toolbar__primary">{toolbar}</div>}
              <div className="data-grid-toolbar__secondary">
                {typeof toolbarSecondary === 'function'
                  ? toolbarSecondary(
                      showExportButton ? (
                        <button
                          key="export"
                          type="button"
                          className="btn btn-phoenix-secondary btn-sm btn-default-visible"
                          onClick={handleExportExcel}
                          title={t('grid.exportExcel')}
                        >
                          <FiDownload size={16} className="me-1" aria-hidden />
                          {t('grid.exportExcel')}
                        </button>
                      ) : null,
                    )
                  : (
                    <>
                      {toolbarSecondary}
                      {showExportButton && (
                        <button
                          type="button"
                          className="btn btn-phoenix-secondary btn-sm btn-default-visible"
                          onClick={handleExportExcel}
                          title={t('grid.exportExcel')}
                        >
                          <FiDownload size={16} className="me-1" aria-hidden />
                          {t('grid.exportExcel')}
                        </button>
                      )}
                    </>
                  )}
              </div>
            </>
          ) : (
            <>
              {toolbar}
              {showExportButton && (
                <button
                  type="button"
                  className="btn btn-phoenix-secondary btn-sm btn-default-visible"
                  onClick={handleExportExcel}
                  title={t('grid.exportExcel')}
                >
                  <FiDownload size={16} className="me-1" aria-hidden />
                  {t('grid.exportExcel')}
                </button>
              )}
            </>
          )}
        </div>
      )}
      <AgGridProvider modules={modules}>
        <div
          className={`data-grid-container${rowSelection === 'multiple' ? ' data-grid-container--has-selection-column' : ''}`}
          ref={gridContainerRef}
          style={{
            height: resolvedHeight,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="data-grid-body" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {loading && (
              <div className="data-grid-loading-overlay" aria-live="polite" aria-busy="true">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('common.loading')}</span>
                </div>
                <span className="data-grid-loading-text">{t('common.loading')}</span>
              </div>
            )}
            <AgGridReact<TData>
              key={i18n.language}
              ref={gridRef}
              theme={themeBalham.withPart(colorSchemeLightCold).withParams({
                columnBorder: { style: 'solid', width: 1, color: '#e2e8f0' },
              })}
              columnDefs={columnDefs}
              rowData={rowData}
              defaultColDef={mergedDefaultColDef}
              pagination={footer != null ? false : pagination}
              paginationPageSize={paginationPageSize}
              paginationPageSizeSelector={paginationPageSizeSelector}
              loading={loading}
              localeText={localeText}
              onCellValueChanged={onCellValueChanged}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              getRowId={getRowId}
              rowSelection={resolvedRowSelection}
              selectionColumnDef={selectionColumnDef}
              enableCellTextSelection
              ensureDomOrder
              enableCellSpan={enableCellSpan}
            />
          </div>
          {footer != null && <div className="data-grid-footer">{footer}</div>}
        </div>
      </AgGridProvider>
    </div>
  );
}

export const DataGrid = forwardRef(DataGridInner) as <TData = unknown>(
  props: DataGridProps<TData> & { ref?: React.Ref<DataGridRef> }
) => React.ReactElement;
