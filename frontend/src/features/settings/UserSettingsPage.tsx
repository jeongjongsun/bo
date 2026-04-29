import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '@/components/layout/PageLayout';
import { useSaveSystemConfig, useSystemConfig } from './hooks';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useHasMenuActionPermissionByPath } from '@/hooks/useActionPermission';

export function UserSettingsPage() {
  const { t } = useTranslation();
  const canUpdate = useHasMenuActionPermissionByPath('/settings', 'update');
  const { data: systemConfig, isLoading: systemConfigLoading } = useSystemConfig();
  const saveSystemConfigMutation = useSaveSystemConfig();
  const [maxPasswordFailCount, setMaxPasswordFailCount] = useState(5);
  const [maxInactiveLoginDays, setMaxInactiveLoginDays] = useState(90);
  const [allowDuplicateLogin, setAllowDuplicateLogin] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPasswordEnc, setSmtpPasswordEnc] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [smtpUseTls, setSmtpUseTls] = useState(true);
  const [smtpUseSsl, setSmtpUseSsl] = useState(false);
  const [smtpAuthRequired, setSmtpAuthRequired] = useState(true);
  const [smtpConnectionTimeoutMs, setSmtpConnectionTimeoutMs] = useState(10000);
  const [smtpReadTimeoutMs, setSmtpReadTimeoutMs] = useState(10000);
  const [smtpWriteTimeoutMs, setSmtpWriteTimeoutMs] = useState(10000);

  useEffect(() => {
    if (systemConfig) {
      setMaxPasswordFailCount(systemConfig.maxPasswordFailCount ?? 5);
      setMaxInactiveLoginDays(systemConfig.maxInactiveLoginDays ?? 90);
      setAllowDuplicateLogin(!!systemConfig.allowDuplicateLogin);
      setSmtpHost(systemConfig.smtpHost ?? '');
      setSmtpPort(systemConfig.smtpPort != null ? String(systemConfig.smtpPort) : '');
      setSmtpUsername(systemConfig.smtpUsername ?? '');
      setSmtpPasswordEnc(systemConfig.smtpPasswordEnc ?? '');
      setSmtpFromEmail(systemConfig.smtpFromEmail ?? '');
      setSmtpFromName(systemConfig.smtpFromName ?? '');
      setSmtpUseTls(systemConfig.smtpUseTls ?? true);
      setSmtpUseSsl(systemConfig.smtpUseSsl ?? false);
      setSmtpAuthRequired(systemConfig.smtpAuthRequired ?? true);
      setSmtpConnectionTimeoutMs(systemConfig.smtpConnectionTimeoutMs ?? 10000);
      setSmtpReadTimeoutMs(systemConfig.smtpReadTimeoutMs ?? 10000);
      setSmtpWriteTimeoutMs(systemConfig.smtpWriteTimeoutMs ?? 10000);
    }
  }, [systemConfig]);

  const handleSystemConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;
    saveSystemConfigMutation.mutate(
      {
        maxPasswordFailCount,
        maxInactiveLoginDays,
        allowDuplicateLogin,
        smtpHost: smtpHost.trim() || null,
        smtpPort: smtpPort.trim() ? Number(smtpPort) : null,
        smtpUsername: smtpUsername.trim() || null,
        smtpPasswordEnc: smtpPasswordEnc.trim() || null,
        smtpFromEmail: smtpFromEmail.trim() || null,
        smtpFromName: smtpFromName.trim() || null,
        smtpUseTls,
        smtpUseSsl,
        smtpAuthRequired,
        smtpConnectionTimeoutMs,
        smtpReadTimeoutMs,
        smtpWriteTimeoutMs,
      },
      {
        onSuccess: () => showSuccess(t('common.saved'), t('settings.system.saveSuccess')),
        onError: (err) =>
          showError(t('common.error'), getApiErrorMessage(err, t('settings.system.saveFail'), t)),
      },
    );
  };

  if (systemConfigLoading && !systemConfig) {
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
      <form onSubmit={handleSystemConfigSubmit} className="settings-form">
        <div className="card shadow-none border mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">{t('settings.system.title')}</h5>
            <div className="row mb-3">
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input
                    type="number"
                    className="form-control"
                    id="maxPasswordFailCount"
                    min={1}
                    value={maxPasswordFailCount}
                    onChange={(e) => setMaxPasswordFailCount(Number(e.target.value || 1))}
                    placeholder=" "
                  />
                  <label htmlFor="maxPasswordFailCount">{t('settings.system.maxPasswordFailCount')}</label>
                </div>
              </div>
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input
                    type="number"
                    className="form-control"
                    id="maxInactiveLoginDays"
                    min={0}
                    value={maxInactiveLoginDays}
                    onChange={(e) => setMaxInactiveLoginDays(Number(e.target.value || 0))}
                    placeholder=" "
                  />
                  <label htmlFor="maxInactiveLoginDays">{t('settings.system.maxInactiveLoginDays')}</label>
                </div>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-6">
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="allowDuplicateLogin"
                    checked={allowDuplicateLogin}
                    onChange={(e) => setAllowDuplicateLogin(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="allowDuplicateLogin">
                    {t('settings.system.allowDuplicateLogin')}
                  </label>
                </div>
              </div>
            </div>
        </div>
      </div>

      <div className="card shadow-none border mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">{t('settings.system.emailTitle')}</h5>
          <div>
            <div className="row mb-3">
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input type="text" className="form-control" id="smtpHost" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder=" " />
                  <label htmlFor="smtpHost">{t('settings.system.smtpHost')}</label>
                </div>
              </div>
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input type="number" className="form-control" id="smtpPort" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder=" " />
                  <label htmlFor="smtpPort">{t('settings.system.smtpPort')}</label>
                </div>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input type="text" className="form-control" id="smtpUsername" value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} placeholder=" " />
                  <label htmlFor="smtpUsername">{t('settings.system.smtpUsername')}</label>
                </div>
              </div>
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input type="password" className="form-control" id="smtpPasswordEnc" value={smtpPasswordEnc} onChange={(e) => setSmtpPasswordEnc(e.target.value)} placeholder=" " />
                  <label htmlFor="smtpPasswordEnc">{t('settings.system.smtpPasswordEnc')}</label>
                </div>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input type="email" className="form-control" id="smtpFromEmail" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} placeholder=" " />
                  <label htmlFor="smtpFromEmail">{t('settings.system.smtpFromEmail')}</label>
                </div>
              </div>
              <div className="col-6">
                <div className="form-floating mb-2">
                  <input type="text" className="form-control" id="smtpFromName" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder=" " />
                  <label htmlFor="smtpFromName">{t('settings.system.smtpFromName')}</label>
                </div>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-4">
                <div className="form-check form-switch mt-2">
                  <input className="form-check-input" type="checkbox" role="switch" id="smtpUseTls" checked={smtpUseTls} onChange={(e) => setSmtpUseTls(e.target.checked)} />
                  <label className="form-check-label" htmlFor="smtpUseTls">{t('settings.system.smtpUseTls')}</label>
                </div>
              </div>
              <div className="col-4">
                <div className="form-check form-switch mt-2">
                  <input className="form-check-input" type="checkbox" role="switch" id="smtpUseSsl" checked={smtpUseSsl} onChange={(e) => setSmtpUseSsl(e.target.checked)} />
                  <label className="form-check-label" htmlFor="smtpUseSsl">{t('settings.system.smtpUseSsl')}</label>
                </div>
              </div>
              <div className="col-4">
                <div className="form-check form-switch mt-2">
                  <input className="form-check-input" type="checkbox" role="switch" id="smtpAuthRequired" checked={smtpAuthRequired} onChange={(e) => setSmtpAuthRequired(e.target.checked)} />
                  <label className="form-check-label" htmlFor="smtpAuthRequired">{t('settings.system.smtpAuthRequired')}</label>
                </div>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-4">
                <div className="form-floating mb-2">
                  <input type="number" className="form-control" id="smtpConnectionTimeoutMs" min={0} value={smtpConnectionTimeoutMs} onChange={(e) => setSmtpConnectionTimeoutMs(Number(e.target.value || 0))} placeholder=" " />
                  <label htmlFor="smtpConnectionTimeoutMs">{t('settings.system.smtpConnectionTimeoutMs')}</label>
                </div>
              </div>
              <div className="col-4">
                <div className="form-floating mb-2">
                  <input type="number" className="form-control" id="smtpReadTimeoutMs" min={0} value={smtpReadTimeoutMs} onChange={(e) => setSmtpReadTimeoutMs(Number(e.target.value || 0))} placeholder=" " />
                  <label htmlFor="smtpReadTimeoutMs">{t('settings.system.smtpReadTimeoutMs')}</label>
                </div>
              </div>
              <div className="col-4">
                <div className="form-floating mb-2">
                  <input type="number" className="form-control" id="smtpWriteTimeoutMs" min={0} value={smtpWriteTimeoutMs} onChange={(e) => setSmtpWriteTimeoutMs(Number(e.target.value || 0))} placeholder=" " />
                  <label htmlFor="smtpWriteTimeoutMs">{t('settings.system.smtpWriteTimeoutMs')}</label>
                </div>
              </div>
            </div>
            <div className="form-text mb-3">{t('settings.system.help')}</div>
            <div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saveSystemConfigMutation.isPending || systemConfigLoading || !canUpdate}
              >
                {saveSystemConfigMutation.isPending ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
      </form>
    </PageLayout>
  );
}
