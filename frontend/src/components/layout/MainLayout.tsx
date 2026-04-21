import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { TabBar } from './TabBar';
import { TabContent } from './TabContent';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`layout ${sidebarCollapsed ? 'layout--collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} />
      <div id="modal-portal" />
      <div className="layout__main">
        <TopNavbar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <TabBar />
        <div className="layout__content">
          <TabContent />
        </div>
      </div>
    </div>
  );
}
