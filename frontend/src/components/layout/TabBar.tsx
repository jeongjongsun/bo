import { FiX, FiPieChart } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTabStore, DASHBOARD_TAB_ID } from '@/store/useTabStore';

export function TabBar() {
  const { t } = useTranslation();
  const { tabs, activeTabId, setActiveTab, closeTab, closeAllTabsExceptDashboard } = useTabStore();

  if (tabs.length === 0) return null;

  const hasNonDashboardTabs = tabs.some((tab) => tab.id !== DASHBOARD_TAB_ID);

  return (
    <div className="tab-bar">
      <ul className="tab-bar__list">
        {tabs.map((tab) => {
          const isDashboardTab = tab.id === DASHBOARD_TAB_ID;
          const tabLabel = isDashboardTab ? t('dashboard.title') : tab.title;
          const tabIcon = tab.icon ?? (isDashboardTab ? <FiPieChart size={14} /> : null);
          return (
            <li key={tab.id} className="tab-bar__item">
              <button
                className={`tab-bar__tab ${tab.id === activeTabId ? 'tab-bar__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tabIcon != null && <span className="tab-bar__icon">{tabIcon}</span>}
                <span className="tab-bar__title">{tabLabel}</span>
                {!isDashboardTab && (
                  <span
                    className="tab-bar__close"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    role="button"
                    aria-label="Close tab"
                  >
                    <FiX size={14} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {hasNonDashboardTabs && (
        <button
          type="button"
          className="tab-bar__close-all"
          onClick={closeAllTabsExceptDashboard}
          aria-label={t('tabs.closeAll')}
        >
          {t('tabs.closeAll')}
        </button>
      )}
    </div>
  );
}
