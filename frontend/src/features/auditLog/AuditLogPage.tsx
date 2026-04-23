import { useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiFilter, FiRefreshCw, FiRotateCcw, FiSearch } from 'react-icons/fi';
import { DataGrid, DataGridPaginationFooter, type DataGridRef } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import type { AuditLogListRow } from '@/api/auditLogs';
import { useHasMenuActionPermissionByPath } from '@/hooks/useActionPermission';
import { useAuditLogList } from './hooks';

function formatChangedFields(raw: string): string {
  if (!raw) return '-';
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return '-';
    return parsed.map((v) => String(v)).join(', ');
  } catch {
    return raw;
  }
}

function toIsoStart(dateText: string): string | undefined {
  if (!dateText) return undefined;
  return `${dateText}T00:00:00+09:00`;
}

function toIsoNextDay(dateText: string): string | undefined {
  if (!dateText) return undefined;
  const d = new Date(`${dateText}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}T00:00:00+09:00`;
}

function prettyJson(raw: string | undefined): string {
  if (!raw || raw.trim() === '') return '{}';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function safeParse(raw: string | undefined): Record<string, unknown> {
  if (!raw || raw.trim() === '') return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { $: parsed };
  } catch {
    return {};
  }
}

function flattenObject(value: unknown, prefix = ''): Record<string, string> {
  if (value === null || value === undefined) return { [prefix || '$']: String(value) };
  if (typeof value !== 'object') return { [prefix || '$']: String(value) };
  if (Array.isArray(value)) return { [prefix || '$']: JSON.stringify(value) };

  const out: Record<string, string> = {};
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    out[prefix || '$'] = '{}';
    return out;
  }
  keys.forEach((k) => {
    const next = prefix ? `${prefix}.${k}` : k;
    const child = obj[k];
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      Object.assign(out, flattenObject(child, next));
    } else {
      out[next] = Array.isArray(child) ? JSON.stringify(child) : String(child);
    }
  });
  return out;
}

function renderHighlightedPrettyJson(raw: string | undefined, changedTokens: string[]): JSX.Element[] {
  const pretty = prettyJson(raw);
  const lines = pretty.split('\n');
  return lines.map((line, idx) => {
    const highlighted = changedTokens.some((token) => line.includes(`"${token}"`));
    return (
      <div
        key={`${idx}-${line}`}
        style={highlighted ? { backgroundColor: 'rgba(255, 230, 0, 0.28)' } : undefined}
      >
        {line || ' '}
      </div>
    );
  });
}

export function AuditLogPage() {
  const { t } = useTranslation();
  const canExcelDownload = useHasMenuActionPermissionByPath('/log/audit', 'excel_download');
  const queryClient = useQueryClient();
  const gridRef = useRef<DataGridRef>(null);
  const [systemSubCd, setSystemSubCd] = useState<'BO' | 'OM' | ''>('BO');
  const [actionCode, setActionCode] = useState<'CREATE' | 'UPDATE' | 'DELETE' | ''>('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [compareTarget, setCompareTarget] = useState<AuditLogListRow | null>(null);

  const { data, isLoading } = useAuditLogList({
    systemSubCd: systemSubCd || undefined,
    actionCode: actionCode || undefined,
    keyword: keyword || undefined,
    fromTs: toIsoStart(appliedFromDate),
    toTs: toIsoNextDay(appliedToDate),
    page,
    size: pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const first = data?.first ?? page === 0;
  const last = data?.last ?? true;

  const columnDefs = useMemo<ColDef<AuditLogListRow>[]>(
    () => [
      {
        colId: 'rowNum',
        headerName: t('auditLog.col.rowNum'),
        width: 72,
        valueGetter: (params) => {
          const idx = params.node?.rowIndex ?? 0;
          return total > 0 ? total - page * pageSize - idx : undefined;
        },
        cellStyle: { textAlign: 'center' },
      },
      { field: 'actedAt', headerName: t('auditLog.col.actedAt'), width: 170, cellStyle: { textAlign: 'center' } },
      { field: 'systemSubCd', headerName: t('auditLog.col.systemSubCd'), width: 90, cellStyle: { textAlign: 'center' } },
      { field: 'menuNameKo', headerName: t('auditLog.col.menuNameKo'), minWidth: 150, flex: 1 },
      { field: 'actionNameKo', headerName: t('auditLog.col.actionNameKo'), width: 100, cellStyle: { textAlign: 'center' } },
      { field: 'actorUserId', headerName: t('auditLog.col.actorUserId'), width: 130, cellStyle: { textAlign: 'center' } },
      { field: 'entityId', headerName: t('auditLog.col.entityId'), minWidth: 180, flex: 1 },
      {
        field: 'changedFields',
        headerName: t('auditLog.col.changedFields'),
        minWidth: 220,
        flex: 1.2,
        valueFormatter: (p) => formatChangedFields((p.value as string) || ''),
      },
      {
        colId: 'dataCompare',
        headerName: t('auditLog.col.dataCompare'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<AuditLogListRow>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <button
              type="button"
              className="p-0 border-0 bg-transparent d-inline-flex align-items-center"
              onClick={() => setCompareTarget(row)}
            >
              <span className="badge badge-phoenix badge-phoenix-info d-inline-flex align-items-center">
                {t('auditLog.dataView')}
              </span>
            </button>
          );
        },
      },
    ],
    [t, total, page, pageSize],
  );

  const applySearch = () => {
    setKeyword(keywordInput.trim());
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setPage(0);
  };

  const resetSearch = () => {
    setSystemSubCd('BO');
    setActionCode('');
    setKeywordInput('');
    setKeyword('');
    setFromDate('');
    setToDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setPage(0);
  };

  const reloadAuditList = () => {
    void queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
  };

  const exportAuditList = () => {
    if (!canExcelDownload) return;
    gridRef.current?.exportExcel();
  };

  const compareRows = useMemo(() => {
    if (!compareTarget) return [];
    const beforeObj = safeParse(compareTarget.beforeData);
    const afterObj = safeParse(compareTarget.afterData);
    const beforeMap = flattenObject(beforeObj);
    const afterMap = flattenObject(afterObj);
    const keys = Array.from(new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]));
    keys.sort();
    return keys.map((k) => {
      const before = beforeMap[k] ?? '';
      const after = afterMap[k] ?? '';
      return { key: k, before, after, changed: before !== after };
    });
  }, [compareTarget]);

  const changedKeyTokens = useMemo(() => {
    const tokens = new Set<string>();
    compareRows
      .filter((r) => r.changed)
      .forEach((r) => {
        const parts = r.key.split('.');
        const last = parts[parts.length - 1]?.trim();
        if (last) tokens.add(last);
      });
    return Array.from(tokens);
  }, [compareRows]);

  const toolbar = (
    <div className="d-flex align-items-center justify-content-between gap-2 flex-grow-1 flex-wrap w-100">
      <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap orders-filter-row">
        <div className="input-group input-group-sm orders-search-group flex-grow-1" style={{ minWidth: 220 }}>
          <span className="input-group-text orders-toolbar-addon">
            <FiFilter size={16} className="orders-filter-icon" aria-hidden />
          </span>
          <input
            type="text"
            className="form-control form-control-sm orders-search-keyword"
            style={{ minWidth: 0 }}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
            placeholder={t('auditLog.filter.keywordPlaceholder')}
          />
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 100 }}
            value={systemSubCd}
            onChange={(e) => setSystemSubCd((e.target.value as 'BO' | 'OM' | '') || '')}
          >
            <option value="BO">BO</option>
            <option value="OM">OM</option>
          </select>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 120 }}
            value={actionCode}
            onChange={(e) => setActionCode((e.target.value as 'CREATE' | 'UPDATE' | 'DELETE' | '') || '')}
          >
            <option value="">{t('auditLog.filter.allActions')}</option>
            <option value="CREATE">{t('auditLog.filter.create')}</option>
            <option value="UPDATE">{t('auditLog.filter.update')}</option>
            <option value="DELETE">{t('auditLog.filter.delete')}</option>
          </select>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ maxWidth: 140 }}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="input-group-text orders-toolbar-addon">~</span>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ maxWidth: 140 }}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center orders-search-btn"
            onClick={applySearch}
          >
            <FiSearch size={16} className="me-1" aria-hidden />
            {t('common.search')}
          </button>
          <button
            type="button"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center orders-search-btn"
            onClick={resetSearch}
          >
            <FiRotateCcw size={16} className="me-1" aria-hidden />
            {t('common.all')}
          </button>
        </div>
      </div>
      <div className="d-flex align-items-center gap-1 flex-shrink-0">
        <button
          type="button"
          className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
          onClick={exportAuditList}
          title={t('grid.exportExcel')}
          aria-label={t('grid.exportExcel')}
          disabled={!canExcelDownload}
        >
          <FiDownload size={14} className="me-1" aria-hidden />
          {t('grid.exportExcel')}
        </button>
        <button
          type="button"
          className="btn btn-phoenix-primary btn-sm d-inline-flex align-items-center"
          onClick={reloadAuditList}
          title={t('auditLog.reloadList')}
          aria-label={t('auditLog.reloadList')}
        >
          <FiRefreshCw size={14} className="me-1" aria-hidden />
          {t('auditLog.reloadList')}
        </button>
      </div>
    </div>
  );

  return (
    <PageLayout title={t('auditLog.title')} showHeaderRefresh={false}>
      <DataGrid<AuditLogListRow>
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={items}
        loading={isLoading}
        pagination={false}
        showExportButton={false}
        exportFileName="audit_logs"
        toolbar={toolbar}
        defaultColDef={{ sortable: false, resizable: true }}
        footer={
          <DataGridPaginationFooter
            total={total}
            page={page}
            pageSize={pageSize}
            pageSizeOptions={[50, 100, 500]}
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
        getRowId={(params) => String(params.data?.id ?? '')}
      />

      {compareTarget && (
        <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="audit-compare-title">
          <div className="product-modal" style={{ maxWidth: '1200px', minHeight: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="product-modal__header">
              <h3 id="audit-compare-title">{t('auditLog.compareTitle')}</h3>
              <button type="button" className="product-modal__close" onClick={() => setCompareTarget(null)} aria-label={t('common.close')}>
                ×
              </button>
            </div>
            <div className="product-modal__body">
              <div className="border rounded p-2 mb-3">
                <div className="fw-semibold mb-2">{t('auditLog.changedKeys')}</div>
                <div className="d-flex flex-wrap gap-1">
                  {compareRows.filter((r) => r.changed).length === 0 ? (
                    <span className="text-body-tertiary small">-</span>
                  ) : (
                    compareRows
                      .filter((r) => r.changed)
                      .map((r) => (
                        <span key={r.key} className="badge badge-phoenix badge-phoenix-warning">
                          {r.key}
                        </span>
                      ))
                  )}
                </div>
              </div>

              <div className="row g-2">
                <div className="col-md-6">
                  <div className="border rounded p-2">
                    <div className="fw-semibold mb-2">{t('auditLog.beforeData')}</div>
                    <pre className="mb-0 small p-2 rounded border bg-white" style={{ maxHeight: '460px', overflow: 'auto' }}>
                      {renderHighlightedPrettyJson(compareTarget.beforeData, changedKeyTokens)}
                    </pre>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-2">
                    <div className="fw-semibold mb-2">{t('auditLog.afterData')}</div>
                    <pre className="mb-0 small p-2 rounded border bg-white" style={{ maxHeight: '460px', overflow: 'auto' }}>
                      {renderHighlightedPrettyJson(compareTarget.afterData, changedKeyTokens)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            <div className="product-modal__footer product-modal__footer--compact">
              <button type="button" className="btn btn-phoenix-secondary btn-sm" onClick={() => setCompareTarget(null)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
