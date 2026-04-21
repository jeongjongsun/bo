import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import {
  useStoreConnections,
  useCreateStoreConnection,
  useUpdateStoreConnection,
  useDeleteStoreConnection,
} from './hooks';
import { StoreConnectionFormModal, type StoreConnectionFormValues } from './StoreConnectionFormModal';
import type { StoreConnectionItem } from '@/api/malls';
import type { MallStoreListItem } from './types';

interface StoreConnectionPanelProps {
  store: MallStoreListItem;
  onClose: () => void;
}

function maskSecret(s: string | null | undefined): string {
  if (s == null || s === '') return '';
  if (s.length <= 8) return '****';
  return s.slice(0, 4) + '****' + s.slice(-2);
}

export function StoreConnectionPanel({ store, onClose }: StoreConnectionPanelProps) {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<StoreConnectionItem | null>(null);

  const { data: connections = [], isLoading } = useStoreConnections(store.storeId);
  const createMutation = useCreateStoreConnection(store.storeId);
  const updateMutation = useUpdateStoreConnection(store.storeId);
  const deleteMutation = useDeleteStoreConnection(store.storeId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !formOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, formOpen]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: StoreConnectionItem) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditItem(null);
  };

  const handleSave = async (values: StoreConnectionFormValues): Promise<void> => {
    if (editItem) {
      await updateMutation.mutateAsync({
        connectionId: editItem.connectionId,
        connectionAlias: values.connectionAlias,
        apiId: values.apiId,
        apiPassword: values.apiPassword,
        clientId: values.clientId,
        siteCode: values.siteCode,
        redirectUri: values.redirectUri,
        clientSecret: values.clientSecret,
        scope: values.scope,
      });
      showSuccess(t('malls.connections.updateSuccess'));
    } else {
      await createMutation.mutateAsync({
        connectionAlias: values.connectionAlias,
        apiId: values.apiId,
        apiPassword: values.apiPassword,
        clientId: values.clientId,
        siteCode: values.siteCode,
        redirectUri: values.redirectUri,
        clientSecret: values.clientSecret,
        scope: values.scope,
      });
      showSuccess(t('malls.connections.createSuccess'));
    }
    handleCloseForm();
  };

  const handleDelete = (item: StoreConnectionItem) => {
    if (!window.confirm(t('malls.connections.confirmDelete', { alias: item.connectionAlias }))) return;
    deleteMutation.mutate(item.connectionId, {
      onSuccess: () => showSuccess(t('malls.connections.deleteSuccess')),
      onError: (err) =>
        showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t)),
    });
  };

  return (
    <>
      <div
        className="product-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-connection-panel-title"
      >
        <div
          className="bg-body-emphasis rounded-3 shadow-lg border border-body-secondary overflow-hidden"
          style={{ maxWidth: '720px', width: '95%', maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="d-flex align-items-center justify-content-between border-bottom border-body-secondary px-4 py-3">
            <h2 id="store-connection-panel-title" className="mb-0 fs-6 fw-semibold text-truncate min-w-0 me-2" title={store.storeNm}>
              {store.storeNm}
            </h2>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <button
                type="button"
                className="btn btn-phoenix-primary btn-sm text-nowrap"
                onClick={handleOpenAdd}
                aria-label={t('malls.connections.addConnection')}
              >
                <FiPlus size={14} className="me-1" aria-hidden />
                {t('malls.connections.addConnection')}
              </button>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-icon btn-sm rounded-circle btn-default-visible"
                onClick={onClose}
                aria-label={t('malls.modal.close')}
              >
                <FiX size={18} aria-hidden />
              </button>
            </div>
          </div>
          <div className="store-connection-panel__body p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {isLoading ? (
              <p className="text-body-secondary mb-0 small">{t('common.loading')}</p>
            ) : connections.length === 0 ? (
              <p className="text-body-secondary mb-0 small">{t('malls.connections.empty')}</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-semibold">{t('malls.connections.col.connectionAlias')}</th>
                      <th className="fw-semibold">{t('malls.connections.col.clientId')}</th>
                      <th className="fw-semibold">{t('malls.connections.col.siteCode')}</th>
                      <th className="text-end fw-semibold" style={{ width: '120px' }}>
                        {t('malls.connections.col.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((row) => (
                      <tr key={row.connectionId}>
                        <td className="align-middle">{row.connectionAlias}</td>
                        <td className="align-middle font-sans-serif text-body-tertiary">
                          {maskSecret(row.clientId)}
                        </td>
                        <td className="align-middle">{row.siteCode ?? '—'}</td>
                        <td className="text-end align-middle">
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-primary me-2"
                            onClick={() => handleOpenEdit(row)}
                            aria-label={t('malls.connections.edit')}
                          >
                            <FiEdit2 size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-danger"
                            onClick={() => handleDelete(row)}
                            aria-label={t('common.delete')}
                          >
                            <FiTrash2 size={14} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {formOpen && (
        <StoreConnectionFormModal
          storeNm={store.storeNm}
          editItem={editItem}
          onClose={handleCloseForm}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </>
  );
}
