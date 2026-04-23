import { useCallback, useMemo, useState } from 'react';
import type { ColDef, ICellRendererParams, CellValueChangedEvent } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiChevronRight, FiDownload, FiPlus, FiRotateCcw, FiSearch } from 'react-icons/fi';
import { DataGrid } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { CodeManageRow } from '@/api/codeManage';
import { fetchCodeDetails, downloadCodesExport, type CodeGridEditableField } from '@/api/codeManage';
import { useHasMenuActionPermissionByPath } from '@/hooks/useActionPermission';
import { useCodeManageGroups, useUpdateCodeField } from './hooks';
import { CodeEditModal } from './CodeEditModal';
import { CodeRegisterModal } from './CodeRegisterModal';
import { CodeChildRegisterModal } from './CodeChildRegisterModal';

/** 주문 그리드와 동일 계열; 대분류/하위 색 대비 강화 */
const CODE_KIND_BADGE_MAIN = 'badge badge-phoenix badge-phoenix-primary';
const CODE_KIND_BADGE_CHILD = 'badge badge-phoenix badge-phoenix-warning';
const ADD_CHILD_BADGE_CLASS = 'badge badge-phoenix badge-phoenix-secondary';

function mainCategoryDisplay(row: CodeManageRow): string {
  return row.rowType === 'MAIN' ? row.subCd : row.mainCd;
}

function subCodeDisplay(row: CodeManageRow): string {
  return row.rowType === 'MAIN' ? '' : row.subCd;
}

export function CommonCodeList() {
  const { t } = useTranslation();
  const canCreate = useHasMenuActionPermissionByPath('/system/common-code', 'create');
  const canUpdate = useHasMenuActionPermissionByPath('/system/common-code', 'update');
  const canExcelDownload = useHasMenuActionPermissionByPath('/system/common-code', 'excel_download');
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [detailCache, setDetailCache] = useState<Map<string, CodeManageRow[]>>(() => new Map());
  const [registerOpen, setRegisterOpen] = useState(false);
  const [childRegisterParent, setChildRegisterParent] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<{ mainCd: string; subCd: string } | null>(null);

  const { data: groups = [], isLoading } = useCodeManageGroups(appliedKeyword || undefined);

  const { mutate: updateField } = useUpdateCodeField();

  const toggleExpand = useCallback(
    async (groupSubCd: string) => {
      if (expanded.has(groupSubCd)) {
        setExpanded((prev) => {
          const n = new Set(prev);
          n.delete(groupSubCd);
          return n;
        });
        return;
      }
      try {
        let rows = detailCache.get(groupSubCd);
        if (!rows) {
          rows = await fetchCodeDetails(groupSubCd);
          setDetailCache((m) => new Map(m).set(groupSubCd, rows!));
        }
        setExpanded((prev) => new Set(prev).add(groupSubCd));
      } catch (err) {
        showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
      }
    },
    [expanded, detailCache, t],
  );

  const openEdit = useCallback((row: CodeManageRow) => {
    setEditTarget({ mainCd: row.mainCd, subCd: row.subCd });
  }, []);

  const gridRows = useMemo(() => {
    const out: CodeManageRow[] = [];
    for (const g of groups) {
      out.push(g);
      if (expanded.has(g.subCd)) {
        out.push(...(detailCache.get(g.subCd) ?? []));
      }
    }
    return out;
  }, [groups, expanded, detailCache]);

  const applySearch = useCallback(() => {
    setAppliedKeyword(keywordInput.trim());
    setExpanded(new Set());
    setDetailCache(new Map());
  }, [keywordInput]);

  const showAll = useCallback(() => {
    setKeywordInput('');
    setAppliedKeyword('');
    setExpanded(new Set());
    setDetailCache(new Map());
  }, []);

  const handleExport = useCallback(async () => {
    try {
      await downloadCodesExport(appliedKeyword || undefined);
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    }
  }, [appliedKeyword, t]);

  const validateAndTrimTextField = useCallback((field: CodeGridEditableField, value: unknown) => {
    if (field !== 'codeNmKo' && field !== 'codeNmEn') {
      return value;
    }
    const trimmed = value == null ? '' : String(value).trim();
    return trimmed ? trimmed : null;
  }, []);

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<CodeManageRow>) => {
      if (!canUpdate) {
        event.api.undoCellEditing();
        return;
      }
      const { data, colDef, newValue, api } = event;
      if (!data || !colDef.field) return;
      const field = colDef.field as CodeGridEditableField;
      const validated = validateAndTrimTextField(field, newValue);
      if ((field === 'codeNmKo' || field === 'codeNmEn') && validated == null) {
        api.undoCellEditing();
        return;
      }
      let valueToSend: unknown = validated !== undefined ? validated : newValue;
      if (field === 'dispSeq') {
        const s = newValue == null ? '' : String(newValue).trim();
        valueToSend = s === '' ? null : Number.parseInt(s, 10);
        if (valueToSend !== null && Number.isNaN(valueToSend as number)) {
          api.undoCellEditing();
          return;
        }
      }
      if (field === 'useYn') {
        const yn = newValue == null ? '' : String(newValue).trim().toUpperCase();
        if (yn !== 'Y' && yn !== 'N') {
          api.undoCellEditing();
          return;
        }
        valueToSend = yn;
      }
      updateField(
        { mainCd: data.mainCd, subCd: data.subCd, field, value: valueToSend },
        {
          onError: (err) => {
            showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
            api.undoCellEditing();
          },
        },
      );
    },
    [canUpdate, updateField, validateAndTrimTextField, t],
  );

  const columnDefs = useMemo<ColDef<CodeManageRow>[]>(
    () => [
      {
        colId: 'addChild',
        headerName: t('commonCode.col.addChild'),
        width: 130,
        pinned: 'left',
        sortable: false,
        suppressSizeToFit: true,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<CodeManageRow>) => {
          const row = params.data;
          if (!row || row.rowType !== 'MAIN' || !canCreate) return '';
          return (
            <div className="d-flex justify-content-center align-items-center w-100 h-100 py-1">
              <a
                href="#"
                className={`${ADD_CHILD_BADGE_CLASS} text-decoration-none`}
                onClick={(e) => {
                  e.preventDefault();
                  setChildRegisterParent(row.subCd);
                }}
                title={t('commonCode.addChild')}
              >
                {t('commonCode.addChild')}
              </a>
            </div>
          );
        },
      },
      {
        colId: 'mainCategory',
        headerName: t('commonCode.col.mainCd'),
        width: 280,
        minWidth: 220,
        pinned: 'left',
        sortable: false,
        valueGetter: (p) => {
          if (!p.data || p.data.rowType === 'DETAIL') return '';
          return p.data.subCd;
        },
        cellRenderer: (params: ICellRendererParams<CodeManageRow>) => {
          const row = params.data;
          if (!row) return '';
          if (row.rowType === 'DETAIL') {
            return '';
          }
          const label = mainCategoryDisplay(row);
          const isOpen = expanded.has(row.subCd);
          return (
            <span className="d-inline-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className="p-0 m-0 border-0 bg-transparent text-body-secondary d-inline-flex align-items-center justify-content-center flex-shrink-0 lh-1"
                style={{ cursor: 'pointer' }}
                onClick={() => void toggleExpand(row.subCd)}
                title={isOpen ? t('commonCode.collapse') : t('commonCode.expand')}
                aria-expanded={isOpen}
                aria-label={isOpen ? t('commonCode.collapse') : t('commonCode.expand')}
              >
                {isOpen ? <FiChevronDown size={18} aria-hidden /> : <FiChevronRight size={18} aria-hidden />}
              </button>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-primary text-decoration-underline"
                onClick={() => openEdit(row)}
                disabled={!canUpdate}
              >
                {label}
              </button>
            </span>
          );
        },
      },
      {
        field: 'subCd',
        headerName: t('commonCode.col.subCd'),
        width: 220,
        minWidth: 180,
        sortable: false,
        valueGetter: (p) => (p.data ? subCodeDisplay(p.data) : ''),
        cellRenderer: (params: ICellRendererParams<CodeManageRow>) => {
          const row = params.data;
          if (!row || row.rowType === 'MAIN') return '';
          const v = row.subCd;
          return (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary text-decoration-underline"
              onClick={() => openEdit(row)}
              disabled={!canUpdate}
            >
              {v}
            </button>
          );
        },
      },
      {
        colId: 'codeKind',
        headerName: t('commonCode.col.codeKind'),
        width: 140,
        sortable: false,
        cellStyle: { textAlign: 'center' },
        valueGetter: (p) => (p.data?.rowType === 'MAIN' ? 'MAIN' : 'DETAIL'),
        cellRenderer: (params: ICellRendererParams<CodeManageRow>) => {
          const row = params.data;
          if (!row) return '';
          const isMain = row.rowType === 'MAIN';
          const badgeClass = isMain ? CODE_KIND_BADGE_MAIN : CODE_KIND_BADGE_CHILD;
          const text = isMain ? t('commonCode.kind.main') : t('commonCode.kind.child');
          return (
            <div className="d-flex justify-content-center align-items-center w-100 h-100 py-1">
              <span className={badgeClass}>{text}</span>
            </div>
          );
        },
      },
      {
        field: 'codeNmKo',
        headerName: t('commonCode.col.codeNmKo'),
        flex: 1,
        minWidth: 120,
        editable: canUpdate,
        sortable: false,
      },
      {
        field: 'codeNmEn',
        headerName: t('commonCode.col.codeNmEn'),
        flex: 1,
        minWidth: 120,
        editable: canUpdate,
        sortable: false,
      },
      {
        field: 'useYn',
        headerName: t('commonCode.col.useYn'),
        width: 100,
        editable: canUpdate,
        sortable: false,
        cellStyle: { textAlign: 'center' },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['Y', 'N'] },
      },
      {
        field: 'dispSeq',
        headerName: t('commonCode.col.dispSeq'),
        width: 100,
        editable: canUpdate,
        sortable: false,
        cellDataType: 'number',
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'etc1',
        headerName: t('commonCode.col.etc1'),
        width: 100,
        editable: canUpdate,
        sortable: false,
      },
      {
        field: 'etc2',
        headerName: t('commonCode.col.etc2'),
        width: 100,
        editable: canUpdate,
        sortable: false,
      },
      {
        field: 'createdAt',
        headerName: t('commonCode.col.createdAt'),
        width: 170,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
    ],
    [t, expanded, openEdit, toggleExpand, canCreate, canUpdate],
  );

  const toolbar = (
    <div className="d-flex align-items-center justify-content-between gap-2 flex-grow-1 flex-wrap w-100">
      <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-nowrap orders-filter-row">
        <div className="input-group input-group-sm orders-search-group">
          <span className="input-group-text orders-toolbar-addon">
            <FiSearch size={16} className="orders-filter-icon" aria-hidden />
          </span>
          <input
            type="text"
            className="form-control"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
            placeholder={t('commonCode.searchPlaceholder')}
            aria-label={t('commonCode.searchPlaceholder')}
          />
          <button
            type="button"
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
            title={t('users.toolbar.showAll')}
            aria-label={t('users.toolbar.showAll')}
          >
            <FiRotateCcw size={16} className="me-1" aria-hidden />
            {t('users.toolbar.showAll')}
          </button>
        </div>
      </div>
      <div className="d-flex align-items-center gap-1 flex-shrink-0">
        {canCreate && (
          <button
            type="button"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
            onClick={() => setRegisterOpen(true)}
          >
            <FiPlus size={14} className="me-1" aria-hidden />
            {t('commonCode.registerMain')}
          </button>
        )}
        {canExcelDownload && (
          <button
            type="button"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
            onClick={() => void handleExport()}
          >
            <FiDownload size={14} className="me-1" aria-hidden />
            {t('commonCode.exportExcel')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <PageLayout title={t('commonCode.title')} showHeaderRefresh={false}>
      {registerOpen && canCreate && <CodeRegisterModal onClose={() => setRegisterOpen(false)} />}
      {childRegisterParent && canCreate && (
        <CodeChildRegisterModal
          parentMainCd={childRegisterParent}
          onClose={() => setChildRegisterParent(null)}
          onRegistered={(parent) => {
            void fetchCodeDetails(parent)
              .then((rows) => {
                setDetailCache((prev) => {
                  if (!prev.has(parent)) return prev;
                  const next = new Map(prev);
                  next.set(parent, rows);
                  return next;
                });
              })
              .catch((err) => {
                console.error('[commonCode] refresh details after child register failed', parent, err);
                showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
              });
          }}
        />
      )}
      {editTarget && canUpdate && (
        <CodeEditModal mainCd={editTarget.mainCd} subCd={editTarget.subCd} onClose={() => setEditTarget(null)} />
      )}
      <DataGrid<CodeManageRow>
        columnDefs={columnDefs}
        rowData={gridRows}
        loading={isLoading}
        pagination={false}
        exportFileName="codes"
        showExportButton={false}
        toolbar={toolbar}
        defaultColDef={{ sortable: false, resizable: true }}
        getRowId={(params) => `${params.data?.rowType}:${params.data?.mainCd}:${params.data?.subCd}`}
        onCellValueChanged={handleCellValueChanged}
      />
    </PageLayout>
  );
}
