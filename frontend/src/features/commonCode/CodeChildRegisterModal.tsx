import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { registerCodeChild } from '@/api/codeManage';
import { FloatingRow } from '@/features/shipper/FloatingRow';

const USE_YN = ['Y', 'N'] as const;

interface CodeChildRegisterModalProps {
  parentMainCd: string;
  onClose: () => void;
  /** 등록 성공 시 상세 캐시 갱신 등 */
  onRegistered?: (parentMainCd: string) => void;
}

export function CodeChildRegisterModal({ parentMainCd, onClose, onRegistered }: CodeChildRegisterModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [subCd, setSubCd] = useState('');
  const [codeNmKo, setCodeNmKo] = useState('');
  const [codeNmEn, setCodeNmEn] = useState('');
  const [useYn, setUseYn] = useState<(typeof USE_YN)[number]>('Y');
  const [dispSeq, setDispSeq] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cd = subCd.trim().toUpperCase();
    if (!cd) {
      showError(t('common.error'), t('commonCode.childRegister.subCdRequired'));
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
    const ds = dispSeq.trim();
    let disp: number | null | undefined;
    if (ds !== '') {
      const n = Number.parseInt(ds, 10);
      if (Number.isNaN(n)) {
        showError(t('common.error'), t('commonCode.register.dispSeqInvalid'));
        return;
      }
      disp = n;
    }
    setPending(true);
    try {
      await registerCodeChild({
        parentMainCd,
        subCd: cd,
        codeNmKo: ko,
        codeNmEn: codeNmEn.trim() || undefined,
        useYn,
        dispSeq: disp,
      });
      await qc.invalidateQueries({ queryKey: ['codeManage'] });
      onRegistered?.(parentMainCd);
      setSubCd('');
      setCodeNmKo('');
      setCodeNmEn('');
      setUseYn('Y');
      setDispSeq('');
      showSuccess(t('commonCode.childRegister.success'));
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="code-child-reg-title">
      <div className="product-modal" style={{ maxWidth: '520px', minHeight: 'auto' }} onClick={(ev) => ev.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="code-child-reg-title">{t('commonCode.childRegister.title')}</h3>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="product-modal__form">
          <div className="product-modal__body">
            <div className="product-modal__fields">
              <div className="form-floating mb-2 required">
                <input
                  id="code-child-parent"
                  type="text"
                  className="form-control form-control-sm"
                  disabled
                  readOnly
                  value={parentMainCd}
                  tabIndex={-1}
                />
                <label htmlFor="code-child-parent">
                  {t('commonCode.childRegister.parentLabel')}
                  <span className="text-primary ms-1" aria-hidden="true">
                    *
                  </span>
                  <span className="visually-hidden">{t('common.requiredMark')}</span>
                </label>
              </div>
              <FloatingRow id="code-child-sub" label={t('commonCode.col.subCd')} required requiredLabel={t('common.requiredMark')}>
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
              <FloatingRow id="code-child-ko" label={t('commonCode.col.codeNmKo')} required requiredLabel={t('common.requiredMark')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={codeNmKo}
                  onChange={(ev) => setCodeNmKo(ev.target.value)}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="code-child-en" label={t('commonCode.col.codeNmEn')}>
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
                  id="code-child-use"
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
                <label htmlFor="code-child-use">
                  {t('commonCode.col.useYn')}
                  <span className="text-primary ms-1" aria-hidden="true">
                    *
                  </span>
                  <span className="visually-hidden">{t('common.requiredMark')}</span>
                </label>
              </div>
              <FloatingRow id="code-child-disp" label={t('commonCode.col.dispSeq')}>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={dispSeq}
                  onChange={(ev) => setDispSeq(ev.target.value)}
                  placeholder=" "
                  min={0}
                />
              </FloatingRow>
            </div>
          </div>
          <div className="product-modal__footer">
            <button type="button" className="btn btn-phoenix-secondary btn-sm" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={pending}>
              {pending ? t('common.loading') : t('commonCode.saveAndContinue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
