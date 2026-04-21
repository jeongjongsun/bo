import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaRegUser } from 'react-icons/fa';
import { FiKey, FiEye, FiEyeOff, FiGlobe } from 'react-icons/fi';
import { login } from '@/api/auth';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { showError } from '@/utils/swal';

const SAVED_USER_KEY = 'savedUserId';

function getSavedUserId(): string {
  return localStorage.getItem(SAVED_USER_KEY) ?? '';
}

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState(getSavedUserId);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!getSavedUserId());
  const [wasValidated, setWasValidated] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      if (rememberMe) {
        localStorage.setItem(SAVED_USER_KEY, userId);
      } else {
        localStorage.removeItem(SAVED_USER_KEY);
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate('/', { replace: true });
    },
    onError: (err: unknown) => {
      const message = getApiErrorMessage(err, t('login.error.fail'), t);
      void showError(t('common.error'), message);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      e.stopPropagation();
      setWasValidated(true);
      return;
    }
    setWasValidated(true);
    loginMutation.mutate({ userId, password });
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const isServerPending = loginMutation.isPending;

  return (
    <div className="login-wrapper">
      {/* 언어 선택 */}
      <div className="language-selector">
        <FiGlobe size={14} />
        <label>{t('login.language')}</label>
        <select
          value={['ko', 'en', 'ja', 'vi'].includes(i18n.language) ? i18n.language : (i18n.language?.startsWith('ko') ? 'ko' : 'en')}
          onChange={(e) => changeLanguage(e.target.value)}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="vi">Tiếng Việt</option>
        </select>
      </div>

      <div className="login-container">
        {/* 로고 */}
        <div className="login-logo">
          <a href="/">
            <img src="/img/icons/logo.png" alt="ShopEasy" />
          </a>
        </div>

        {/* 제목 */}
        <div className="login-header">
          <h3>{t('login.title')}</h3>
        </div>

        <form
          noValidate
          className={wasValidated ? 'needs-validation was-validated' : 'needs-validation'}
          onSubmit={handleSubmit}
        >
          {/* 아이디 */}
          <div className="login-field">
            <label htmlFor="userId">{t('login.userId')}</label>
            <div className="input-icon-wrapper">
              <span className="input-icon"><FaRegUser size={14} /></span>
              <input
                id="userId"
                name="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={t('login.userId.placeholder')}
                autoComplete="username"
                autoFocus
                required
                disabled={isServerPending}
              />
            </div>
            <div className="invalid-feedback">{t('login.validation.userIdRequired')}</div>
          </div>

          {/* 비밀번호 */}
          <div className="login-field">
            <label htmlFor="password">{t('login.password')}</label>
            <div className="input-icon-wrapper">
              <span className="input-icon"><FiKey size={14} /></span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.password.placeholder')}
                autoComplete="current-password"
                required
                disabled={isServerPending}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <div className="invalid-feedback">{t('login.validation.passwordRequired')}</div>
          </div>

          {/* 아이디 저장 */}
          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isServerPending}
              />
              <span>{t('login.rememberMe')}</span>
            </label>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="login-btn"
            disabled={isServerPending}
          >
            {isServerPending ? t('login.button.loading') : t('login.button')}
          </button>
        </form>
      </div>
    </div>
  );
}
