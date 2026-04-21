import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import { logout } from '@/api/auth';
import { fetchCorporations } from '@/api/corporations';
import { useAuthMe } from '@/hooks/useAuthMe';
import { useUserSettings } from '@/features/settings/hooks';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useCorporationStore } from '@/store/useCorporationStore';

interface TopNavbarProps {
  onMenuToggle: () => void;
}

export function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useAuthMe();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { corporationCd, setCorporation } = useCorporationStore();
  const { data: userSettings, isFetched: userSettingsFetched } = useUserSettings();

  const { data: corporations = [] } = useQuery({
    queryKey: ['corporations', 'list'],
    queryFn: fetchCorporations,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (corporations.length === 0 || corporationCd) return;
    if (!userSettingsFetched) return;
    const defaultCd = userSettings?.defaultCorporationCd;
    const corp = defaultCd
      ? corporations.find((c) => c.corporationCd === defaultCd)
      : null;
    const target = corp ?? corporations[0];
    setCorporation(target.corporationCd, target.corporationNm);
  }, [corporations, corporationCd, userSettingsFetched, userSettings?.defaultCorporationCd, setCorporation]);

  const handleCorporationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cd = e.target.value;
      const corp = corporations.find((c) => c.corporationCd === cd);
      setCorporation(cd, corp?.corporationNm ?? '');
    },
    [corporations, setCorporation],
  );

  useClickOutside(userMenuRef, () => setUserMenuOpen(false), userMenuOpen);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setCorporation('', '');
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  };

  const userName = data?.user?.name ?? '';
  const userEmail = data?.user?.userId ?? '';
  const avatarLabel =
    userName.length >= 2 ? userName.slice(-2) : userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <header className="topnav">
      <div className="topnav__left">
        <button className="topnav__menu-btn" onClick={onMenuToggle}>
          <FiMenu size={20} />
        </button>
      </div>

      <div className="topnav__right">
        {/* 법인 선택 */}
        <div className="topnav__lang">
          <select value={corporationCd} onChange={handleCorporationChange}>
            <option value="">{t('corporation.select')}</option>
            {corporations.map((c) => (
              <option key={c.corporationCd} value={c.corporationCd}>
                {c.corporationNm} ({c.corporationCd})
              </option>
            ))}
          </select>
        </div>

        {/* 언어 선택 */}
        <div className="topnav__lang">
          <select
            value={
              i18n.language.startsWith('ko')
                ? 'ko'
                : i18n.language.startsWith('ja')
                  ? 'ja'
                  : i18n.language.startsWith('vi')
                    ? 'vi'
                    : 'en'
            }
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>

        {/* 사용자 메뉴 */}
        <div className="topnav__user" ref={userMenuRef}>
          <button
            className="topnav__avatar-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="topnav__avatar">
              {avatarLabel}
            </div>
          </button>

          {userMenuOpen && (
            <div className="topnav__dropdown">
              <div className="topnav__dropdown-header">
                <div className="topnav__avatar topnav__avatar--lg">
                  {avatarLabel}
                </div>
                <h6>{userName}</h6>
                <p>{userEmail}</p>
              </div>
              <div className="topnav__dropdown-footer">
                <button className="topnav__logout-btn" onClick={handleLogout}>
                  <FiLogOut size={16} />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
