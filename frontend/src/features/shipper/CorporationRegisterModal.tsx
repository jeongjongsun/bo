import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useRegisterCorporation } from './hooks';
import { FloatingRow } from './FloatingRow';

interface CorporationRegisterModalProps {
  onClose: () => void;
}

function emptyForm() {
  return {
    corporationNm: '',
    businessNo: '',
    telNo: '',
    email: '',
    ceoNm: '',
    address: '',
    faxNo: '',
    homepageUrl: '',
    remark: '',
  };
}

export function CorporationRegisterModal({ onClose }: CorporationRegisterModalProps) {
  const { t } = useTranslation();
  const { mutate: register, isPending } = useRegisterCorporation();
  const [form, setForm] = useState(emptyForm);

  const resetForm = useCallback(() => {
    setForm(emptyForm());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nm = form.corporationNm.trim();
    if (!nm) {
      showError(t('common.error'), t('shipper.modal.requiredNm'));
      return;
    }
    register(
      {
        corporationNm: nm,
        businessNo: form.businessNo.trim(),
        telNo: form.telNo.trim(),
        email: form.email.trim(),
        ceoNm: form.ceoNm.trim(),
        address: form.address.trim(),
        faxNo: form.faxNo.trim(),
        homepageUrl: form.homepageUrl.trim(),
        remark: form.remark.trim(),
      },
      {
        onSuccess: (created) => {
          showSuccess(t('shipper.modal.registerContinueSuccess', { cd: created.corporationCd }));
          resetForm();
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      },
    );
  };

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="corp-reg-title">
      <div className="product-modal" style={{ maxWidth: '640px', minHeight: 'auto' }} onClick={(ev) => ev.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="corp-reg-title">{t('shipper.modal.registerTitle')}</h3>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="product-modal__form">
          <div className="product-modal__body">
            <p className="text-body-secondary small mb-3 mb-md-2">{t('shipper.modal.autoCdHint')}</p>
            <div className="product-modal__fields">
              <FloatingRow
                id="corp-reg-nm"
                label={t('shipper.col.corporationNm')}
                required
                requiredLabel={t('common.requiredMark')}
              >
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.corporationNm}
                  onChange={(ev) => setForm((f) => ({ ...f, corporationNm: ev.target.value }))}
                  required
                  maxLength={200}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="corp-reg-biz" label={t('shipper.col.businessNo')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.businessNo}
                  onChange={(ev) => setForm((f) => ({ ...f, businessNo: ev.target.value }))}
                  maxLength={40}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="corp-reg-tel" label={t('shipper.col.telNo')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.telNo}
                  onChange={(ev) => setForm((f) => ({ ...f, telNo: ev.target.value }))}
                  maxLength={40}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="corp-reg-email" label={t('shipper.col.email')}>
                <input
                  type="email"
                  className="form-control form-control-sm"
                  value={form.email}
                  onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))}
                  maxLength={120}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="corp-reg-ceo" label={t('shipper.modal.ceoNm')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.ceoNm}
                  onChange={(ev) => setForm((f) => ({ ...f, ceoNm: ev.target.value }))}
                  maxLength={100}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="corp-reg-addr" label={t('shipper.modal.address')}>
                <textarea
                  className="form-control form-control-sm"
                  style={{ height: '72px' }}
                  value={form.address}
                  onChange={(ev) => setForm((f) => ({ ...f, address: ev.target.value }))}
                  maxLength={500}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="corp-reg-fax" label={t('shipper.modal.faxNo')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.faxNo}
                  onChange={(ev) => setForm((f) => ({ ...f, faxNo: ev.target.value }))}
                  maxLength={40}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="corp-reg-url" label={t('shipper.modal.homepageUrl')}>
                <input
                  type="url"
                  className="form-control form-control-sm"
                  value={form.homepageUrl}
                  onChange={(ev) => setForm((f) => ({ ...f, homepageUrl: ev.target.value }))}
                  maxLength={300}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="corp-reg-rm" label={t('shipper.modal.remark')}>
                <textarea
                  className="form-control form-control-sm"
                  style={{ height: '64px' }}
                  value={form.remark}
                  onChange={(ev) => setForm((f) => ({ ...f, remark: ev.target.value }))}
                  maxLength={1000}
                  placeholder=" "
                />
              </FloatingRow>
            </div>
          </div>
          <div
            className="product-modal__footer product-modal__footer--compact"
            style={{ justifyContent: 'flex-end', gap: '0.5rem' }}
          >
            <button type="button" className="btn btn-phoenix-secondary btn-sm btn-default-visible" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={isPending}>
              {isPending ? t('common.loading') : t('shipper.modal.saveAndContinue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
