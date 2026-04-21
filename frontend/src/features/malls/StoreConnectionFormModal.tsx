import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import { showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { StoreConnectionItem } from '@/api/malls';

export interface StoreConnectionFormValues {
  connectionAlias: string;
  apiId: string;
  apiPassword: string;
  clientId: string;
  siteCode: string;
  redirectUri: string;
  clientSecret: string;
  scope: string;
}

const emptyForm: StoreConnectionFormValues = {
  connectionAlias: '',
  apiId: '',
  apiPassword: '',
  clientId: '',
  siteCode: '',
  redirectUri: '',
  clientSecret: '',
  scope: '',
};

interface StoreConnectionFormModalProps {
  storeNm: string;
  editItem: StoreConnectionItem | null;
  onClose: () => void;
  onSave: (values: StoreConnectionFormValues) => Promise<void>;
  isSaving: boolean;
}

export function StoreConnectionFormModal({
  storeNm,
  editItem,
  onClose,
  onSave,
  isSaving,
}: StoreConnectionFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<StoreConnectionFormValues>(emptyForm);

  useEffect(() => {
    if (editItem) {
      setForm({
        connectionAlias: editItem.connectionAlias ?? '',
        apiId: editItem.apiId ?? '',
        apiPassword: editItem.apiPassword ?? '',
        clientId: editItem.clientId ?? '',
        siteCode: editItem.siteCode ?? '',
        redirectUri: editItem.redirectUri ?? '',
        clientSecret: editItem.clientSecret ?? '',
        scope: editItem.scope ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editItem]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const alias = form.connectionAlias.trim();
    if (!alias) {
      showError(t('common.error'), t('malls.connections.form.connectionAliasRequired'));
      return;
    }
    onSave({
      ...form,
      connectionAlias: alias,
      apiId: form.apiId.trim() || undefined,
      apiPassword: form.apiPassword || undefined,
      clientId: form.clientId.trim() || undefined,
      siteCode: form.siteCode.trim() || undefined,
      redirectUri: form.redirectUri.trim() || undefined,
      clientSecret: form.clientSecret.trim() || undefined,
      scope: form.scope.trim() || undefined,
    }).catch((err) => {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const title = editItem
    ? t('malls.connections.form.editTitle')
    : t('malls.connections.form.addTitle');

  return (
    <div
      className="product-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-connection-form-title"
    >
      <div className="product-modal-content bg-body-emphasis rounded-3 shadow-lg border border-body-secondary">
        <div className="border-bottom border-body-secondary px-4 py-3">
          <h2 id="store-connection-form-title" className="mb-0 fs-5 fw-semibold">
            {title}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="form-floating mb-2">
            <input
              type="text"
              className="form-control"
              value={storeNm}
              readOnly
              disabled
              aria-readonly
              placeholder=" "
            />
            <label className="text-body-secondary">
              {t('malls.connections.form.mallStore')}
            </label>
          </div>
          <div className="form-floating mb-2 required">
            <input
              id="connectionAlias"
              type="text"
              className="form-control"
              value={form.connectionAlias}
              onChange={(e) => setForm((p) => ({ ...p, connectionAlias: e.target.value }))}
              placeholder=" "
              required
            />
            <label htmlFor="connectionAlias">
              {t('malls.connections.form.connectionAlias')}
              <span className="text-primary ms-1" aria-hidden="true">*</span>
            </label>
          </div>
          <div className="form-floating mb-2">
            <input
              id="apiId"
              type="text"
              className="form-control"
              value={form.apiId}
              onChange={(e) => setForm((p) => ({ ...p, apiId: e.target.value }))}
              placeholder=" "
            />
            <label htmlFor="apiId">{t('malls.connections.form.apiId')}</label>
          </div>
          <div className="form-floating mb-2">
            <input
              id="apiPassword"
              type="password"
              className="form-control"
              value={form.apiPassword}
              onChange={(e) => setForm((p) => ({ ...p, apiPassword: e.target.value }))}
              placeholder=" "
              autoComplete="off"
            />
            <label htmlFor="apiPassword">{t('malls.connections.form.apiPassword')}</label>
          </div>
          <div className="form-floating mb-2">
            <input
              id="clientId"
              type="text"
              className="form-control"
              value={form.clientId}
              onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
              placeholder=" "
            />
            <label htmlFor="clientId">
              {t('malls.connections.form.clientId')}
              <span className="text-primary ms-1" aria-hidden="true">*</span>
            </label>
          </div>
          <div className="form-floating mb-2">
            <input
              id="siteCode"
              type="text"
              className="form-control"
              value={form.siteCode}
              onChange={(e) => setForm((p) => ({ ...p, siteCode: e.target.value }))}
              placeholder=" "
            />
            <label htmlFor="siteCode">
              {t('malls.connections.form.siteCode')}
              <span className="text-primary ms-1" aria-hidden="true">*</span>
            </label>
          </div>
          <div className="form-floating mb-2">
            <input
              id="redirectUri"
              type="url"
              className="form-control"
              value={form.redirectUri}
              onChange={(e) => setForm((p) => ({ ...p, redirectUri: e.target.value }))}
              placeholder=" "
            />
            <label htmlFor="redirectUri">
              {t('malls.connections.form.redirectUri')}
              <span className="text-primary ms-1" aria-hidden="true">*</span>
            </label>
          </div>
          <div className="form-floating mb-2">
            <input
              id="clientSecret"
              type="password"
              className="form-control"
              value={form.clientSecret}
              onChange={(e) => setForm((p) => ({ ...p, clientSecret: e.target.value }))}
              placeholder=" "
              autoComplete="off"
            />
            <label htmlFor="clientSecret">
              {t('malls.connections.form.clientSecret')}
              <span className="text-primary ms-1" aria-hidden="true">*</span>
            </label>
          </div>
          <div className="form-floating mb-4">
            <input
              id="scope"
              type="text"
              className="form-control"
              value={form.scope}
              onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}
              placeholder=" "
            />
            <label htmlFor="scope">
              {t('malls.connections.form.scope')}
              <span className="text-primary ms-1" aria-hidden="true">*</span>
            </label>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-phoenix-primary btn-sm"
              onClick={() => {}}
              title={t('malls.connections.form.apiTest')}
              disabled
            >
              {t('malls.connections.form.apiTest')}
            </button>
            <button type="button" className="btn btn-phoenix-secondary btn-sm btn-default-visible" onClick={onClose}>
              <FiX size={14} className="me-1" aria-hidden />
              {t('malls.modal.close')}
            </button>
            <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={isSaving}>
              {isSaving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
