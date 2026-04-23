import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import { FiEye, FiPlus } from 'react-icons/fi';
import { DataGrid } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { FloatingRow } from '@/features/shipper/FloatingRow';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { confirm, showError, showSuccess } from '@/utils/swal';
import type { AuthGroupManageRow, AuthGroupMenuAuditRow, AuthGroupMenuPermission } from '@/api/authGroupManage';
import { useHasMenuActionPermissionByPath } from '@/hooks/useActionPermission';
import {
  useAuthGroupManageList,
  useAuthGroupMenuAudits,
  useAuthGroupMenuConfig,
  useCreateAuthGroup,
  useDeleteAuthGroup,
  useSaveAuthGroupMenus,
  useUpdateAuthGroup,
} from './hooks';

type MenuActionKey = 'canCreate' | 'canUpdate' | 'canDelete' | 'canExcelDownload' | 'canApprove';

const MENU_ACTIONS: Array<{ key: MenuActionKey; short: string; label: string }> = [
  { key: 'canCreate', short: 'C', label: '등록' },
  { key: 'canUpdate', short: 'U', label: '수정' },
  { key: 'canDelete', short: 'D', label: '삭제' },
  { key: 'canExcelDownload', short: 'X', label: '엑셀 다운로드' },
  { key: 'canApprove', short: 'A', label: '승인' },
];

function parseMenuIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

export function AuthGroupManagePage() {
  const { t } = useTranslation();
  const canCreate = useHasMenuActionPermissionByPath('/system/authorities', 'create');
  const canUpdate = useHasMenuActionPermissionByPath('/system/authorities', 'update');
  const canDelete = useHasMenuActionPermissionByPath('/system/authorities', 'delete');
  const { data: rows = [], isLoading, isError, error } = useAuthGroupManageList();
  const { mutateAsync: deleteMut, isPending: deleting } = useDeleteAuthGroup();
  const { mutateAsync: saveMut, isPending: saving } = useSaveAuthGroupMenus();
  const { mutateAsync: updateMut, isPending: updating } = useUpdateAuthGroup();
  const { mutateAsync: createMut, isPending: creating } = useCreateAuthGroup();

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerWasValidated, setRegisterWasValidated] = useState(false);
  const [regNm, setRegNm] = useState('');
  const [regRemark, setRegRemark] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editWasValidated, setEditWasValidated] = useState(false);
  const [editGroup, setEditGroup] = useState<AuthGroupManageRow | null>(null);
  const [editNm, setEditNm] = useState('');
  const [editRemark, setEditRemark] = useState('');

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logModalGroup, setLogModalGroup] = useState<AuthGroupManageRow | null>(null);
  const [logAuditPage, setLogAuditPage] = useState(0);
  const auditSize = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AuthGroupManageRow | null>(null);
  const [systemSubCd, setSystemSubCd] = useState<'OM' | 'BO'>('BO');
  const [selectedPermissions, setSelectedPermissions] = useState<Map<string, AuthGroupMenuPermission>>(new Map());
  const [permissionWasValidated, setPermissionWasValidated] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  const { data: menuConfig, isLoading: menuLoading, error: menuError } = useAuthGroupMenuConfig(
    selectedGroup?.authGroupCd ?? null,
    systemSubCd,
    modalOpen,
  );
  const { data: logAudits, isLoading: logAuditLoading } = useAuthGroupMenuAudits(
    logModalGroup?.authGroupCd ?? null,
    logAuditPage,
    auditSize,
    logModalOpen,
  );
  useEffect(() => {
    if (menuConfig?.selectedMenuPermissions) {
      const next = new Map<string, AuthGroupMenuPermission>();
      menuConfig.selectedMenuPermissions.forEach((item) => {
        next.set(item.menuId, { ...item });
      });
      setSelectedPermissions(next);
    } else {
      setSelectedPermissions(new Map());
    }
  }, [menuConfig?.selectedMenuPermissions, menuConfig?.authGroupCd, menuConfig?.systemSubCd]);

  useEffect(() => {
    if (isError && error) {
      showError(t('common.error'), getApiErrorMessage(error, t('common.error'), t));
    }
  }, [isError, error, t]);

  useEffect(() => {
    if (menuError) {
      showError(t('common.error'), getApiErrorMessage(menuError, t('common.error'), t));
    }
  }, [menuError, t]);

  const handleOpenPermissionModal = useCallback((row: AuthGroupManageRow) => {
    setSelectedGroup(row);
    setSystemSubCd('BO');
    setChangeReason('');
    setPermissionWasValidated(false);
    setModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((row: AuthGroupManageRow) => {
    setEditGroup(row);
    setEditNm(row.authGroupNm ?? '');
    setEditRemark(row.remark ?? '');
    setEditWasValidated(false);
    setEditOpen(true);
  }, []);

  const handleOpenLogModal = useCallback((row: AuthGroupManageRow) => {
    setLogModalGroup(row);
    setLogAuditPage(0);
    setLogModalOpen(true);
  }, []);

  const handleOpenRegister = useCallback(() => {
    setRegNm('');
    setRegRemark('');
    setRegisterWasValidated(false);
    setRegisterOpen(true);
  }, []);

  const handleRegisterFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.checkValidity()) {
        e.stopPropagation();
        setRegisterWasValidated(true);
        return;
      }
      setRegisterWasValidated(true);
      try {
        if (!canCreate) return;
        await createMut({
          authGroupNm: regNm.trim(),
          remark: regRemark.trim() || null,
        });
        await showSuccess(t('common.save'), t('authGroupManage.register.success'));
        setRegisterOpen(false);
        setRegNm('');
        setRegRemark('');
        setRegisterWasValidated(false);
      } catch (err) {
        void showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
      }
    },
    [canCreate, createMut, regNm, regRemark, t],
  );

  const handleEditFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.checkValidity()) {
        e.stopPropagation();
        setEditWasValidated(true);
        return;
      }
      setEditWasValidated(true);
      if (!editGroup) return;
      try {
        if (!canUpdate) return;
        await updateMut({
          authGroupCd: editGroup.authGroupCd,
          body: {
            authGroupNm: editNm.trim(),
            remark: editRemark.trim() || null,
          },
        });
        setEditOpen(false);
        setEditGroup(null);
        setEditWasValidated(false);
      } catch (err) {
        void showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
      }
    },
    [canUpdate, editGroup, editNm, editRemark, t, updateMut],
  );

  const handleDelete = useCallback(
    async (row: AuthGroupManageRow) => {
      const hasUsers = (row.userCount ?? 0) > 0;
      const ok = await confirm(
        t('common.delete'),
        hasUsers ? t('authGroupManage.deleteConfirmWithUsers') : t('authGroupManage.deleteConfirm'),
        { icon: 'warning', confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel') },
      );
      if (!ok) return;
      try {
        if (!canDelete) return;
        await deleteMut(row.authGroupCd);
        if (selectedGroup?.authGroupCd === row.authGroupCd) {
          setModalOpen(false);
          setSelectedGroup(null);
        }
      } catch (err) {
        showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
      }
    },
    [canDelete, deleteMut, selectedGroup?.authGroupCd, t],
  );

  const orderedMenus = useMemo(() => {
    const menus = menuConfig?.menus ?? [];
    if (menus.length < 2) {
      return menus.map((menu) => ({ menu, depth: 0 }));
    }

    const menuMap = new Map(menus.map((menu) => [menu.menuId, menu]));
    const childrenMap = new Map<string | null, typeof menus>();
    menus.forEach((menu) => {
      const parentKey = menu.parentMenuId && menuMap.has(menu.parentMenuId) ? menu.parentMenuId : null;
      const bucket = childrenMap.get(parentKey) ?? [];
      bucket.push(menu);
      childrenMap.set(parentKey, bucket);
    });
    childrenMap.forEach((items) => {
      items.sort((a, b) => (a.dispSeq ?? 0) - (b.dispSeq ?? 0) || a.menuId.localeCompare(b.menuId));
    });

    const ordered: Array<{ menu: (typeof menus)[number]; depth: number }> = [];
    const visited = new Set<string>();

    const traverse = (parentId: string | null, depth: number) => {
      const children = childrenMap.get(parentId) ?? [];
      children.forEach((child) => {
        if (visited.has(child.menuId)) return;
        visited.add(child.menuId);
        ordered.push({ menu: child, depth });
        traverse(child.menuId, depth + 1);
      });
    };
    traverse(null, 0);

    menus.forEach((menu) => {
      if (!visited.has(menu.menuId)) {
        ordered.push({ menu, depth: 0 });
      }
    });
    return ordered;
  }, [menuConfig?.menus]);

  const descendantMenuIdsMap = useMemo(() => {
    const childrenMap = new Map<string, string[]>();
    orderedMenus.forEach(({ menu }) => {
      const parentId = menu.parentMenuId;
      if (!parentId) return;
      const bucket = childrenMap.get(parentId) ?? [];
      bucket.push(menu.menuId);
      childrenMap.set(parentId, bucket);
    });

    const cache = new Map<string, string[]>();
    const collect = (menuId: string): string[] => {
      if (cache.has(menuId)) return cache.get(menuId)!;
      const descendants = [menuId];
      const children = childrenMap.get(menuId) ?? [];
      children.forEach((childId) => {
        collect(childId).forEach((id) => descendants.push(id));
      });
      const unique = Array.from(new Set(descendants));
      cache.set(menuId, unique);
      return unique;
    };

    const map = new Map<string, string[]>();
    orderedMenus.forEach(({ menu }) => {
      map.set(menu.menuId, collect(menu.menuId));
    });
    return map;
  }, [orderedMenus]);

  const handleToggleMenu = useCallback((menuId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Map(prev);
      const ids = descendantMenuIdsMap.get(menuId) ?? [menuId];
      const current = next.get(menuId);
      const isChecked = Boolean(current?.canView);
      if (isChecked) {
        ids.forEach((id) => {
          next.set(id, {
            menuId: id,
            canView: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canExcelDownload: false,
            canApprove: false,
          });
        });
      } else {
        ids.forEach((id) => {
          const prevItem = next.get(id);
          next.set(id, {
            menuId: id,
            canView: true,
            canCreate: prevItem?.canCreate ?? false,
            canUpdate: prevItem?.canUpdate ?? false,
            canDelete: prevItem?.canDelete ?? false,
            canExcelDownload: prevItem?.canExcelDownload ?? false,
            canApprove: prevItem?.canApprove ?? false,
          });
        });
      }
      return next;
    });
  }, [descendantMenuIdsMap]);

  const handleToggleAction = useCallback(
    (menuId: string, action: MenuActionKey) => {
      setSelectedPermissions((prev) => {
        const next = new Map(prev);
        const targetIds = descendantMenuIdsMap.get(menuId) ?? [menuId];
        const base = next.get(menuId) ?? {
          menuId,
          canView: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canExcelDownload: false,
          canApprove: false,
        };
        if (!base.canView) {
          return next;
        }
        const nextValue = !base[action];
        targetIds.forEach((targetId) => {
          const targetBase = next.get(targetId) ?? {
            menuId: targetId,
            canView: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canExcelDownload: false,
            canApprove: false,
          };
          next.set(targetId, {
            ...targetBase,
            canView: true,
            [action]: nextValue,
          });
        });
        return next;
      });
    },
    [descendantMenuIdsMap],
  );

  const allMenuIds = useMemo(
    () => orderedMenus.map(({ menu }) => menu.menuId),
    [orderedMenus],
  );
  const isAllChecked = allMenuIds.length > 0 && allMenuIds.every((id) => selectedPermissions.get(id)?.canView);

  const handleToggleAll = useCallback(() => {
    setSelectedPermissions((prev) => {
      if (allMenuIds.length === 0) return prev;
      const allChecked = allMenuIds.every((id) => prev.get(id)?.canView);
      const next = new Map(prev);
      if (allChecked) {
        allMenuIds.forEach((id) => {
          next.set(id, {
            menuId: id,
            canView: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canExcelDownload: false,
            canApprove: false,
          });
        });
        return next;
      }
      allMenuIds.forEach((id) => {
        const item = next.get(id);
        next.set(id, {
          menuId: id,
          canView: true,
          canCreate: item?.canCreate ?? false,
          canUpdate: item?.canUpdate ?? false,
          canDelete: item?.canDelete ?? false,
          canExcelDownload: item?.canExcelDownload ?? false,
          canApprove: item?.canApprove ?? false,
        });
      });
      return next;
    });
  }, [allMenuIds]);

  const handlePermissionSave = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.checkValidity()) {
        e.stopPropagation();
        setPermissionWasValidated(true);
        return;
      }
      setPermissionWasValidated(true);
      if (!selectedGroup) return;
      try {
        if (!canUpdate) return;
        await saveMut({
          authGroupCd: selectedGroup.authGroupCd,
          body: {
            systemMainCd: 'SYSTEM',
            systemSubCd,
            menuPermissions: Array.from(selectedPermissions.values()).filter((item) => item.canView),
            changeReason: changeReason.trim(),
          },
        });
        await showSuccess(t('common.save'), t('authGroupManage.saved'));
        setModalOpen(false);
        setSelectedGroup(null);
        setChangeReason('');
        setPermissionWasValidated(false);
      } catch (err) {
        showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
      }
    },
    [canUpdate, changeReason, saveMut, selectedGroup, selectedPermissions, systemSubCd, t],
  );

  const columnDefs = useMemo<ColDef<AuthGroupManageRow>[]>(
    () => [
      {
        colId: 'rowNum',
        headerName: t('authGroupManage.col.rowNum'),
        width: 72,
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'authGroupCd',
        headerName: t('authGroupManage.col.authGroupCd'),
        width: 170,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<AuthGroupManageRow>) => {
          const value = params.value as string | undefined;
          const row = params.data;
          if (!value || !row) return value ?? '';
          return (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary text-decoration-underline"
              onClick={() => handleOpenEditModal(row)}
              disabled={!canUpdate}
            >
              {value}
            </button>
          );
        },
      },
      { field: 'authGroupNm', headerName: t('authGroupManage.col.authGroupNm'), minWidth: 160, flex: 1 },
      {
        colId: 'permissionMenu',
        headerName: t('authGroupManage.col.permissionMenu'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<AuthGroupManageRow>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <div className="d-flex justify-content-center align-items-center w-100 h-100 py-1">
              <button
                type="button"
                className="p-0 border-0 bg-transparent d-inline-flex align-items-center"
                onClick={() => handleOpenPermissionModal(row)}
                disabled={!canUpdate}
              >
                <span className="badge badge-phoenix badge-phoenix-info d-inline-flex align-items-center">{t('authGroupManage.badge.permissionMenu')}</span>
              </button>
            </div>
          );
        },
      },
      {
        field: 'userCount',
        headerName: t('authGroupManage.col.userCount'),
        width: 120,
        cellStyle: { textAlign: 'right' },
        valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString() : '0'),
      },
      { field: 'remark', headerName: t('authGroupManage.col.remark'), minWidth: 180, flex: 1 },
      {
        colId: 'changeLog',
        headerName: t('authGroupManage.col.changeLog'),
        width: 110,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<AuthGroupManageRow>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <div className="d-flex justify-content-center align-items-center w-100 h-100 py-1">
              <button
                type="button"
                className="p-0 border-0 bg-transparent d-inline-flex align-items-center"
                onClick={() => handleOpenLogModal(row)}
              >
                <span className="badge badge-phoenix badge-phoenix-warning d-inline-flex align-items-center">{t('authGroupManage.badge.viewChangeLog')}</span>
              </button>
            </div>
          );
        },
      },
      {
        colId: 'delete',
        headerName: t('authGroupManage.col.delete'),
        width: 110,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<AuthGroupManageRow>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <div className="d-flex justify-content-center align-items-center w-100 h-100 py-1">
              <button
                type="button"
                className="p-0 border-0 bg-transparent d-inline-flex align-items-center"
                onClick={() => { void handleDelete(row); }}
                disabled={!canDelete}
              >
                <span className="badge badge-phoenix badge-phoenix-danger d-inline-flex align-items-center">{t('common.delete')}</span>
              </button>
            </div>
          );
        },
      },
      { field: 'createdAt', headerName: t('authGroupManage.col.createdAt'), width: 170, cellStyle: { textAlign: 'center' } },
      { field: 'createdBy', headerName: t('authGroupManage.col.createdBy'), width: 110, cellStyle: { textAlign: 'center' } },
      { field: 'updatedAt', headerName: t('authGroupManage.col.updatedAt'), width: 170, cellStyle: { textAlign: 'center' } },
      { field: 'updatedBy', headerName: t('authGroupManage.col.updatedBy'), width: 110, cellStyle: { textAlign: 'center' } },
    ],
    [handleDelete, handleOpenEditModal, handleOpenLogModal, handleOpenPermissionModal, t, canDelete, canUpdate],
  );

  const authGroupToolbar = useMemo(
    () => (
      <div className="d-flex justify-content-end w-100">
        {canCreate && (
          <button
            type="button"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center"
            onClick={handleOpenRegister}
          >
            <FiPlus size={14} className="me-1" aria-hidden />
            {t('authGroupManage.register.button')}
          </button>
        )}
      </div>
    ),
    [handleOpenRegister, t, canCreate],
  );

  return (
    <PageLayout title={t('authGroupManage.title')} showHeaderRefresh={false}>
      <DataGrid<AuthGroupManageRow>
        columnDefs={columnDefs}
        rowData={rows}
        loading={isLoading || deleting || creating || updating}
        showExportButton={false}
        toolbar={authGroupToolbar}
        defaultColDef={{ sortable: false, resizable: true }}
      />

      {registerOpen && canCreate && (
        <div
          className="product-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-group-reg-title"
        >
          <div
            className="product-modal auth-group-register-modal"
            style={{ maxWidth: '440px', minHeight: 'auto' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="product-modal__header">
              <h3 id="auth-group-reg-title">{t('authGroupManage.register.title')}</h3>
              <button
                type="button"
                className="product-modal__close"
                onClick={() => {
                  setRegisterOpen(false);
                  setRegisterWasValidated(false);
                }}
                aria-label={t('common.cancel')}
              >
                ×
              </button>
            </div>
            <form
              noValidate
              className={registerWasValidated ? 'needs-validation was-validated product-modal__form' : 'needs-validation product-modal__form'}
              onSubmit={(ev) => {
                void handleRegisterFormSubmit(ev);
              }}
            >
              <div className="product-modal__body auth-group-register-modal__body">
                <p className="product-modal__section-desc mb-3">{t('authGroupManage.register.authGroupCdAuto')}</p>
                <div className="auth-group-register-modal__fields">
                  <FloatingRow
                    id="auth-group-reg-nm"
                    label={t('authGroupManage.register.authGroupNm')}
                    required
                    requiredLabel={t('common.requiredMark')}
                    invalidFeedback={t('authGroups.name_required')}
                  >
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={regNm}
                      onChange={(e) => setRegNm(e.target.value)}
                      maxLength={200}
                      minLength={1}
                      placeholder=" "
                      autoComplete="off"
                      required
                    />
                  </FloatingRow>
                  <FloatingRow id="auth-group-reg-remark" label={t('authGroupManage.register.remark')}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={regRemark}
                      onChange={(e) => setRegRemark(e.target.value)}
                      maxLength={500}
                      placeholder=" "
                      autoComplete="off"
                    />
                  </FloatingRow>
                </div>
              </div>
              <div className="product-modal__footer auth-group-register-modal__footer">
                <button
                  type="button"
                  className="btn btn-phoenix-secondary btn-sm"
                  onClick={() => {
                    setRegisterOpen(false);
                    setRegisterWasValidated(false);
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={creating || !canCreate}>
                  {creating ? t('common.loading') : t('commonCode.saveAndContinue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && editGroup && canUpdate && (
        <div
          className="product-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-group-edit-title"
        >
          <div
            className="product-modal auth-group-register-modal"
            style={{ maxWidth: '440px', minHeight: 'auto' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="product-modal__header">
              <h3 id="auth-group-edit-title">{t('authGroupManage.edit.title')} - {editGroup.authGroupNm}</h3>
              <button
                type="button"
                className="product-modal__close"
                onClick={() => {
                  setEditOpen(false);
                  setEditGroup(null);
                  setEditWasValidated(false);
                }}
                aria-label={t('common.cancel')}
              >
                ×
              </button>
            </div>
            <form
              noValidate
              className={editWasValidated ? 'needs-validation was-validated product-modal__form' : 'needs-validation product-modal__form'}
              onSubmit={(ev) => {
                void handleEditFormSubmit(ev);
              }}
            >
              <div className="product-modal__body auth-group-register-modal__body">
                <div className="auth-group-register-modal__fields">
                  <div className="form-floating mb-2">
                    <input
                      id="auth-group-edit-cd"
                      type="text"
                      className="form-control form-control-sm auth-group-disabled-input"
                      value={editGroup.authGroupCd}
                      disabled
                      readOnly
                      tabIndex={-1}
                      placeholder=" "
                    />
                    <label htmlFor="auth-group-edit-cd">{t('authGroupManage.register.authGroupCd')}</label>
                  </div>
                  <FloatingRow
                    id="auth-group-edit-nm"
                    label={t('authGroupManage.register.authGroupNm')}
                    required
                    requiredLabel={t('common.requiredMark')}
                    invalidFeedback={t('authGroups.name_required')}
                  >
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editNm}
                      onChange={(e) => setEditNm(e.target.value)}
                      maxLength={200}
                      minLength={1}
                      placeholder=" "
                      autoComplete="off"
                      required
                    />
                  </FloatingRow>
                  <FloatingRow id="auth-group-edit-remark" label={t('authGroupManage.register.remark')}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editRemark}
                      onChange={(e) => setEditRemark(e.target.value)}
                      maxLength={500}
                      placeholder=" "
                      autoComplete="off"
                    />
                  </FloatingRow>
                </div>
              </div>
              <div className="product-modal__footer auth-group-register-modal__footer">
                <button
                  type="button"
                  className="btn btn-phoenix-secondary btn-sm"
                  onClick={() => {
                    setEditOpen(false);
                    setEditGroup(null);
                    setEditWasValidated(false);
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={updating || !canUpdate}>
                  {updating ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {logModalOpen && logModalGroup && (
        <div
          className="product-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-group-log-title"
        >
          <div
            className="product-modal auth-group-log-modal"
            style={{ maxWidth: '880px', minHeight: 'auto' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="product-modal__header">
              <h3 id="auth-group-log-title">
                {t('authGroupManage.logModal.title')} — {logModalGroup.authGroupNm}
              </h3>
              <button
                type="button"
                className="product-modal__close"
                onClick={() => {
                  setLogModalOpen(false);
                  setLogModalGroup(null);
                }}
                aria-label={t('common.cancel')}
              >
                ×
              </button>
            </div>
            <div className="product-modal__body">
              <div className="border rounded p-2">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-semibold">{t('authGroupManage.auditTitle')}</span>
                  <span className="small text-body-secondary d-inline-flex align-items-center gap-1">
                    <FiEye size={14} />
                    {logAudits?.total ?? 0}
                  </span>
                </div>
                <div className="table-responsive auth-group-manage-modal__audit-table-wrap">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>{t('authGroupManage.audit.actionType')}</th>
                        <th>{t('authGroupManage.audit.system')}</th>
                        <th>{t('authGroupManage.audit.beforeAfter')}</th>
                        <th>{t('authGroupManage.audit.changeReason')}</th>
                        <th>{t('authGroupManage.audit.actor')}</th>
                        <th>{t('authGroupManage.audit.at')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(logAudits?.items ?? []).map((a: AuthGroupMenuAuditRow) => {
                        const before = parseMenuIds(a.beforeMenuIds);
                        const after = parseMenuIds(a.afterMenuIds);
                        return (
                          <tr key={a.id}>
                            <td>{a.actionType}</td>
                            <td>{a.systemSubCd}</td>
                            <td className="small">
                              <span className="text-body-secondary">{before.length}</span>
                              {' -> '}
                              <span className="fw-semibold">{after.length}</span>
                            </td>
                            <td>{a.changeReason || '-'}</td>
                            <td>{a.createdBy || '-'}</td>
                            <td>{a.createdAt || '-'}</td>
                          </tr>
                        );
                      })}
                      {(logAudits?.items?.length ?? 0) === 0 && !logAuditLoading && (
                        <tr>
                          <td colSpan={6} className="text-center text-body-tertiary">
                            {t('authGroupManage.noAudits')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-end align-items-center gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-phoenix-secondary btn-sm btn-default-visible"
                    onClick={() => setLogAuditPage((p) => Math.max(0, p - 1))}
                    disabled={logAuditPage <= 0}
                  >
                    {t('common.prev')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-phoenix-secondary btn-sm btn-default-visible"
                    onClick={() => setLogAuditPage((p) => (logAudits?.last ? p : p + 1))}
                    disabled={Boolean(logAudits?.last)}
                  >
                    {t('common.next')}
                  </button>
                </div>
              </div>
            </div>
            <div className="product-modal__footer product-modal__footer--compact">
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm"
                onClick={() => {
                  setLogModalOpen(false);
                  setLogModalGroup(null);
                }}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && selectedGroup && canUpdate && (
        <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-label={t('authGroupManage.modal.title')}>
          <div className="product-modal auth-group-manage-modal">
            <div className="product-modal__header">
              <h3>
                {t('authGroupManage.modal.title')} - {selectedGroup.authGroupNm}
              </h3>
              <button type="button" className="product-modal__close" onClick={() => setModalOpen(false)} aria-label={t('common.cancel')}>
                ×
              </button>
            </div>
            <form
              noValidate
              className={permissionWasValidated ? 'needs-validation was-validated product-modal__form' : 'needs-validation product-modal__form'}
              onSubmit={(ev) => {
                void handlePermissionSave(ev);
              }}
            >
              <div className="product-modal__body">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <div className="btn-group btn-group-sm" role="group" aria-label={t('authGroupManage.system')}>
                    <button
                      type="button"
                      className={`btn ${systemSubCd === 'BO' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setSystemSubCd('BO')}
                    >
                      BO
                    </button>
                    <button
                      type="button"
                      className={`btn ${systemSubCd === 'OM' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setSystemSubCd('OM')}
                    >
                      OM
                    </button>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button type="button" className="btn btn-phoenix-secondary btn-sm btn-default-visible" onClick={handleToggleAll}>
                      {isAllChecked ? t('authGroupManage.unselectAll') : t('authGroupManage.selectAll')}
                    </button>
                    <span className="small text-body-secondary">
                      {t('authGroupManage.selectedCount', {
                        count: Array.from(selectedPermissions.values()).filter((item) => item.canView).length,
                      })}
                    </span>
                  </div>
                </div>

                <div className="auth-group-manage-modal__menu-list border rounded p-2 mb-3">
                  <div className="alert alert-info py-2 px-3 mb-2 small" role="alert">
                    {t('authGroupManage.shortcuts')}
                  </div>
                  {menuLoading ? (
                    <p className="text-body-tertiary mb-0">{t('common.loading')}</p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {orderedMenus.map(({ menu, depth }) => (
                        <div
                          key={menu.menuId}
                          className="list-group-item d-flex align-items-center gap-2 py-2"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleToggleMenu(menu.menuId)}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              handleToggleMenu(menu.menuId);
                            }
                          }}
                        >
                          {(() => {
                            const item = selectedPermissions.get(menu.menuId);
                            const canView = item?.canView ?? false;
                            return (
                              <>
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            checked={canView}
                            onChange={() => handleToggleMenu(menu.menuId)}
                            onClick={(ev) => ev.stopPropagation()}
                          />
                          <span className="small fw-semibold" style={{ paddingLeft: `${depth * 16}px` }}>
                            {menu.menuNmKo || menu.menuId}
                          </span>
                          <span className="small text-body-secondary font-monospace">{menu.menuId}</span>
                          <span className="ms-auto d-inline-flex align-items-center gap-2 small">
                            {MENU_ACTIONS.map((action) => (
                              <span key={action.key} className="d-inline-flex align-items-center gap-1">
                                <input
                                  type="checkbox"
                                  title={action.label}
                                  className="form-check-input mt-0"
                                  checked={item?.[action.key] ?? false}
                                  disabled={!canView}
                                  onChange={() => handleToggleAction(menu.menuId, action.key)}
                                  onClick={(ev) => ev.stopPropagation()}
                                />
                                {action.short}
                              </span>
                            ))}
                          </span>
                              </>
                            );
                          })()}
                        </div>
                      ))}
                      {(menuConfig?.menus?.length ?? 0) === 0 && (
                        <p className="text-body-tertiary small mb-0">{t('authGroupManage.noMenus')}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="auth-group-manage-modal__reason-wrap">
                  <FloatingRow
                    id="auth-group-change-reason"
                    label={t('authGroupManage.changeReason')}
                    required
                    requiredLabel={t('common.requiredMark')}
                    invalidFeedback={t('authGroupManage.changeReasonRequired')}
                  >
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder=" "
                      maxLength={500}
                      required
                    />
                  </FloatingRow>
                  <p className="small text-body-secondary mb-0">{t('authGroupManage.changeReasonPlaceholder')}</p>
                </div>
              </div>

              <div className="product-modal__footer product-modal__footer--compact auth-group-manage-modal__footer">
                <button type="button" className="btn btn-phoenix-secondary btn-sm" onClick={() => setModalOpen(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={saving || !canUpdate}>
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
