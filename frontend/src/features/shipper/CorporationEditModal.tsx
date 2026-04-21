import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useCorporationDetail, useUpdateCorporationDetail } from './hooks';
import { FloatingRow } from './FloatingRow';

interface CorporationEditModalProps {
  corporationCd: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CorporationEditModal({ corporationCd, onClose, onSuccess }: CorporationEditModalProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useCorporationDetail(corporationCd);
  const { mutate: saveDetail, isPending } = useUpdateCorporationDetail();

  const [corporationNm, setCorporationNm] = useState('');
  const [businessNo, setBusinessNo] = useState('');
  const [telNo, setTelNo] = useState('');
  const [email, setEmail] = useState('');
  const [ceoNm, setCeoNm] = useState('');
  const [address, setAddress] = useState('');
  const [faxNo, setFaxNo] = useState('');
  const [homepageUrl, setHomepageUrl] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (!data) return;
    setCorporationNm(data.corporationNm ?? '');
    setBusinessNo(data.businessNo ?? '');
    setTelNo(data.telNo ?? '');
    setEmail(data.email ?? '');
    setCeoNm(data.ceoNm ?? '');
    setAddress(data.address ?? '');
    setFaxNo(data.faxNo ?? '');
    setHomepageUrl(data.homepageUrl ?? '');
    setRemark(data.remark ?? '');
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nm = corporationNm.trim();
    if (!nm) {
      showError(t('common.error'), t('shipper.modal.requiredNm'));
      return;
    }
    saveDetail(
      {
        corporationCd,
        corporationNm: nm,
        businessNo: businessNo.trim(),
        telNo: telNo.trim(),
        email: email.trim(),
        ceoNm: ceoNm.trim(),
        address: address.trim(),
        faxNo: faxNo.trim(),
        homepageUrl: homepageUrl.trim(),
        remark: remark.trim(),
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
          showSuccess(t('shipper.modal.editSuccess'));
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      },
    );
  };

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="corp-edit-title">
      <div className="product-modal" style={{ maxWidth: '640px' }} onClick={(ev) => ev.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="corp-edit-title">{t('shipper.modal.editTitle')}</h3>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        {isLoading && (
          <div className="product-modal__body py-5 text-center text-body-secondary">{t('common.loading')}</div>
        )}
        {isError && (
          <div className="product-modal__body py-4 text-danger">
            {getApiErrorMessage(error, t('common.error'), t)}
          </div>
        )}
        {!isLoading && !isError && data && (
          <form onSubmit={handleSubmit} className="product-modal__form">
            <div className="product-modal__body">
              <div className="product-modal__fields">
                <div className="form-floating mb-2">
                  <input
                    id="corp-edit-cd"
                    type="text"
                    className="form-control form-control-sm product-modal__input--readonly"
                    value={data.corporationCd}
                    readOnly
                    tabIndex={-1}
                    placeholder=" "
                  />
                  <label htmlFor="corp-edit-cd">{t('shipper.col.corporationCd')}</label>
                </div>
                <FloatingRow
                  id="corp-edit-nm"
                  label={t('shipper.col.corporationNm')}
                  required
                  requiredLabel={t('common.requiredMark')}
                >
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={corporationNm}
                    onChange={(ev) => setCorporationNm(ev.target.value)}
                    required
                    maxLength={200}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="corp-edit-biz" label={t('shipper.col.businessNo')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={businessNo}
                    onChange={(ev) => setBusinessNo(ev.target.value)}
                    maxLength={40}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="corp-edit-tel" label={t('shipper.col.telNo')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={telNo}
                    onChange={(ev) => setTelNo(ev.target.value)}
                    maxLength={40}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="corp-edit-email" label={t('shipper.col.email')}>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    maxLength={120}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="corp-edit-ceo" label={t('shipper.modal.ceoNm')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={ceoNm}
                    onChange={(ev) => setCeoNm(ev.target.value)}
                    maxLength={100}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="corp-edit-addr" label={t('shipper.modal.address')}>
                  <textarea
                    className="form-control form-control-sm"
                    style={{ height: '72px' }}
                    value={address}
                    onChange={(ev) => setAddress(ev.target.value)}
                    maxLength={500}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="corp-edit-fax" label={t('shipper.modal.faxNo')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={faxNo}
                    onChange={(ev) => setFaxNo(ev.target.value)}
                    maxLength={40}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="corp-edit-url" label={t('shipper.modal.homepageUrl')}>
                  <input
                    type="url"
                    className="form-control form-control-sm"
                    value={homepageUrl}
                    onChange={(ev) => setHomepageUrl(ev.target.value)}
                    maxLength={300}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="corp-edit-rm" label={t('shipper.modal.remark')}>
                  <textarea
                    className="form-control form-control-sm"
                    style={{ height: '64px' }}
                    value={remark}
                    onChange={(ev) => setRemark(ev.target.value)}
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
                {isPending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
