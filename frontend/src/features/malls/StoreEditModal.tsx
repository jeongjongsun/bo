import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSave, FiX } from 'react-icons/fi';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useMallOptions, useStoreTypeCodes, useCurrencyCodes, useUpdateStore } from './hooks';
import type { MallStoreListItem, StoreInfoLike } from './types';

interface StoreEditModalProps {
  store: MallStoreListItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function getStoreInfo(store: MallStoreListItem): StoreInfoLike {
  return store.storeInfo ?? {};
}

export function StoreEditModal({ store, onClose, onSuccess }: StoreEditModalProps) {
  const { t } = useTranslation();
  const info = getStoreInfo(store);

  const [mallCd, setMallCd] = useState(store.mallCd);
  const [storeNm, setStoreNm] = useState(store.storeNm);
  const [storeTypeCd, setStoreTypeCd] = useState(info.store_type_cd ?? '');
  const [wmsYn, setWmsYn] = useState(info.wms_yn ?? '');
  const [currencyCd, setCurrencyCd] = useState(info.currency_cd ?? '');
  const [gmt, setGmt] = useState(info.gmt ?? '');
  const [isActive, setIsActive] = useState(store.isActive !== false);

  const { data: mallOptions = [], isLoading: mallsLoading } = useMallOptions();
  const { data: storeTypeCodes = [] } = useStoreTypeCodes();
  const { data: currencyCodes = [] } = useCurrencyCodes();
  const { mutate: updateStore, isPending } = useUpdateStore();

  useEffect(() => {
    setMallCd(store.mallCd);
    setStoreNm(store.storeNm);
    setIsActive(store.isActive !== false);
    const i = getStoreInfo(store);
    setStoreTypeCd(i.store_type_cd ?? '');
    setWmsYn(i.wms_yn ?? '');
    setCurrencyCd(i.currency_cd ?? '');
    setGmt(i.gmt ?? '');
  }, [store.storeId, store.mallCd, store.storeNm, store.isActive, store.storeInfo]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = storeNm.trim();
    if (!trimmed) {
      showError(t('common.error'), t('malls.modal.requiredFields'));
      return;
    }
    if (!mallCd.trim()) {
      showError(t('common.error'), t('malls.modal.requiredFields'));
      return;
    }
    const storeInfo: StoreInfoLike = {};
    if (storeTypeCd) storeInfo.store_type_cd = storeTypeCd;
    if (wmsYn) storeInfo.wms_yn = wmsYn;
    if (currencyCd.trim()) storeInfo.currency_cd = currencyCd.trim();
    if (gmt.trim()) storeInfo.gmt = gmt.trim();

    updateStore(
      {
        storeId: store.storeId,
        mallCd: mallCd.trim(),
        storeNm: trimmed,
        storeInfo: Object.keys(storeInfo).length > 0 ? storeInfo : undefined,
        isActive,
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
          showSuccess(t('malls.modal.editSuccess'));
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      },
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="product-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-edit-modal-title"
    >
      <div className="product-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="store-edit-modal-title">{t('malls.modal.editTitle')}</h3>
          <button
            type="button"
            className="product-modal__close"
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            <FiX size={20} aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-modal__form">
          <div className="product-modal__body">
            <div className="product-modal__fields">
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <input
                    id="store-edit-storeCd"
                    type="text"
                    className="form-control"
                    value={store.storeCd}
                    readOnly
                    aria-readonly="true"
                  />
                  <label htmlFor="store-edit-storeCd">{t('malls.col.storeCd')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2 required">
                  <select
                    id="store-edit-mallCd"
                    className="form-select"
                    value={mallCd}
                    onChange={(e) => setMallCd(e.target.value)}
                    disabled={mallsLoading}
                  >
                    <option value="">{t('malls.modal.selectMall')}</option>
                    {mallOptions.map((m) => (
                      <option key={m.mallCd} value={m.mallCd}>
                        {m.mallNm} ({m.mallCd})
                      </option>
                    ))}
                  </select>
                  <label htmlFor="store-edit-mallCd">
                    {t('malls.modal.mall')}
                    <span className="text-primary ms-1" aria-hidden="true">*</span>
                  </label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2 required">
                  <input
                    id="store-edit-storeNm"
                    type="text"
                    className="form-control"
                    placeholder=" "
                    maxLength={200}
                    value={storeNm}
                    onChange={(e) => setStoreNm(e.target.value)}
                    required
                  />
                  <label htmlFor="store-edit-storeNm">
                    {t('malls.modal.storeNm')}
                    <span className="text-primary ms-1" aria-hidden="true">*</span>
                  </label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <select
                    id="store-edit-storeTypeCd"
                    className="form-select"
                    value={storeTypeCd}
                    onChange={(e) => setStoreTypeCd(e.target.value)}
                  >
                    <option value="">{t('malls.modal.select')}</option>
                    {storeTypeCodes.map((c) => (
                      <option key={c.subCd} value={c.subCd}>
                        {c.codeNm}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="store-edit-storeTypeCd">{t('malls.modal.storeType')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <select id="store-edit-wmsYn" className="form-select" value={wmsYn} onChange={(e) => setWmsYn(e.target.value)}>
                    <option value="">{t('malls.modal.select')}</option>
                    <option value="Y">{t('common.yes')}</option>
                    <option value="N">{t('common.no')}</option>
                  </select>
                  <label htmlFor="store-edit-wmsYn">{t('malls.modal.wmsYn')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <select id="store-edit-currencyCd" className="form-select" value={currencyCd} onChange={(e) => setCurrencyCd(e.target.value)}>
                    <option value="">{t('malls.modal.select')}</option>
                    {currencyCodes.map((c) => (
                      <option key={c.subCd} value={c.subCd}>
                        {c.codeNm} ({c.subCd})
                      </option>
                    ))}
                  </select>
                  <label htmlFor="store-edit-currencyCd">{t('malls.modal.currencyCd')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <input
                    id="store-edit-gmt"
                    type="text"
                    className="form-control"
                    placeholder=" "
                    maxLength={20}
                    value={gmt}
                    onChange={(e) => setGmt(e.target.value)}
                  />
                  <label htmlFor="store-edit-gmt">{t('malls.modal.gmt')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <select id="store-edit-isActive" className="form-select" value={isActive ? 'Y' : 'N'} onChange={(e) => setIsActive(e.target.value === 'Y')}>
                    <option value="Y">{t('malls.modal.statusNormal')}</option>
                    <option value="N">{t('malls.modal.statusStopped')}</option>
                  </select>
                  <label htmlFor="store-edit-isActive">{t('malls.modal.serviceStatus')}</label>
                </div>
              </div>
            </div>
          </div>
          <div className="product-modal__footer">
            <button
              type="button"
              className="product-modal__btn product-modal__btn--secondary d-inline-flex align-items-center gap-1"
              onClick={onClose}
            >
              <FiX size={14} aria-hidden />
              {t('malls.modal.close')}
            </button>
            <button
              type="submit"
              className="product-modal__btn product-modal__btn--primary d-inline-flex align-items-center gap-1"
              disabled={isPending}
            >
              <FiSave size={14} aria-hidden />
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
