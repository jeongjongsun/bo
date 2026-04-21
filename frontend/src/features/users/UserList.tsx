import { useCallback, useMemo, useState } from 'react';
import type { ColDef, ICellRendererParams, CellValueChangedEvent } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiFilter, FiPlus, FiRotateCcw, FiSearch } from 'react-icons/fi';
import { DataGrid, DataGridPaginationFooter } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { UserManageRow } from '@/api/usersManage';
import { downloadUsersExport } from '@/api/usersManage';
import { useAuthGroupOptions, useUpdateUserField, useUserGradeOptions, useUserManageList } from './hooks';
import { UserRegisterModal } from './UserRegisterModal';
import { UserEditModal } from './UserEditModal';

const STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'LOCKED'] as const;

export function UserList() {
  const { t, i18n } = useTranslation();
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [gradeInput, setGradeInput] = useState('');
  const [appliedGradeCd, setAppliedGradeCd] = useState('');
  const [authInput, setAuthInput] = useState('');
  const [appliedAuthGroup, setAppliedAuthGroup] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';

  const { data: gradeCodes = [] } = useUserGradeOptions(lang);

  const { data: authGroups = [] } = useAuthGroupOptions();

  const { data, isLoading } = useUserManageList({
    keyword: appliedKeyword || undefined,
    gradeCd: appliedGradeCd || undefined,
    authGroup: appliedAuthGroup || undefined,
    page,
    size: pageSize,
    lang,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const first = data?.first ?? page === 0;
  const last = data?.last ?? true;

  const { mutate: updateField } = useUpdateUserField();

  const gradeCdList = useMemo(() => gradeCodes.map((c) => c.subCd).filter(Boolean), [gradeCodes]);
  const authCdList = useMemo(() => authGroups.map((a) => a.authGroupCd).filter(Boolean), [authGroups]);

  const gradeLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    gradeCodes.forEach((c) => {
      if (c.subCd) m.set(c.subCd, c.codeNm || c.subCd);
    });
    return m;
  }, [gradeCodes]);

  const authLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    authGroups.forEach((a) => m.set(a.authGroupCd, a.authGroupNm || a.authGroupCd));
    return m;
  }, [authGroups]);

  const applySearch = useCallback(() => {
    setAppliedKeyword(keywordInput.trim());
    setAppliedGradeCd(gradeInput.trim());
    setAppliedAuthGroup(authInput.trim());
    setPage(0);
  }, [keywordInput, gradeInput, authInput]);

  const showAll = useCallback(() => {
    setKeywordInput('');
    setAppliedKeyword('');
    setGradeInput('');
    setAppliedGradeCd('');
    setAuthInput('');
    setAppliedAuthGroup('');
    setPage(0);
  }, []);

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<UserManageRow>) => {
      const { data, colDef, newValue } = event;
      if (!data || !colDef.field) return;
      const field = colDef.field as 'userNm' | 'emailId' | 'gradeCd' | 'authGroup' | 'userStatus';
      if (field === 'userNm') {
        const v = newValue == null ? '' : String(newValue).trim();
        if (!v) {
          event.api.undoCellEditing();
          return;
        }
      }
      if (field === 'emailId') {
        const v = newValue == null ? '' : String(newValue).trim();
        if (!v) {
          event.api.undoCellEditing();
          return;
        }
      }
      updateField(
        { userId: data.userId, field, value: newValue },
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

  const handleExport = useCallback(async () => {
    try {
      await downloadUsersExport(
        appliedKeyword || undefined,
        appliedGradeCd || undefined,
        appliedAuthGroup || undefined,
        lang,
      );
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    }
  }, [appliedKeyword, appliedGradeCd, appliedAuthGroup, lang, t]);

  const columnDefs = useMemo<ColDef<UserManageRow>[]>(
    () => [
      {
        colId: 'rowNum',
        headerName: t('users.col.rowNum'),
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
        field: 'userId',
        headerName: t('users.col.userId'),
        width: 130,
        pinned: 'left',
        sortable: false,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<UserManageRow>) => {
          const id = params.value ?? '';
          const row = params.data;
          if (!row || !id) return id;
          return (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary text-decoration-underline"
              onClick={() => setEditUserId(id)}
            >
              {id}
            </button>
          );
        },
      },
      {
        field: 'userNm',
        headerName: t('users.col.userNm'),
        flex: 1,
        minWidth: 120,
        editable: true,
        sortable: false,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'emailId',
        headerName: t('users.col.emailId'),
        width: 200,
        editable: true,
        sortable: false,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'gradeCd',
        headerName: t('users.col.grade'),
        width: 120,
        editable: true,
        sortable: false,
        cellStyle: { textAlign: 'center' },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: gradeCdList },
        valueFormatter: (p) => {
          const v = p.value as string | null | undefined;
          if (!v) return '';
          return gradeLabelMap.get(v) ?? p.data?.gradeNm ?? v;
        },
      },
      {
        field: 'authGroup',
        headerName: t('users.col.authGroup'),
        width: 140,
        editable: authCdList.length > 0,
        sortable: false,
        cellStyle: { textAlign: 'center' },
        cellEditor: authCdList.length > 0 ? 'agSelectCellEditor' : undefined,
        cellEditorParams: authCdList.length > 0 ? { values: authCdList } : undefined,
        valueFormatter: (p) => {
          const v = p.value as string | null | undefined;
          if (!v) return '';
          return authLabelMap.get(v) ?? p.data?.authGroupNm ?? v;
        },
      },
      {
        field: 'userStatus',
        headerName: t('users.col.userStatus'),
        width: 110,
        editable: true,
        sortable: false,
        cellStyle: { textAlign: 'center' },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: [...STATUS_VALUES] },
        valueFormatter: (p) => {
          const v = p.value as string | null | undefined;
          if (!v) return '';
          const key = `users.statusLabels.${v}`;
          const translated = t(key);
          return translated !== key ? translated : v;
        },
      },
      {
        field: 'lastLoginDtm',
        headerName: t('users.col.lastLoginDtm'),
        width: 170,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'createdAt',
        headerName: t('users.col.createdAt'),
        width: 170,
        sortable: false,
        cellStyle: { textAlign: 'center' },
      },
    ],
    [t, total, page, pageSize, gradeCdList, authCdList, gradeLabelMap, authLabelMap],
  );

  const toolbar = (
    <div className="d-flex align-items-center justify-content-between gap-2 flex-grow-1 flex-wrap w-100">
      <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap orders-filter-row">
        <div className="input-group input-group-sm orders-search-group flex-grow-1" style={{ minWidth: 280 }}>
          <span className="input-group-text orders-toolbar-addon" id="users-search-filter-addon">
            <FiFilter size={16} className="orders-filter-icon" aria-hidden />
          </span>
          <input
            type="text"
            className="form-control form-control-sm orders-search-keyword"
            placeholder={t('users.searchPlaceholder')}
            aria-label={t('users.searchPlaceholder')}
            aria-describedby="users-search-btn-addon"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
          />
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 140 }}
            aria-label={t('users.filter.grade')}
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
          >
            <option value="">{t('users.filter.allGrades')}</option>
            {gradeCodes.map((c) => (
              <option key={c.subCd} value={c.subCd}>
                {c.codeNm || c.subCd}
              </option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 160 }}
            aria-label={t('users.filter.authGroup')}
            value={authInput}
            onChange={(e) => setAuthInput(e.target.value)}
          >
            <option value="">{t('users.filter.allAuthGroups')}</option>
            {authGroups.map((a) => (
              <option key={a.authGroupCd} value={a.authGroupCd}>
                {a.authGroupNm}
              </option>
            ))}
          </select>
          <button
            type="button"
            id="users-search-btn-addon"
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
        <button
          type="button"
          className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
          onClick={() => setRegisterOpen(true)}
          title={t('users.toolbar.register')}
        >
          <FiPlus size={14} className="me-1" aria-hidden />
          {t('users.toolbar.register')}
        </button>
        <button
          type="button"
          className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
          onClick={handleExport}
          title={t('users.toolbar.excelDownload')}
        >
          <FiDownload size={14} className="me-1" aria-hidden />
          {t('users.toolbar.excelDownload')}
        </button>
      </div>
    </div>
  );

  return (
    <PageLayout title={t('users.title')} showHeaderRefresh={false}>
      {registerOpen && <UserRegisterModal onClose={() => setRegisterOpen(false)} />}
      {editUserId && (
        <UserEditModal userId={editUserId} onClose={() => setEditUserId(null)} onSuccess={() => setEditUserId(null)} />
      )}
      <DataGrid<UserManageRow>
        columnDefs={columnDefs}
        rowData={items}
        loading={isLoading}
        pagination={false}
        exportFileName="users"
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
        getRowId={(params) => params.data?.userId ?? ''}
        onCellValueChanged={handleCellValueChanged}
      />
    </PageLayout>
  );
}
