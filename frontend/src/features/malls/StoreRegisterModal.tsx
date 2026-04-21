import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSave, FiX } from 'react-icons/fi';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useMallOptions, useStoreTypeCodes, useCurrencyCodes, useCreateStore } from './hooks';
import { useCorporationStore } from '@/store/useCorporationStore';
import type { StoreCreateParams } from '@/api/malls';

/** 상점 등록 폼 필수 입력 항목 (상품 수기등록과 동일한 .form-floating.required 표시) */
const REQUIRED_FIELDS_STORE = ['storeNm', 'mallCd'] as const;

function isRequired(fieldName: string): boolean {
  return (REQUIRED_FIELDS_STORE as readonly string[]).includes(fieldName);
}

interface StoreRegisterModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function StoreRegisterModal({ onClose, onSuccess }: StoreRegisterModalProps) {
  const { t } = useTranslation();
  const { corporationCd } = useCorporationStore();
  const { data: mallOptions = [], isLoading: mallsLoading } = useMallOptions();
  const { data: storeTypeCodes = [] } = useStoreTypeCodes();
  const { data: currencyCodes = [] } = useCurrencyCodes();
  const { mutate: createStore, isPending } = useCreateStore();
  const [currencyCd, setCurrencyCd] = useState('KRW');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!corporationCd) {
      showError(t('common.error'), t('malls.modal.corporationRequired'));
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData(form);

    const mallCd = (formData.get('mallCd') as string)?.trim();
    const storeNm = (formData.get('storeNm') as string)?.trim();
    const storeTypeCd = (formData.get('storeTypeCd') as string) || undefined;
    const wmsYn = (formData.get('wmsYn') as string) || undefined;
    const currencyCd = (formData.get('currencyCd') as string)?.trim() || undefined;
    const gmt = (formData.get('gmt') as string)?.trim() || undefined;
    const isActive = formData.get('isActive') === 'Y';

    if (!mallCd || !storeNm) {
      showError(t('common.error'), t('malls.modal.requiredFields'));
      return;
    }

    const params: StoreCreateParams = {
      mallCd,
      corporationCd,
      storeNm,
      isActive,
    };
    const storeInfo: StoreCreateParams['storeInfo'] = {};
    if (storeTypeCd) storeInfo.store_type_cd = storeTypeCd;
    if (wmsYn) storeInfo.wms_yn = wmsYn;
    if (currencyCd) storeInfo.currency_cd = currencyCd;
    if (gmt) storeInfo.gmt = gmt;
    if (Object.keys(storeInfo).length > 0) params.storeInfo = storeInfo;

    createStore(params, {
      onSuccess: () => {
        onClose();
        onSuccess?.();
        showSuccess(t('malls.modal.saveSuccess'));
      },
      onError: (err) => {
        showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
      },
    });
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
      aria-labelledby="store-register-modal-title"
    >
      <div className="product-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="store-register-modal-title">{t('malls.modal.title')}</h3>
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
                <div className={`form-floating mb-2${isRequired('storeNm') ? ' required' : ''}`}>
                  <input
                    id="store-register-storeNm"
                    type="text"
                    name="storeNm"
                    className="form-control"
                    placeholder=" "
                    maxLength={200}
                    required={isRequired('storeNm')}
                  />
                  <label htmlFor="store-register-storeNm">
                    {t('malls.modal.storeNm')}{isRequired('storeNm') && <span className="text-primary ms-1" aria-hidden="true">*</span>}
                  </label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className={`form-floating mb-2${isRequired('mallCd') ? ' required' : ''}`}>
                  <select
                    id="store-register-mallCd"
                    name="mallCd"
                    className="form-select"
                    required={isRequired('mallCd')}
                    disabled={mallsLoading}
                  >
                    <option value="">{t('malls.modal.selectMall')}</option>
                    {mallOptions.map((m) => (
                      <option key={m.mallCd} value={m.mallCd}>
                        {m.mallNm} ({m.mallCd})
                      </option>
                    ))}
                  </select>
                  <label htmlFor="store-register-mallCd">
                    {t('malls.modal.mall')}{isRequired('mallCd') && <span className="text-primary ms-1" aria-hidden="true">*</span>}
                  </label>
                </div>
              </div>
              {!mallsLoading && mallOptions.length === 0 && (
                <div className="product-modal__row">
                  <p className="form-text text-warning small mb-0">
                    {t('malls.modal.noMallOptions')}
                  </p>
                </div>
              )}
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <select id="store-register-storeTypeCd" name="storeTypeCd" className="form-select">
                    <option value="">{t('malls.modal.select')}</option>
                    {storeTypeCodes.map((c) => (
                      <option key={c.subCd} value={c.subCd}>
                        {c.codeNm}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="store-register-storeTypeCd">{t('malls.modal.storeType')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <select id="store-register-wmsYn" name="wmsYn" className="form-select">
                    <option value="">{t('malls.modal.select')}</option>
                    <option value="Y">{t('common.yes')}</option>
                    <option value="N">{t('common.no')}</option>
                  </select>
                  <label htmlFor="store-register-wmsYn">{t('malls.modal.wmsYn')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <select id="store-register-currencyCd" name="currencyCd" className="form-select" value={currencyCd} onChange={(e) => setCurrencyCd(e.target.value)}>
                    <option value="">{t('malls.modal.select')}</option>
                    {currencyCodes.map((c) => (
                      <option key={c.subCd} value={c.subCd}>
                        {c.codeNm} ({c.subCd})
                      </option>
                    ))}
                  </select>
                  <label htmlFor="store-register-currencyCd">{t('malls.modal.currencyCd')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <input
                    id="store-register-gmt"
                    type="text"
                    name="gmt"
                    className="form-control"
                    placeholder=" "
                    maxLength={20}
                    defaultValue="+09:00"
                  />
                  <label htmlFor="store-register-gmt">{t('malls.modal.gmt')}</label>
                </div>
              </div>
              <div className="product-modal__row">
                <div className="form-floating mb-2">
                  <select id="store-register-isActive" name="isActive" className="form-select">
                    <option value="Y">{t('malls.modal.statusNormal')}</option>
                    <option value="N">{t('malls.modal.statusStopped')}</option>
                  </select>
                  <label htmlFor="store-register-isActive">{t('malls.modal.serviceStatus')}</label>
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
              disabled={isPending || !corporationCd}
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
