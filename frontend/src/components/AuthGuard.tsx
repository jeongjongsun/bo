import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthMe } from '@/hooks/useAuthMe';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 인증 필요 라우트를 감싸는 가드.
 * /api/v1/auth/me 실패 시 → /login 리다이렉트.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useAuthMe();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <p>{t('auth.checking')}</p>
      </div>
    );
  }

  if (isError || !data) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
