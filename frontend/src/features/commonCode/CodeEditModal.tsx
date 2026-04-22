import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { fetchCodeRow, updateCodeDetail } from '@/api/codeManage';
import { FloatingRow } from '@/features/shipper/FloatingRow';

const USE_YN = ['Y', 'N'] as const;
const MAIN_GROUP_MAIN_CD = 'CODE';

interface CodeEditModalProps {
  mainCd: string;
  subCd: string;
  onClose: () => void;
}

export function CodeEditModal({ mainCd, subCd, onClose }: CodeEditModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['codeManage', 'row', mainCd, subCd],
    queryFn: () => fetchCodeRow(mainCd, subCd),
  });

  const [codeNmKo, setCodeNmKo] = useState('');
  const [codeNmEn, setCodeNmEn] = useState('');
  const [useYn, setUseYn] = useState<(typeof USE_YN)[number]>('Y');
  const [dispSeq, setDispSeq] = useState('');
  const [etc1, setEtc1] = useState('');
  const [etc2, setEtc2] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!data) return;
    setCodeNmKo(data.codeNmKo ?? '');
    setCodeNmEn(data.codeNmEn ?? '');
    setUseYn((data.useYn === 'N' ? 'N' : 'Y') as (typeof USE_YN)[number]);
    setDispSeq(data.dispSeq != null ? String(data.dispSeq) : '');
    setEtc1(data.etc1 ?? '');
    setEtc2(data.etc2 ?? '');
  }, [data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
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
      const isMainCategoryRow = mainCd === MAIN_GROUP_MAIN_CD;
      let disp: number | null;
      if (isMainCategoryRow) {
        disp = data.dispSeq ?? null;
      } else {
        const ds = dispSeq.trim();
        disp = null;
        if (ds !== '') {
          const n = Number.parseInt(ds, 10);
          if (Number.isNaN(n)) {
            showError(t('common.error'), t('commonCode.register.dispSeqInvalid'));
            setPending(false);
            return;
          }
          disp = n;
        }
      }
      await updateCodeDetail({
        mainCd,
        subCd,
        codeNmKo: ko,
        codeNmEn: codeNmEn.trim(),
        useYn,
        dispSeq: disp,
        etc1: etc1.trim(),
        etc2: etc2.trim(),
      });
      await qc.invalidateQueries({ queryKey: ['codeManage'] });
      showSuccess(t('commonCode.modal.saveSuccess'));
      onClose();
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="code-edit-title">
      <div className="product-modal" style={{ maxWidth: '560px', minHeight: 'auto' }} onClick={(ev) => ev.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="code-edit-title">{t('commonCode.modal.editTitle')}</h3>
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
                <div className="form-floating mb-2 required">
                  <input
                    id="code-edit-main"
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                    readOnly
                    value={data.mainCd}
                    tabIndex={-1}
                  />
                  <label htmlFor="code-edit-main">
                    {t('commonCode.col.mainCd')}
                    <span className="text-primary ms-1" aria-hidden="true">
                      *
                    </span>
                    <span className="visually-hidden">{t('common.requiredMark')}</span>
                  </label>
                </div>
                <div className="form-floating mb-2 required">
                  <input
                    id="code-edit-sub"
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                    readOnly
                    value={data.subCd}
                    tabIndex={-1}
                  />
                  <label htmlFor="code-edit-sub">
                    {t('commonCode.col.subCd')}
                    <span className="text-primary ms-1" aria-hidden="true">
                      *
                    </span>
                    <span className="visually-hidden">{t('common.requiredMark')}</span>
                  </label>
                </div>
                <FloatingRow id="code-edit-ko" label={t('commonCode.col.codeNmKo')} required requiredLabel={t('common.requiredMark')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={codeNmKo}
                    onChange={(ev) => setCodeNmKo(ev.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="code-edit-en" label={t('commonCode.col.codeNmEn')}>
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
                    id="code-edit-use"
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
                  <label htmlFor="code-edit-use">
                    {t('commonCode.col.useYn')}
                    <span className="text-primary ms-1" aria-hidden="true">
                      *
                    </span>
                    <span className="visually-hidden">{t('common.requiredMark')}</span>
                  </label>
                </div>
                <FloatingRow id="code-edit-disp" label={t('commonCode.col.dispSeq')}>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={dispSeq}
                    onChange={(ev) => setDispSeq(ev.target.value)}
                    placeholder=" "
                    min={0}
                    disabled={data.mainCd === MAIN_GROUP_MAIN_CD}
                    readOnly={data.mainCd === MAIN_GROUP_MAIN_CD}
                    tabIndex={data.mainCd === MAIN_GROUP_MAIN_CD ? -1 : undefined}
                  />
                </FloatingRow>
                <FloatingRow id="code-edit-etc1" label={t('commonCode.col.etc1')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={etc1}
                    onChange={(ev) => setEtc1(ev.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="code-edit-etc2" label={t('commonCode.col.etc2')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={etc2}
                    onChange={(ev) => setEtc2(ev.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                {data.createdAt && (
                  <div className="form-floating mb-2">
                    <input
                      id="code-edit-created"
                      type="text"
                      className="form-control form-control-sm"
                      disabled
                      readOnly
                      value={data.createdAt}
                      tabIndex={-1}
                    />
                    <label htmlFor="code-edit-created">{t('commonCode.col.createdAt')}</label>
                  </div>
                )}
              </div>
            </div>
            <div className="product-modal__footer">
              <button type="button" className="btn btn-phoenix-secondary" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
