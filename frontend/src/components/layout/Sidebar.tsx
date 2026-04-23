import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPieChart, FiChevronRight } from 'react-icons/fi';
import { useTabStore, DASHBOARD_TAB_ID } from '@/store/useTabStore';
import { useAuthMe } from '@/hooks/useAuthMe';
import { readBoAllowedMenuIdsFromSession } from '@/utils/boAllowedMenuStorage';
import { renderBoMenuFiIcon } from '@/utils/boMenuFiIcon';
import type { BoSidebarMenu } from '@/api/auth';

function pickMenuName(m: BoSidebarMenu, lang: string): string {
  const normalizedLang = (lang || '').trim().toLowerCase();
  const primarySubtag = normalizedLang.split('-').find((part) => part && part.trim().length > 0);
  const l = primarySubtag || 'ko';
  if (l === 'en' && m.menuNmEn) return m.menuNmEn;
  if (l === 'ja' && m.menuNmJa) return m.menuNmJa;
  if (l === 'vi' && m.menuNmVi) return m.menuNmVi;
  return m.menuNmKo || m.menuId;
}

function buildChildrenByParent(menus: BoSidebarMenu[]): Map<string | null, BoSidebarMenu[]> {
  const map = new Map<string | null, BoSidebarMenu[]>();
  for (const m of menus) {
    const p = m.parentMenuId ?? null;
    if (!map.has(p)) map.set(p, []);
    map.get(p)!.push(m);
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => (a.dispSeq ?? 0) - (b.dispSeq ?? 0) || a.menuId.localeCompare(b.menuId));
  }
  return map;
}

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [collapsedHoverId, setCollapsedHoverId] = useState<string | null>(null);
  const { openTab, activeTabId } = useTabStore();
  const { data: authMe } = useAuthMe();
  const dashboardTitle = t('dashboard.title');

  const boMenus = authMe?.boSidebarMenus ?? [];
  const fromApi = authMe?.allowedMenuIds;
  const fromSession = readBoAllowedMenuIdsFromSession();
  const rawAllowed = fromApi ?? fromSession;

  const childrenByParent = useMemo(() => buildChildrenByParent(boMenus), [boMenus]);

  const rootMenus = useMemo(() => {
    const roots = childrenByParent.get(null) ?? [];
    return roots.filter((m) => m.menuId !== 'home');
  }, [childrenByParent]);

  const rootsWithSection = useMemo(() => {
    let prev: string | null = null;
    return rootMenus.map((group) => {
      const sec = group.sidebarSection ?? '';
      const showSection = sec !== '' && sec !== prev;
      prev = sec;
      return { group, showSection };
    });
  }, [rootMenus]);

  const favoriteIds = useMemo(() => {
    const fav = authMe?.favoriteMenuIds ?? [];
    const allowed = rawAllowed != null ? new Set(rawAllowed) : null;
    return fav.filter((id) => id && id !== 'home' && (allowed == null || allowed.has(id)));
  }, [authMe?.favoriteMenuIds, rawAllowed]);

  const menuById = useMemo(() => new Map(boMenus.map((m) => [m.menuId, m])), [boMenus]);

  const resolveFavoriteRow = useCallback(
    (menuId: string) => {
      const m = menuById.get(menuId);
      if (!m || m.menuType?.toUpperCase() !== 'PAGE' || !m.menuUrl) return null;
      return m;
    },
    [menuById],
  );

  const toggleMenu = (id: string) => {
    if (collapsed) return;
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openPageTab = (m: BoSidebarMenu) => {
    const title = pickMenuName(m, i18n.language);
    openTab({
      id: m.tabId || m.menuId,
      title,
      path: m.menuUrl || '/',
      icon: renderBoMenuFiIcon(m.icon, 14),
    });
  };

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
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

        {favoriteIds.length > 0 && (
          <>
            {!collapsed && <p className="sidebar__section-label">{t('sidebar.favorites')}</p>}
            <ul className="sidebar__nav sidebar__nav--favorites">
              {favoriteIds.map((fid) => {
                const m = resolveFavoriteRow(fid);
                if (!m) return null;
                const tabId = m.tabId || m.menuId;
                return (
                  <li key={fid}>
                    <button
                      type="button"
                      className={`sidebar__link ${activeTabId === tabId ? 'active' : ''}`}
                      onClick={() => openPageTab(m)}
                    >
                      {renderBoMenuFiIcon(m.icon, 16)}
                      {!collapsed && <span>{pickMenuName(m, i18n.language)}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {rootsWithSection.map(({ group, showSection }) => {
          const section = group.sidebarSection ?? '';

          const isPageRoot = group.menuType?.toUpperCase() === 'PAGE' && group.menuUrl;
          if (isPageRoot) {
            const tabId = group.tabId || group.menuId;
            return (
              <div key={group.menuId}>
                {!collapsed && showSection && section && <p className="sidebar__section-label">{section}</p>}
                <ul className="sidebar__nav">
                  <li>
                    <button
                      type="button"
                      className={`sidebar__link ${activeTabId === tabId ? 'active' : ''}`}
                      onClick={() => openPageTab(group)}
                    >
                      {renderBoMenuFiIcon(group.icon, 16)}
                      {!collapsed && <span>{pickMenuName(group, i18n.language)}</span>}
                    </button>
                  </li>
                </ul>
              </div>
            );
          }

          const sub = childrenByParent.get(group.menuId) ?? [];
          if (sub.length === 0) return null;

          const showPopover = collapsed && sub.length > 0 && collapsedHoverId === group.menuId;

          return (
            <div key={group.menuId}>
              {!collapsed && showSection && section && <p className="sidebar__section-label">{section}</p>}
              <ul className="sidebar__nav">
                <li className={collapsed && sub.length > 0 ? 'sidebar__li--has-popover' : ''}>
                  <div
                    className="sidebar__group-wrap"
                    onMouseEnter={() => collapsed && sub.length > 0 && setCollapsedHoverId(group.menuId)}
                    onMouseLeave={() => collapsed && setCollapsedHoverId(null)}
                  >
                    <button
                      type="button"
                      className={`sidebar__link sidebar__link--group ${openMenus[group.menuId] ? 'open' : ''} ${showPopover ? 'sidebar__link--hover' : ''}`}
                      onClick={() => toggleMenu(group.menuId)}
                    >
                      {renderBoMenuFiIcon(group.icon, 16)}
                      {!collapsed && (
                        <>
                          <span>{pickMenuName(group, i18n.language)}</span>
                          <FiChevronRight
                            size={12}
                            className={`sidebar__arrow ${openMenus[group.menuId] ? 'sidebar__arrow--open' : ''}`}
                          />
                        </>
                      )}
                    </button>
                    {collapsed && sub.length > 0 && (
                      <div className={`sidebar__popover ${showPopover ? 'sidebar__popover--show' : ''}`}>
                        <div className="sidebar__popover-title">{pickMenuName(group, i18n.language)}</div>
                        <ul className="sidebar__popover-list">
                          {sub.map((child) => {
                            const cid = child.tabId || child.menuId;
                            return (
                              <li key={child.menuId}>
                                <button
                                  type="button"
                                  className={`sidebar__popover-link ${activeTabId === cid ? 'active' : ''}`}
                                  onClick={() => {
                                    openPageTab(child);
                                    setCollapsedHoverId(null);
                                  }}
                                >
                                  {pickMenuName(child, i18n.language)}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  {openMenus[group.menuId] && !collapsed && (
                    <ul className="sidebar__sub">
                      {sub.map((child) => {
                        const cid = child.tabId || child.menuId;
                        return (
                          <li key={child.menuId}>
                            <button
                              type="button"
                              className={`sidebar__link sidebar__link--sub ${activeTabId === cid ? 'active' : ''}`}
                              onClick={() => openPageTab(child)}
                            >
                              {renderBoMenuFiIcon(child.icon, 14)}
                              <span>{pickMenuName(child, i18n.language)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
