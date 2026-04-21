import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { fetchCorporations } from '@/api/corporations';
import { useUserSettings, useSaveUserSettings, useProfile, useUpdateProfile } from './hooks';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export function UserSettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: corporations = [] } = useQuery({
    queryKey: ['corporations', 'list'],
    queryFn: fetchCorporations,
    staleTime: 5 * 60 * 1000,
  });
  const saveMutation = useSaveUserSettings();
  const updateProfileMutation = useUpdateProfile();

  const [orderSimpleViewYn, setOrderSimpleViewYn] = useState(false);
  const [defaultCorporationCd, setDefaultCorporationCd] = useState('');
  const [defaultOrderDateType, setDefaultOrderDateType] = useState<string>('ORDER_DT');
  const [orderBulkSaveUnmatchedYn, setOrderBulkSaveUnmatchedYn] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  useEffect(() => {
    if (settings) {
      setOrderSimpleViewYn(settings.orderSimpleViewYn ?? false);
      setDefaultCorporationCd(settings.defaultCorporationCd ?? '');
      setDefaultOrderDateType(settings.defaultOrderDateType ?? 'ORDER_DT');
      setOrderBulkSaveUnmatchedYn(settings.orderBulkSaveUnmatchedYn ?? false);
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name ?? '');
    }
  }, [profile]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasPassword = newPassword.trim() !== '' || newPasswordConfirm.trim() !== '';
    if (hasPassword && newPassword.trim() !== newPasswordConfirm.trim()) {
      showError(t('common.error'), t('settings.profile.password_mismatch'));
      return;
    }
    updateProfileMutation.mutate(
      {
        name: profileName.trim(),
        ...(newPassword.trim() ? { newPassword: newPassword.trim(), newPasswordConfirm: newPasswordConfirm.trim() } : {}),
      },
      {
        onSuccess: () => {
          showSuccess(t('common.saved'), t('settings.profile.saveSuccess'));
          setNewPassword('');
          setNewPasswordConfirm('');
        },
        onError: (err) =>
          showError(t('common.error'), getApiErrorMessage(err, t('settings.profile.saveFail'), t)),
      },
    );
  };

  /** 환경설정 항목 변경 시 즉시 저장 (저장 버튼 없이) */
  const saveSettings = useCallback(
    (patch: {
      orderSimpleViewYn?: boolean;
      defaultCorporationCd?: string | null;
      defaultOrderDateType?: 'ORDER_DT' | 'REGIST_DT';
      orderBulkSaveUnmatchedYn?: boolean;
    }) => {
      saveMutation.mutate(
        {
          orderSimpleViewYn: patch.orderSimpleViewYn ?? orderSimpleViewYn,
          defaultCorporationCd: patch.defaultCorporationCd !== undefined ? patch.defaultCorporationCd : (defaultCorporationCd || null),
          defaultOrderDateType: (patch.defaultOrderDateType ?? defaultOrderDateType) as 'ORDER_DT' | 'REGIST_DT',
          orderBulkSaveUnmatchedYn: patch.orderBulkSaveUnmatchedYn ?? orderBulkSaveUnmatchedYn,
        },
        {
          onError: (err) =>
            showError(t('common.error'), getApiErrorMessage(err, t('settings.saveFail'), t)),
        },
      );
    },
    [orderSimpleViewYn, defaultCorporationCd, defaultOrderDateType, orderBulkSaveUnmatchedYn, saveMutation, t],
  );

  if (settingsLoading && !settings) {
    return (
      <PageLayout title={t('settings.title')}>
        <div className="card shadow-none border">
          <div className="card-body">
            <p className="text-body-tertiary mb-0">{t('common.loading')}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t('settings.title')} lead={t('settings.lead')}>
      {/* 개인정보 */}
      <div className="card shadow-none border mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">{t('settings.profile.title')}</h5>
          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="form-floating mb-2">
              <input
                type="text"
                className="form-control"
                id="profileName"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder=" "
                aria-label={t('settings.profile.name')}
              />
              <label htmlFor="profileName">{t('settings.profile.name')}</label>
            </div>
            <div className="row mb-2">
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder=" "
                    aria-describedby="passwordHelp passwordComplexity"
                  />
                  <label htmlFor="newPassword">{t('settings.profile.newPassword')}</label>
                </div>
              </div>
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input
                    type="password"
                    className="form-control"
                    id="newPasswordConfirm"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder=" "
                  />
                  <label htmlFor="newPasswordConfirm">{t('settings.profile.newPasswordConfirm')}</label>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-12">
                <div id="passwordHelp" className="form-text mb-2">
                  {t('settings.profile.passwordHelp')}
                </div>
                <div id="passwordComplexity" className="form-text mb-2">
                  {t('settings.profile.passwordComplexity')}
                </div>
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateProfileMutation.isPending || profileLoading}
              >
                {updateProfileMutation.isPending ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 환경설정 (주문 간편 보기, 기본 법인) — 변경 시 즉시 저장 */}
      <div className="card shadow-none border settings-preferences-card">
        <div className="card-body">
          <div className="settings-form">
            <div className="row mb-4">
              <div className="col-6">
                <h5 className="card-title mb-3">{t('settings.orderSimpleView.title')}</h5>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="orderSimpleViewYn"
                    checked={orderSimpleViewYn}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setOrderSimpleViewYn(v);
                      saveSettings({ orderSimpleViewYn: v });
                    }}
                    disabled={saveMutation.isPending}
                    aria-describedby="orderSimpleViewHelp"
                  />
                  <label className="form-check-label" htmlFor="orderSimpleViewYn">
                    {t('settings.orderSimpleView.label')}
                  </label>
                </div>
                <div id="orderSimpleViewHelp" className="form-text">
                  {t('settings.orderSimpleView.help')}
                </div>
              </div>
              <div className="col-6">
                <h5 className="card-title mb-3">{t('settings.orderBulkSaveUnmatched.title')}</h5>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="orderBulkSaveUnmatchedYn"
                    checked={orderBulkSaveUnmatchedYn}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setOrderBulkSaveUnmatchedYn(v);
                      saveSettings({ orderBulkSaveUnmatchedYn: v });
                    }}
                    disabled={saveMutation.isPending}
                    aria-describedby="orderBulkSaveUnmatchedHelp"
                  />
                  <label className="form-check-label" htmlFor="orderBulkSaveUnmatchedYn">
                    {t('settings.orderBulkSaveUnmatched.label')}
                  </label>
                </div>
                <div id="orderBulkSaveUnmatchedHelp" className="form-text">
                  {t('settings.orderBulkSaveUnmatched.help')}
                </div>
              </div>
            </div>

            <hr className="my-4" />
            <div className="row mb-4">
              <div className="col-6">
                <h5 className="card-title mb-3">{t('settings.defaultCorporation.title')}</h5>
                <div className="form-floating mb-2">
                  <select
                    className="form-select w-auto"
                    id="defaultCorporationCd"
                    value={defaultCorporationCd}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDefaultCorporationCd(v);
                      saveSettings({ defaultCorporationCd: v || null });
                    }}
                    disabled={saveMutation.isPending}
                    aria-label={t('settings.defaultCorporation.label')}
                  >
                    <option value="">{t('settings.defaultCorporation.none')}</option>
                    {corporations.map((c) => (
                      <option key={c.corporationCd} value={c.corporationCd}>
                        {c.corporationNm} ({c.corporationCd})
                      </option>
                    ))}
                  </select>
                  <label htmlFor="defaultCorporationCd">{t('settings.defaultCorporation.label')}</label>
                </div>
                <div className="form-text">{t('settings.defaultCorporation.help')}</div>
              </div>
              <div className="col-6">
                <h5 className="card-title mb-3">{t('settings.defaultOrderDateType.title')}</h5>
                <div className="form-floating mb-2">
                  <select
                    className="form-select w-auto"
                    id="defaultOrderDateType"
                    value={defaultOrderDateType}
                    onChange={(e) => {
                      const v = e.target.value as 'ORDER_DT' | 'REGIST_DT';
                      setDefaultOrderDateType(v);
                      saveSettings({ defaultOrderDateType: v });
                    }}
                    disabled={saveMutation.isPending}
                    aria-label={t('settings.defaultOrderDateType.label')}
                  >
                    <option value="ORDER_DT">{t('settings.defaultOrderDateType.orderDt')}</option>
                    <option value="REGIST_DT">{t('settings.defaultOrderDateType.registDt')}</option>
                  </select>
                  <label htmlFor="defaultOrderDateType">{t('settings.defaultOrderDateType.label')}</label>
                </div>
                <div className="form-text">{t('settings.defaultOrderDateType.help')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
