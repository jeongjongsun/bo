import { useTranslation } from 'react-i18next';
import { useAuthMe } from '@/hooks/useAuthMe';

export function HomePage() {
  const { t } = useTranslation();
  const { data } = useAuthMe();

  if (!data) return null;

  return (
    <div className="home-page">
      <h2>{t('dashboard.title')}</h2>
      <p className="home-page__welcome">
        {t('dashboard.welcome', { name: data.user.name, userId: data.user.userId })}
      </p>
    </div>
  );
}
