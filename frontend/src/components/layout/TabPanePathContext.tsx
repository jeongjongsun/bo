import { createContext, useContext, type ReactNode } from 'react';

/**
 * TabContent가 각 탭 패인에 주입하는 브라우저 주소와 무관한 "이 탭의 경로".
 * 탭 UI에서는 URL이 / 인 채로 tab.path만 바뀌므로 PageLayout 등에서 useLocation 대신 사용.
 */
const TabPanePathContext = createContext<string | null>(null);

export function TabPanePathProvider({ path, children }: { path: string; children: ReactNode }) {
  return <TabPanePathContext.Provider value={path}>{children}</TabPanePathContext.Provider>;
}

export function useTabPanePath(): string | null {
  return useContext(TabPanePathContext);
}
