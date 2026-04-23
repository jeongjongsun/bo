import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { registerCodeGroup } from '@/api/codeManage';
import { FloatingRow } from '@/features/shipper/FloatingRow';
import { useHasMenuActionPermissionByPath } from '@/hooks/useActionPermission';

const USE_YN = ['Y', 'N'] as const;

interface CodeRegisterModalProps {
  onClose: () => void;
}

export function CodeRegisterModal({ onClose }: CodeRegisterModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const canCreate = useHasMenuActionPermissionByPath('/system/common-code', 'create');
  const [subCd, setSubCd] = useState('');
  const [codeNmKo, setCodeNmKo] = useState('');
  const [codeNmEn, setCodeNmEn] = useState('');
  const [useYn, setUseYn] = useState<(typeof USE_YN)[number]>('Y');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      return;
    }
    const cd = subCd.trim().toUpperCase();
    if (!cd) {
      showError(t('common.error'), t('commonCode.register.subCdRequired'));
      return;
    }
    const ko = codeNmKo.trim();
    if (!ko) {
      showError(t('common.error'), t('codes.code_nm_ko_required'));
      return;
    }
    if (useYn !== 'Y' && useYn !== 'N') {
      showError(t('common.error'), t('codes.use_yn_required'));
      return;
    }
    setPending(true);
    try {
      await registerCodeGroup({
        subCd: cd,
        codeNmKo: ko,
        codeNmEn: codeNmEn.trim() || undefined,
        useYn,
      });
      await qc.invalidateQueries({ queryKey: ['codeManage'] });
      void qc.invalidateQueries({ queryKey: ['codes'] });
      setSubCd('');
      setCodeNmKo('');
      setCodeNmEn('');
      setUseYn('Y');
      showSuccess(t('commonCode.register.success'));
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="code-reg-title">
      <div className="product-modal" style={{ maxWidth: '520px', minHeight: 'auto' }} onClick={(ev) => ev.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="code-reg-title">{t('commonCode.register.title')}</h3>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="product-modal__form">
          <div className="product-modal__body">
            <div className="product-modal__fields">
              <FloatingRow id="code-reg-sub" label={t('commonCode.register.subCdLabel')} required requiredLabel={t('common.requiredMark')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={subCd}
                  onChange={(ev) => setSubCd(ev.target.value)}
                  maxLength={50}
                  placeholder=" "
                  autoComplete="off"
                />
              </FloatingRow>
              <FloatingRow id="code-reg-ko" label={t('commonCode.col.codeNmKo')} required requiredLabel={t('common.requiredMark')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={codeNmKo}
                  onChange={(ev) => setCodeNmKo(ev.target.value)}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="code-reg-en" label={t('commonCode.col.codeNmEn')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={codeNmEn}
                  onChange={(ev) => setCodeNmEn(ev.target.value)}
                  placeholder=" "
                />
              </FloatingRow>
              <div className="form-floating mb-2 required">
                <select
                  id="code-reg-use"
                  className="form-select form-select-sm"
                  value={useYn}
                  onChange={(ev) => setUseYn(ev.target.value as (typeof USE_YN)[number])}
                >
                  {USE_YN.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <label htmlFor="code-reg-use">
                  {t('commonCode.col.useYn')}
                  <span className="text-primary ms-1" aria-hidden="true">
                    *
                  </span>
                  <span className="visually-hidden">{t('common.requiredMark')}</span>
                </label>
              </div>
            </div>
          </div>
          <div className="product-modal__footer">
            <button type="button" className="btn btn-phoenix-secondary btn-sm btn-default-visible" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={pending || !canCreate}>
              {pending ? t('common.loading') : t('commonCode.saveAndContinue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
