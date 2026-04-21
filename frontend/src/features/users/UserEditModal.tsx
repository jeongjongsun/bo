import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { fetchCodeList } from '@/api/codes';
import { FloatingRow } from '@/features/shipper/FloatingRow';
import { useAuthGroupOptions, useUpdateUserDetail, useUserDetail } from './hooks';

const USER_GRADE_MAIN_CD = 'USER_GRADE';
const STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'LOCKED'] as const;

interface UserEditModalProps {
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserEditModal({ userId, onClose, onSuccess }: UserEditModalProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
  const { data: gradeCodes = [] } = useQuery({
    queryKey: ['codes', USER_GRADE_MAIN_CD, lang],
    queryFn: () => fetchCodeList(USER_GRADE_MAIN_CD, lang),
    staleTime: 60 * 60 * 1000,
  });
  const { data: authGroups = [], isLoading: authLoading } = useAuthGroupOptions();
  const { data, isLoading, isError, error } = useUserDetail(userId);
  const { mutate: saveDetail, isPending } = useUpdateUserDetail();

  const [userNm, setUserNm] = useState('');
  const [emailId, setEmailId] = useState('');
  const [gradeCd, setGradeCd] = useState('');
  const [authGroup, setAuthGroup] = useState('');
  const [userStatus, setUserStatus] = useState<(typeof STATUS_VALUES)[number]>('ACTIVE');
  const [mobileNo, setMobileNo] = useState('');
  const [corporationCd, setCorporationCd] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!data) return;
    setUserNm(data.userNm ?? '');
    setEmailId(data.emailId ?? '');
    setGradeCd(data.gradeCd ?? '');
    setAuthGroup(data.authGroup ?? '');
    setUserStatus((data.userStatus as (typeof STATUS_VALUES)[number]) || 'ACTIVE');
    setMobileNo(data.mobileNo ?? '');
    setCorporationCd(data.corporationCd ?? '');
    setNewPassword('');
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
    const nm = userNm.trim();
    const email = emailId.trim();
    const ag = authGroup.trim();
    if (!nm) {
      showError(t('common.error'), t('users.modal.requiredNm'));
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
    saveDetail(
      {
        userId,
        userNm: nm,
        emailId: email,
        gradeCd: gradeCd.trim() || null,
        authGroup: ag,
        userStatus,
        mobileNo: mobileNo.trim() || null,
        corporationCd: corporationCd.trim() || null,
        newPassword: newPassword.trim() || null,
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
          showSuccess(t('users.modal.editSuccess'));
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      },
    );
  };

  return (
    <div className="product-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="user-edit-title">
      <div className="product-modal" style={{ maxWidth: '640px', minHeight: 'auto' }} onClick={(ev) => ev.stopPropagation()}>
        <div className="product-modal__header">
          <h3 id="user-edit-title">{t('users.modal.editTitle')}</h3>
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
                    id="user-edit-id"
                    type="text"
                    className="form-control form-control-sm product-modal__input--readonly"
                    value={data.userId}
                    readOnly
                    tabIndex={-1}
                    placeholder=" "
                  />
                  <label htmlFor="user-edit-id">{t('users.col.userId')}</label>
                </div>
                <FloatingRow id="user-edit-nm" label={t('users.col.userNm')} required requiredLabel={t('common.requiredMark')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={userNm}
                    onChange={(ev) => setUserNm(ev.target.value)}
                    maxLength={128}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow
                  id="user-edit-email"
                  label={t('users.col.emailId')}
                  required
                  requiredLabel={t('common.requiredMark')}
                >
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={emailId}
                    onChange={(ev) => setEmailId(ev.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                <div className="form-floating mb-2">
                  <select
                    id="user-edit-grade"
                    className="form-select form-select-sm"
                    value={gradeCd}
                    onChange={(ev) => setGradeCd(ev.target.value)}
                  >
                    <option value="">{t('users.modal.gradeOptional')}</option>
                    {gradeCodes.map((c) => (
                      <option key={c.subCd} value={c.subCd}>
                        {c.codeNm || c.subCd}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="user-edit-grade">{t('users.col.grade')}</label>
                </div>
                <div className="form-floating mb-2 required">
                  <select
                    id="user-edit-auth"
                    className="form-select form-select-sm"
                    value={authGroup}
                    onChange={(ev) => setAuthGroup(ev.target.value)}
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
                  <label htmlFor="user-edit-auth">
                    {t('users.col.authGroup')}
                    <span className="text-primary ms-1" aria-hidden="true">
                      *
                    </span>
                  </label>
                </div>
                <div className="form-floating mb-2 required">
                  <select
                    id="user-edit-status"
                    className="form-select form-select-sm"
                    value={userStatus}
                    onChange={(ev) =>
                      setUserStatus(ev.target.value as (typeof STATUS_VALUES)[number])
                    }
                  >
                    {STATUS_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {t(`users.statusLabels.${s}`)}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="user-edit-status">
                    {t('users.col.userStatus')}
                    <span className="text-primary ms-1" aria-hidden="true">
                      *
                    </span>
                  </label>
                </div>
                <FloatingRow id="user-edit-mobile" label={t('users.modal.mobileNo')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={mobileNo}
                    onChange={(ev) => setMobileNo(ev.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="user-edit-corp" label={t('users.modal.corporationCd')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={corporationCd}
                    onChange={(ev) => setCorporationCd(ev.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="user-edit-newpw" label={t('users.modal.newPasswordHint')}>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={newPassword}
                    onChange={(ev) => setNewPassword(ev.target.value)}
                    autoComplete="new-password"
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
                {isPending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
