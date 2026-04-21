import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { FloatingRow } from '@/features/shipper/FloatingRow';
import { useAuthGroupOptions, useRegisterUser, useUserGradeOptions } from './hooks';
const STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'LOCKED'] as const;

function emptyForm() {
  return {
    userId: '',
    userNm: '',
    password: '',
    emailId: '',
    gradeCd: '',
    authGroup: '',
    userStatus: 'ACTIVE' as (typeof STATUS_VALUES)[number],
    mobileNo: '',
    corporationCd: '',
  };
}

interface UserRegisterModalProps {
  onClose: () => void;
}

export function UserRegisterModal({ onClose }: UserRegisterModalProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
  const { data: gradeCodes = [] } = useUserGradeOptions(lang);
  const { data: authGroups = [], isLoading: authLoading } = useAuthGroupOptions();
  const { mutate: register, isPending } = useRegisterUser();
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
    const uid = form.userId.trim();
    const nm = form.userNm.trim();
    const pw = form.password;
    const email = form.emailId.trim();
    const ag = form.authGroup.trim();
    if (!uid) {
      showError(t('common.error'), t('users.modal.requiredUserId'));
      return;
    }
    if (!nm) {
      showError(t('common.error'), t('users.modal.requiredNm'));
      return;
    }
    if (!pw) {
      showError(t('common.error'), t('users.modal.requiredPassword'));
      return;
    }
    if (!email) {
      showError(t('common.error'), t('users.modal.requiredEmail'));
      return;
    }
    if (!ag) {
      showError(t('common.error'), t('users.modal.requiredAuthGroup'));
      return;
    }
    register(
      {
        userId: uid,
        userNm: nm,
        password: pw,
        emailId: email,
        gradeCd: form.gradeCd.trim() || undefined,
        authGroup: ag,
        userStatus: form.userStatus,
        mobileNo: form.mobileNo.trim() || undefined,
        corporationCd: form.corporationCd.trim() || undefined,
      },
      {
        onSuccess: () => {
          showSuccess(t('users.modal.registerSuccess'));
          resetForm();
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      },
    );
  };

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="user-reg-title">
      <div className="product-modal" style={{ maxWidth: '640px', minHeight: 'auto' }} onClick={(ev) => ev.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="user-reg-title">{t('users.modal.registerTitle')}</h3>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="product-modal__form">
          <div className="product-modal__body">
            <div className="product-modal__fields">
              <FloatingRow id="user-reg-id" label={t('users.col.userId')} required requiredLabel={t('common.requiredMark')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.userId}
                  onChange={(ev) => setForm((f) => ({ ...f, userId: ev.target.value }))}
                  maxLength={48}
                  autoComplete="off"
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="user-reg-nm" label={t('users.col.userNm')} required requiredLabel={t('common.requiredMark')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.userNm}
                  onChange={(ev) => setForm((f) => ({ ...f, userNm: ev.target.value }))}
                  maxLength={128}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow
                id="user-reg-pw"
                label={t('users.modal.password')}
                required
                requiredLabel={t('common.requiredMark')}
              >
                <input
                  type="password"
                  className="form-control form-control-sm"
                  value={form.password}
                  onChange={(ev) => setForm((f) => ({ ...f, password: ev.target.value }))}
                  autoComplete="new-password"
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow
                id="user-reg-email"
                label={t('users.col.emailId')}
                required
                requiredLabel={t('common.requiredMark')}
              >
                <input
                  type="email"
                  className="form-control form-control-sm"
                  value={form.emailId}
                  onChange={(ev) => setForm((f) => ({ ...f, emailId: ev.target.value }))}
                  placeholder=" "
                />
              </FloatingRow>
              <div className="form-floating mb-2">
                <select
                  id="user-reg-grade"
                  className="form-select form-select-sm"
                  value={form.gradeCd}
                  onChange={(ev) => setForm((f) => ({ ...f, gradeCd: ev.target.value }))}
                >
                  <option value="">{t('users.modal.gradeOptional')}</option>
                  {gradeCodes.map((c) => (
                    <option key={c.subCd} value={c.subCd}>
                      {c.codeNm || c.subCd}
                    </option>
                  ))}
                </select>
                <label htmlFor="user-reg-grade">{t('users.col.grade')}</label>
              </div>
              <div className="form-floating mb-2 required">
                <select
                  id="user-reg-auth"
                  className="form-select form-select-sm"
                  value={form.authGroup}
                  onChange={(ev) => setForm((f) => ({ ...f, authGroup: ev.target.value }))}
                  disabled={authLoading}
                  required
                >
                  <option value="">{t('users.modal.selectAuthGroup')}</option>
                  {authGroups.map((a) => (
                    <option key={a.authGroupCd} value={a.authGroupCd}>
                      {a.authGroupNm}
                    </option>
                  ))}
                </select>
                <label htmlFor="user-reg-auth">
                  {t('users.col.authGroup')}
                  <span className="text-primary ms-1" aria-hidden="true">
                    *
                  </span>
                </label>
              </div>
              <div className="form-floating mb-2 required">
                <select
                  id="user-reg-status"
                  className="form-select form-select-sm"
                  value={form.userStatus}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, userStatus: ev.target.value as (typeof STATUS_VALUES)[number] }))
                  }
                >
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {t(`users.statusLabels.${s}`)}
                    </option>
                  ))}
                </select>
                <label htmlFor="user-reg-status">
                  {t('users.col.userStatus')}
                  <span className="text-primary ms-1" aria-hidden="true">
                    *
                  </span>
                </label>
              </div>
              <FloatingRow id="user-reg-mobile" label={t('users.modal.mobileNo')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.mobileNo}
                  onChange={(ev) => setForm((f) => ({ ...f, mobileNo: ev.target.value }))}
                  placeholder=" "
                />
              </FloatingRow>
              <FloatingRow id="user-reg-corp" label={t('users.modal.corporationCd')}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.corporationCd}
                  onChange={(ev) => setForm((f) => ({ ...f, corporationCd: ev.target.value }))}
                  placeholder=" "
                />
              </FloatingRow>
            </div>
          </div>
          <div className="product-modal__footer product-modal__footer--compact">
            <button type="button" className="btn btn-phoenix-secondary btn-sm" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={isPending}>
              {isPending ? t('common.loading') : t('users.modal.saveAndContinue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
