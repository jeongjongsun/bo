import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface TabItem {
  id: string;
  title: string;
  path: string;
  /** 탭 제목 앞에 표시할 아이콘 (메뉴에서 열 때 전달) */
  icon?: ReactNode;
  /** 탭별 추가 데이터 (예: productId) */
  data?: Record<string, unknown>;
}

interface TabState {
  tabs: TabItem[];
  activeTabId: string | null;
  openTab: (tab: TabItem) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  /** 대시보드를 제외한 모든 탭 닫기 */
  closeAllTabsExceptDashboard: () => void;
}

const TabContext = createContext<TabState | null>(null);

type TabStateInner = { tabs: TabItem[]; activeTabId: string | null };

/** 대시보드 탭 id (Sidebar·TabProvider 등에서 단일 소스로 사용) */
export const DASHBOARD_TAB_ID = 'home';

export function TabProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [state, setState] = useState<TabStateInner>(() => ({
    tabs: [{ id: DASHBOARD_TAB_ID, title: t('dashboard.title'), path: '/' }],
    activeTabId: DASHBOARD_TAB_ID,
  }));
  const { tabs, activeTabId } = state;

  const openTab = useCallback((tab: TabItem) => {
    setState((prev) => {
      const exists = prev.tabs.find((t) => t.id === tab.id);
      if (exists) {
        const nextTabs = prev.tabs.map((t) =>
          t.id === tab.id
            ? {
                ...t,
                title: tab.title ?? t.title,
                path: tab.path,
                icon: tab.icon ?? t.icon,
                data: tab.data !== undefined ? tab.data : t.data,
              }
            : t,
        );
        return { tabs: nextTabs, activeTabId: tab.id };
      }
      return { tabs: [...prev.tabs, tab], activeTabId: tab.id };
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setState((prev) => {
      const idx = prev.tabs.findIndex((t) => t.id === id);
      const nextTabs = prev.tabs.filter((t) => t.id !== id);
      const nextActive =
        id === prev.activeTabId && nextTabs.length > 0
          ? nextTabs[Math.min(idx, nextTabs.length - 1)].id
          : nextTabs.length === 0
            ? null
            : prev.activeTabId;
      return { tabs: nextTabs, activeTabId: nextActive };
    });
  }, []);

  const setActiveTab = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeTabId: id }));
  }, []);

  const closeAllTabsExceptDashboard = useCallback(() => {
    setState((prev) => {
      const dashboardTab = prev.tabs.find((t) => t.id === DASHBOARD_TAB_ID);
      const nextTabs = dashboardTab ? [dashboardTab] : prev.tabs;
      return { tabs: nextTabs, activeTabId: DASHBOARD_TAB_ID };
    });
  }, []);

  return (
    <TabContext.Provider value={{ tabs, activeTabId, openTab, closeTab, setActiveTab, closeAllTabsExceptDashboard }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabStore() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTabStore must be used inside TabProvider');
  return ctx;
}
