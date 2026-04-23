import { useTabStore } from '@/store/useTabStore';
import { getPageComponent } from '@/pages/pageRegistry';
import { TabPanePathProvider } from '@/components/layout/TabPanePathContext';
import { normalizeBoPathname } from '@/config/boAppRoutes';

/**
 * 탭 콘텐츠 영역.
 * 열려있는 모든 탭의 컴포넌트를 mounted 상태로 유지하고,
 * 활성 탭만 display:block, 나머지는 display:none.
 * → 탭 전환 시 입력값·스크롤 등 상태가 보존됨.
 * 대시보드는 초기 탭(useTabStore)으로 항상 탭 구조로 표시됨.
 */
export function TabContent() {
  const { tabs, activeTabId } = useTabStore();

  return (
    <>
      {tabs.map((tab) => {
        const PageComponent = getPageComponent(tab.path);
        if (!PageComponent) return null;

        const panePath = normalizeBoPathname((tab.path || '/').split('?')[0] || '/');

        return (
          <div
            key={tab.id}
            className="tab-content__pane"
            style={{ display: tab.id === activeTabId ? 'block' : 'none' }}
          >
            <TabPanePathProvider path={panePath}>
              <PageComponent tab={tab} />
            </TabPanePathProvider>
          </div>
        );
      })}
    </>
  );
}
