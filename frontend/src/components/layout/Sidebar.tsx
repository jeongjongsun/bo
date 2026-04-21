import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiPieChart, FiShoppingCart, FiPackage, FiXCircle, FiRefreshCw,
  FiHome, FiGlobe, FiBriefcase, FiMap, FiGrid, FiList,
  FiGift, FiLink, FiKey, FiLayers,
  FiChevronRight,
  FiShoppingBag, FiSettings,
  FiDatabase, FiUsers, FiSliders, FiHash, FiMenu, FiShield,
  FiFileText, FiClipboard, FiAlertCircle,
} from 'react-icons/fi';
import { useTabStore, DASHBOARD_TAB_ID } from '@/store/useTabStore';

interface SubMenu {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  id: string;
  section: string;
  label: string;
  icon: React.ReactNode;
  /** 단일 메뉴일 때 직접 이동 경로 (children 없이 사용) */
  path?: string;
  children: SubMenu[];
}

const menuData: MenuGroup[] = [
  {
    id: 'basic',
    section: '기초정보',
    label: '기초정보',
    icon: <FiDatabase size={16} />,
    children: [
      { id: 'basic-shipper', label: '화주(법인) 정보', path: '/basic/shipper', icon: <FiBriefcase size={14} /> },
      { id: 'basic-users', label: '사용자 정보', path: '/basic/users', icon: <FiUsers size={14} /> },
    ],
  },
  {
    id: 'system',
    section: '운영환경 설정',
    label: '운영환경 설정',
    icon: <FiSliders size={16} />,
    children: [
      { id: 'system-common-code', label: '공통코드', path: '/system/common-code', icon: <FiHash size={14} /> },
      { id: 'system-menus', label: '메뉴관리', path: '/system/menus', icon: <FiMenu size={14} /> },
      { id: 'system-authorities', label: '권한관리', path: '/system/authorities', icon: <FiShield size={14} /> },
      { id: 'settings', label: '환경설정', path: '/settings', icon: <FiSettings size={14} /> },
    ],
  },
  {
    id: 'logs',
    section: '로그정보',
    label: '로그정보',
    icon: <FiFileText size={16} />,
    children: [
      { id: 'log-audit', label: '감사이력', path: '/log/audit', icon: <FiClipboard size={14} /> },
      { id: 'log-error', label: '에러이력', path: '/log/error', icon: <FiAlertCircle size={14} /> },
    ],
  },
  {
    id: 'order', section: 'Apps', label: '주문 관리', icon: <FiShoppingCart size={16} />,
    children: [
      { id: 'order-domestic-b2c', label: '국내 B2C 주문', path: '/order', icon: <FiHome size={14} /> },
      { id: 'order-overseas-b2c', label: '해외 B2C 주문', path: '/order/overseas-b2c', icon: <FiGlobe size={14} /> },
      { id: 'order-domestic-b2b', label: '국내 B2B 주문', path: '/order/domestic-b2b', icon: <FiBriefcase size={14} /> },
      { id: 'order-overseas-b2b', label: '해외 B2B 주문', path: '/order/overseas-b2b', icon: <FiMap size={14} /> },
      { id: 'order-other', label: '기타주문', path: '/order/other', icon: <FiGrid size={14} /> },
      { id: 'order-unmatched', label: '비매칭 주문', path: '/order/unmatched', icon: <FiXCircle size={14} /> },
    ],
  },
  {
    id: 'order-claim', section: 'Apps', label: '클레임 주문', icon: <FiRefreshCw size={16} />,
    path: '/order/claim',
    children: [],
  },
  {
    id: 'mall', section: 'Apps', label: '쇼핑몰 관리', icon: <FiShoppingBag size={16} />,
    children: [
      { id: 'mall-list', label: '쇼핑몰/상점 관리', path: '/mall', icon: <FiLayers size={14} /> },
      { id: 'mall-connection', label: '접속정보 관리', path: '/mall/connection', icon: <FiKey size={14} /> },
    ],
  },
  {
    id: 'product', section: 'Apps', label: '상품 관리', icon: <FiPackage size={16} />,
    children: [
      { id: 'product-info', label: '상품 정보', path: '/product', icon: <FiList size={14} /> },
      { id: 'product-gift', label: '사은품 지급 설정', path: '/product/gift', icon: <FiGift size={14} /> },
      { id: 'product-matching', label: '매칭 정보', path: '/product/matching', icon: <FiLink size={14} /> },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { t } = useTranslation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [collapsedHoverId, setCollapsedHoverId] = useState<string | null>(null);
  const { openTab, activeTabId } = useTabStore();
  const dashboardTitle = t('dashboard.title');

  const toggleMenu = (id: string) => {
    if (collapsed) return;
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [...new Set(menuData.map((g) => g.section))];

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* 로고 — 클릭 시 대시보드 탭으로 열림 */}
      <div className="sidebar__brand">
        <button
          type="button"
          className="sidebar__brand-btn"
          onClick={() => openTab({ id: DASHBOARD_TAB_ID, title: dashboardTitle, path: '/' })}
          aria-label={dashboardTitle}
        >
          <img src="/img/icons/logo.png" alt="OMS BackOffice" width={27} />
          {!collapsed && <h5>OMS BackOffice</h5>}
        </button>
      </div>

      <div className="sidebar__content">
        {/* 대시보드 — 닫을 수 없는 기본 탭 */}
        <ul className="sidebar__nav">
          <li>
            <button
              type="button"
              className={`sidebar__link ${activeTabId === DASHBOARD_TAB_ID ? 'active' : ''}`}
              onClick={() => openTab({ id: DASHBOARD_TAB_ID, title: dashboardTitle, path: '/' })}
            >
              <FiPieChart size={16} />
              {!collapsed && <span>{dashboardTitle}</span>}
            </button>
          </li>
        </ul>

        {/* Menu groups by section */}
        {sections.map((section) => (
          <div key={section}>
            {!collapsed && <p className="sidebar__section-label">{section}</p>}
            <ul className="sidebar__nav">
              {menuData
                .filter((g) => g.section === section)
                .map((group) => {
                  const isSingle = group.path != null && group.children.length === 0;
                  if (isSingle) {
                    return (
                      <li key={group.id}>
                        <button
                          className={`sidebar__link ${activeTabId === group.id ? 'active' : ''}`}
                          onClick={() =>
                            openTab({ id: group.id, title: group.label, path: group.path!, icon: group.icon })
                          }
                        >
                          {group.icon}
                          {!collapsed && <span>{group.label}</span>}
                        </button>
                      </li>
                    );
                  }
                  const showPopover = collapsed && group.children.length > 0 && collapsedHoverId === group.id;
                  return (
                    <li key={group.id} className={collapsed && group.children.length > 0 ? 'sidebar__li--has-popover' : ''}>
                      <div
                        className="sidebar__group-wrap"
                        onMouseEnter={() => collapsed && group.children.length > 0 && setCollapsedHoverId(group.id)}
                        onMouseLeave={() => collapsed && setCollapsedHoverId(null)}
                      >
                        <button
                          type="button"
                          className={`sidebar__link sidebar__link--group ${openMenus[group.id] ? 'open' : ''} ${showPopover ? 'sidebar__link--hover' : ''}`}
                          onClick={() => toggleMenu(group.id)}
                        >
                          {group.icon}
                          {!collapsed && (
                            <>
                              <span>{group.label}</span>
                              <FiChevronRight
                                size={12}
                                className={`sidebar__arrow ${openMenus[group.id] ? 'sidebar__arrow--open' : ''}`}
                              />
                            </>
                          )}
                        </button>
                        {collapsed && group.children.length > 0 && (
                          <div className={`sidebar__popover ${showPopover ? 'sidebar__popover--show' : ''}`}>
                            <div className="sidebar__popover-title">{group.label}</div>
                            <ul className="sidebar__popover-list">
                              {group.children.map((child) => (
                                <li key={child.id}>
                                  <button
                                    type="button"
                                    className={`sidebar__popover-link ${activeTabId === child.id ? 'active' : ''}`}
                                    onClick={() => {
                                      openTab({ id: child.id, title: child.label, path: child.path, icon: child.icon });
                                      setCollapsedHoverId(null);
                                    }}
                                  >
                                    {child.label}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {openMenus[group.id] && !collapsed && (
                        <ul className="sidebar__sub">
                          {group.children.map((child) => (
                            <li key={child.id}>
                              <button
                                type="button"
                                className={`sidebar__link sidebar__link--sub ${activeTabId === child.id ? 'active' : ''}`}
                                onClick={() =>
                                  openTab({ id: child.id, title: child.label, path: child.path, icon: child.icon })
                                }
                              >
                                {child.icon}
                                <span>{child.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
