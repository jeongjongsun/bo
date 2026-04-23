import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsFolder2, BsFolder2Open } from 'react-icons/bs';
import { PageLayout } from '@/components/layout/PageLayout';
import { fetchCodeList } from '@/api/codes';
import type { MenuManageRow } from '@/api/menuManage';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useHasMenuActionPermissionByPath } from '@/hooks/useActionPermission';
import { confirm } from '@/utils/swal';
import { showError, showSuccess } from '@/utils/swal';
import { useCreateMenu, useDeleteMenu, useMenuTree, useUpdateMenu } from './hooks';

type TreeNode = { row: MenuManageRow; children: TreeNode[] };

function buildTree(rows: MenuManageRow[]): TreeNode[] {
  const byParent = new Map<string | null, MenuManageRow[]>();
  for (const r of rows) {
    const p = r.parentMenuId ?? null;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(r);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => {
      const d = (a.dispSeq ?? 0) - (b.dispSeq ?? 0);
      return d !== 0 ? d : a.menuId.localeCompare(b.menuId);
    });
  }
  const walk = (parent: string | null): TreeNode[] =>
    (byParent.get(parent) ?? []).map((row) => ({ row, children: walk(row.menuId) }));
  return walk(null);
}

interface MenuFormState {
  menuNmKo: string;
  menuNmEn: string;
  menuNmJa: string;
  menuNmVi: string;
  menuUrl: string;
  isActive: boolean;
  icon: string;
  dispSeq: number;
  menuType: 'GROUP' | 'PAGE';
}

function emptyForm(): MenuFormState {
  return {
    menuNmKo: '',
    menuNmEn: '',
    menuNmJa: '',
    menuNmVi: '',
    menuUrl: '',
    isActive: true,
    icon: '',
    dispSeq: 0,
    menuType: 'PAGE',
  };
}

function rowToForm(r: MenuManageRow): MenuFormState {
  const mt = r.menuType === 'GROUP' || r.menuType === 'PAGE' ? r.menuType : r.menuUrl ? 'PAGE' : 'GROUP';
  return {
    menuNmKo: r.menuNmKo ?? '',
    menuNmEn: r.menuNmEn ?? '',
    menuNmJa: r.menuNmJa ?? '',
    menuNmVi: r.menuNmVi ?? '',
    menuUrl: r.menuUrl ?? '',
    isActive: r.isActive !== false,
    icon: r.icon ?? '',
    dispSeq: r.dispSeq ?? 0,
    menuType: mt,
  };
}

/** Bs 뷰박스 16 기준 — 닫힘/열림 실루엣 차이가 Material 폴더 쌍보다 큼 */
const TREE_FOLDER_ICON_SIZE = 18;

function TreePrefix({
  depth,
  hasChildren,
  isHidden,
  expandLabel,
  collapseLabel,
  onToggleBranch,
}: {
  depth: number;
  hasChildren: boolean;
  isHidden: boolean;
  expandLabel: string;
  collapseLabel: string;
  onToggleBranch: () => void;
}) {
  const isRoot = depth === 0;
  const folderClosed = <BsFolder2 size={TREE_FOLDER_ICON_SIZE} aria-hidden />;
  const folderOpen = <BsFolder2Open size={TREE_FOLDER_ICON_SIZE} aria-hidden />;

  if (hasChildren) {
    return (
      <button
        type="button"
        className="menu-tree__prefix-btn"
        aria-expanded={!isHidden}
        title={isHidden ? expandLabel : collapseLabel}
        onClick={(e) => {
          e.stopPropagation();
          onToggleBranch();
        }}
      >
        {isHidden ? folderClosed : folderOpen}
      </button>
    );
  }

  if (isRoot) {
    return <span className="menu-tree__prefix">{folderClosed}</span>;
  }

  return (
    <span className="menu-tree__prefix menu-tree__bullet-wrap" aria-hidden>
      <span className="menu-tree__bullet" />
    </span>
  );
}

function TreeBranch({
  nodes,
  selectedId,
  onSelect,
  depth,
}: {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (row: MenuManageRow) => void;
  depth: number;
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const listClass = `list-unstyled mb-0${depth > 0 ? ' mt-1 ps-3' : ''}`;

  const toggleBranch = (menuId: string) => {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(menuId)) n.delete(menuId);
      else n.add(menuId);
      return n;
    });
  };

  return (
    <ul className={listClass}>
      {nodes.map(({ row, children }) => {
        const hasChildren = children.length > 0;
        const isHidden = collapsed.has(row.menuId);
        const isSel = selectedId === row.menuId;
        const displayTitle = row.menuNmKo?.trim() ? row.menuNmKo.trim() : row.menuId;
        const showCodeSubline = Boolean(row.menuNmKo?.trim());
        return (
          <li key={row.menuId} className="mb-1">
            <div className="d-flex align-items-center gap-1">
              <TreePrefix
                depth={depth}
                hasChildren={hasChildren}
                isHidden={isHidden}
                expandLabel={t('menuManage.expand')}
                collapseLabel={t('menuManage.collapse')}
                onToggleBranch={() => toggleBranch(row.menuId)}
              />
              <button
                type="button"
                className={`menu-tree-row-btn btn btn-sm text-start flex-grow-1 rounded-1 d-flex flex-column align-items-stretch gap-0 py-2 ${
                  isSel ? 'btn-primary' : 'btn-outline-secondary border-0'
                }`}
                onClick={() => onSelect(row)}
              >
                <span
                  className={`menu-tree-row__title fw-medium lh-sm text-break ${
                    isSel ? 'text-white' : 'text-body'
                  }`}
                >
                  {displayTitle}
                  {children.length > 0 ? ` (${children.length})` : ''}
                </span>
                {showCodeSubline && (
                  <span
                    className={`menu-tree-row__code font-monospace small lh-sm text-break ${
                      isSel ? 'text-white' : 'text-body-secondary'
                    }`}
                    style={isSel ? { opacity: 0.88 } : undefined}
                  >
                    {row.menuId}
                  </span>
                )}
              </button>
            </div>
            {hasChildren && !isHidden && (
              <TreeBranch nodes={children} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** 읽기 전용·자동부여 필드 (편집 폼과 시각적 구분) */
const READONLY_FLOATING_CONTROL = 'form-control bg-body-secondary';

export function MenuManagePage() {
  const { t, i18n } = useTranslation();
  const canCreate = useHasMenuActionPermissionByPath('/system/menus', 'create');
  const canUpdate = useHasMenuActionPermissionByPath('/system/menus', 'update');
  const canDelete = useHasMenuActionPermissionByPath('/system/menus', 'delete');
  const formDomId = useId();
  const fieldId = (name: string) => `${formDomId}-${name}`;
  const [systemOptions, setSystemOptions] = useState<{ subCd: string; codeNm: string }[]>([]);
  const [systemSubCd, setSystemSubCd] = useState('BO');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [parentForCreate, setParentForCreate] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormState>(emptyForm());

  const { data: rows = [], isLoading, isError, error } = useMenuTree(systemSubCd);
  const tree = useMemo(() => buildTree(rows), [rows]);
  const { mutateAsync: createMut, isPending: creating } = useCreateMenu();
  const { mutateAsync: updateMut, isPending: updating } = useUpdateMenu();
  const { mutateAsync: deleteMut, isPending: deleting } = useDeleteMenu();

  useEffect(() => {
    const lang = i18n.language?.slice(0, 2) || 'ko';
    void fetchCodeList('SYSTEM', lang)
      .then((list) => setSystemOptions(list.map((x) => ({ subCd: x.subCd, codeNm: x.codeNm }))))
      .catch(() => setSystemOptions([]));
  }, [i18n.language]);

  useEffect(() => {
    if (isError && error) {
      showError(t('common.error'), getApiErrorMessage(error, t('common.error'), t));
    }
  }, [isError, error, t]);

  const selectedRow = useMemo(
    () => (selectedId ? rows.find((r) => r.menuId === selectedId) ?? null : null),
    [rows, selectedId],
  );

  const applyRowToForm = useCallback((r: MenuManageRow) => {
    setForm(rowToForm(r));
  }, []);

  const handleSelectRow = useCallback(
    (r: MenuManageRow) => {
      setIsCreating(false);
      setSelectedId(r.menuId);
      applyRowToForm(r);
    },
    [applyRowToForm],
  );

  const handleAddChild = useCallback(() => {
    if (!canCreate) return;
    if (!selectedId) {
      showError(t('common.error'), t('menuManage.selectHint'));
      return;
    }
    setIsCreating(true);
    setParentForCreate(selectedId);
    setForm(emptyForm());
  }, [canCreate, selectedId, t]);

  const handleAddRoot = useCallback(() => {
    if (!canCreate) return;
    setIsCreating(true);
    setParentForCreate(null);
    setSelectedId(null);
    setForm(emptyForm());
  }, [canCreate]);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setParentForCreate(null);
    if (selectedRow) {
      applyRowToForm(selectedRow);
    } else {
      setForm(emptyForm());
    }
  }, [selectedRow, applyRowToForm]);

  const buildPayload = useCallback(() => {
    return {
      menuNmKo: form.menuNmKo.trim(),
      menuNmEn: form.menuNmEn.trim() || undefined,
      menuNmJa: form.menuNmJa.trim() || undefined,
      menuNmVi: form.menuNmVi.trim() || undefined,
      menuUrl: form.menuUrl.trim() || null,
      isActive: form.isActive,
      icon: form.icon.trim() || null,
      dispSeq: form.dispSeq,
      menuType: form.menuType,
    };
  }, [form]);

  const handleSaveAndContinue = useCallback(async () => {
    const payload = buildPayload();
    if (!payload.menuNmKo) {
      showError(t('common.error'), t('menus.menu_nm_ko_required'));
      return;
    }
    try {
      if (isCreating) {
        if (!canCreate) return;
        await createMut({
          systemMainCd: 'SYSTEM',
          systemSubCd,
          parentMenuId: parentForCreate,
          ...payload,
        });
        await showSuccess(t('menuManage.created'));
        setForm(emptyForm());
        setIsCreating(true);
        /* parentForCreate 유지 — 연속 하위 등록 */
      } else if (selectedId) {
        if (!canUpdate) return;
        await updateMut({ menuId: selectedId, body: payload, systemSubCd });
        await showSuccess(t('menuManage.saved'));
      }
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    }
  }, [
    buildPayload,
    canCreate,
    canUpdate,
    createMut,
    isCreating,
    parentForCreate,
    selectedId,
    systemSubCd,
    t,
    updateMut,
  ]);

  const handleDeleteMenu = useCallback(async () => {
    if (!canDelete) return;
    if (!selectedId || isCreating) return;
    const ok = await confirm(
      t('common.delete'),
      t('menuManage.deleteConfirm'),
      { icon: 'warning', confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel') },
    );
    if (!ok) return;
    try {
      await deleteMut({ menuId: selectedId, systemSubCd });
      await showSuccess(t('menuManage.deleted'));
      setSelectedId(null);
      setIsCreating(false);
      setParentForCreate(null);
      setForm(emptyForm());
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    }
  }, [canDelete, selectedId, isCreating, t, deleteMut, systemSubCd]);

  const busy = creating || updating || deleting;

  return (
    <PageLayout title={t('menuManage.title')} className="menu-manage-page" showHeaderRefresh={false}>
      <div className="menu-manage-page__controls d-flex flex-wrap align-items-center gap-2">
        <select
          className="form-select form-select-sm w-auto"
          value={systemSubCd}
          onChange={(e) => {
            setSystemSubCd(e.target.value);
            setSelectedId(null);
            setIsCreating(false);
            setParentForCreate(null);
            setForm(emptyForm());
          }}
        >
          {systemOptions.length === 0 ? (
            <>
              <option value="BO">BO</option>
              <option value="OM">OM</option>
            </>
          ) : (
            systemOptions.map((o) => (
              <option key={o.subCd} value={o.subCd}>
                {o.codeNm} ({o.subCd})
              </option>
            ))
          )}
        </select>
      </div>

      <div className="row gx-3 gy-0 menu-manage-page__cards-row">

        <div className="col-lg-4 col-md-5">
          <div className="card shadow-none border border-secondary-subtle h-100">
            <div className="card-header bg-light-subtle border-secondary-subtle py-2 d-flex justify-content-between align-items-center">
              <span className="fw-semibold">{t('menuManage.treeTitle')}</span>
              {isLoading && <span className="spinner-border spinner-border-sm" role="status" />}
            </div>
            <div
              className="card-body overflow-auto menu-manage-page__tree-body"
              style={{ minHeight: 0 }}
            >
              {tree.length === 0 && !isLoading ? (
                <p className="text-body-tertiary small mb-0">{t('menuManage.selectHint')}</p>
              ) : (
                <TreeBranch nodes={tree} selectedId={selectedId} onSelect={handleSelectRow} depth={0} />
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8 col-md-7">
          <div className="card shadow-none border border-secondary-subtle h-100">
            <div className="card-header bg-light-subtle border-secondary-subtle py-2">
              <span className="fw-semibold">
                {isCreating ? t('menuManage.newMenuTitle') : t('menuManage.detailTitle')}
              </span>
            </div>
            <div className="card-body overflow-auto menu-manage-page__detail-body" style={{ minHeight: 0 }}>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {canCreate && (
                  <button type="button" className="btn btn-phoenix-secondary btn-sm" onClick={handleAddChild}>
                    {t('menuManage.addChild')}
                  </button>
                )}
                {canCreate && (
                  <button type="button" className="btn btn-phoenix-secondary btn-sm" onClick={handleAddRoot}>
                    {t('menuManage.addRoot')}
                  </button>
                )}
                {isCreating && (
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCancelCreate}>
                    {t('common.cancel')}
                  </button>
                )}
              </div>

              {!isCreating && !selectedId ? (
                <p className="text-body-tertiary mb-0">{t('menuManage.selectHint')}</p>
              ) : (
                <form
                  className="row g-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSaveAndContinue();
                  }}
                >
                  <div className="col-12 col-md-6">
                    <div className="form-floating mb-2">
                      <input
                        id={fieldId('menuId')}
                        type="text"
                        className={READONLY_FLOATING_CONTROL}
                        readOnly
                        tabIndex={-1}
                        value={isCreating ? t('menuManage.menuIdAuto') : (selectedId ?? '')}
                        placeholder=" "
                      />
                      <label htmlFor={fieldId('menuId')}>{t('menuManage.menuId')}</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="form-floating mb-2">
                      <input
                        id={fieldId('parentMenuId')}
                        type="text"
                        className={READONLY_FLOATING_CONTROL}
                        readOnly
                        tabIndex={-1}
                        value={(isCreating ? parentForCreate : selectedRow?.parentMenuId) ?? t('menuManage.parentNone')}
                        placeholder=" "
                      />
                      <label htmlFor={fieldId('parentMenuId')}>{t('menuManage.parentMenuId')}</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="form-floating mb-2 required">
                      <input
                        id={fieldId('menuNmKo')}
                        type="text"
                        className="form-control"
                        value={form.menuNmKo}
                        onChange={(e) => setForm((f) => ({ ...f, menuNmKo: e.target.value }))}
                        placeholder=" "
                        required
                        autoComplete="off"
                        disabled={!isCreating && !canUpdate}
                      />
                      <label htmlFor={fieldId('menuNmKo')}>
                        {t('menuManage.menuNmKo')}
                        <span className="text-primary ms-1" aria-hidden="true">
                          *
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="form-floating mb-2">
                      <input
                        id={fieldId('menuNmEn')}
                        type="text"
                        className="form-control"
                        value={form.menuNmEn}
                        onChange={(e) => setForm((f) => ({ ...f, menuNmEn: e.target.value }))}
                        placeholder=" "
                        autoComplete="off"
                        disabled={!isCreating && !canUpdate}
                      />
                      <label htmlFor={fieldId('menuNmEn')}>{t('menuManage.menuNmEn')}</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="form-floating mb-2">
                      <input
                        id={fieldId('menuNmJa')}
                        type="text"
                        className="form-control"
                        value={form.menuNmJa}
                        onChange={(e) => setForm((f) => ({ ...f, menuNmJa: e.target.value }))}
                        placeholder=" "
                        autoComplete="off"
                        disabled={!isCreating && !canUpdate}
                      />
                      <label htmlFor={fieldId('menuNmJa')}>{t('menuManage.menuNmJa')}</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="form-floating mb-2">
                      <input
                        id={fieldId('menuNmVi')}
                        type="text"
                        className="form-control"
                        value={form.menuNmVi}
                        onChange={(e) => setForm((f) => ({ ...f, menuNmVi: e.target.value }))}
                        placeholder=" "
                        autoComplete="off"
                        disabled={!isCreating && !canUpdate}
                      />
                      <label htmlFor={fieldId('menuNmVi')}>{t('menuManage.menuNmVi')}</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-floating mb-2">
                      <input
                        id={fieldId('menuUrl')}
                        type="text"
                        className="form-control"
                        value={form.menuUrl}
                        onChange={(e) => setForm((f) => ({ ...f, menuUrl: e.target.value }))}
                        placeholder=" "
                        autoComplete="off"
                        disabled={!isCreating && !canUpdate}
                      />
                      <label htmlFor={fieldId('menuUrl')}>{t('menuManage.menuUrl')}</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="form-floating mb-2">
                      <select
                        id={fieldId('menuType')}
                        className="form-select"
                        value={form.menuType}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, menuType: e.target.value === 'GROUP' ? 'GROUP' : 'PAGE' }))
                        }
                        aria-label={t('menuManage.menuType')}
                        disabled={!isCreating && !canUpdate}
                      >
                        <option value="PAGE">{t('menuManage.menuTypePage')}</option>
                        <option value="GROUP">{t('menuManage.menuTypeGroup')}</option>
                      </select>
                      <label htmlFor={fieldId('menuType')}>{t('menuManage.menuType')}</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="form-floating mb-2">
                      <input
                        id={fieldId('dispSeq')}
                        type="number"
                        className="form-control"
                        value={form.dispSeq}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dispSeq: Number.parseInt(e.target.value, 10) || 0 }))
                        }
                        placeholder=" "
                        min={0}
                        disabled={!isCreating && !canUpdate}
                      />
                      <label htmlFor={fieldId('dispSeq')}>{t('menuManage.dispSeq')}</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="form-floating mb-2">
                      <input
                        id={fieldId('icon')}
                        type="text"
                        className="form-control"
                        value={form.icon}
                        onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                        placeholder=" "
                        autoComplete="off"
                        disabled={!isCreating && !canUpdate}
                      />
                      <label htmlFor={fieldId('icon')}>{t('menuManage.icon')}</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={fieldId('isActive')}
                        checked={form.isActive}
                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                        disabled={!isCreating && !canUpdate}
                      />
                      <label className="form-check-label" htmlFor={fieldId('isActive')}>
                        {t('menuManage.isActive')}
                      </label>
                    </div>
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2">
                    {!isCreating && selectedId && (
                      <button
                        type="button"
                        className="btn btn-phoenix-danger btn-sm"
                        onClick={() => { void handleDeleteMenu(); }}
                        disabled={busy || !canDelete}
                      >
                        {t('common.delete')}
                      </button>
                    )}
                    <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={busy || (isCreating ? !canCreate : !canUpdate)}>
                      {isCreating ? t('menuManage.saveAndContinue') : t('menuManage.save')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
