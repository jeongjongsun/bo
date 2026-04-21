/**
 * 대시보드 화면. docs/02-개발-표준 - features/ 폴더 구조.
 */
import { useTranslation } from 'react-i18next';
import { useAuthMe } from '@/hooks/useAuthMe';

export function Dashboard() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useAuthMe();

  if (isLoading) return <div>{t('common.loading')}</div>;
  if (error) return <div>{t('common.error')}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome', { name: data.user.name, userId: data.user.userId })}</p>
      <p>{t('dashboard.permissions')}: {data.permissions.join(', ')}</p>
    </div>
  );
}
