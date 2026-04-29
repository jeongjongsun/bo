import { type ComponentType } from 'react';
import type { TabItem } from '@/store/useTabStore';
import { PageLayout } from '@/components/layout/PageLayout';
import { HomePage } from '@/pages/HomePage';
import { UserSettingsPage } from '@/features/settings/UserSettingsPage';
import { ShipperList } from '@/features/shipper/ShipperList';
import { MallList } from '@/features/malls/MallList';
import { UserList } from '@/features/users/UserList';
import { CommonCodeList } from '@/features/commonCode/CommonCodeList';
import { MenuManagePage } from '@/features/menuManage/MenuManagePage';
import { AuthGroupManagePage } from '@/features/authGroupManage/AuthGroupManagePage';
import { AuditLogPage } from '@/features/auditLog/AuditLogPage';

/**
 * 메뉴 path → 페이지 컴포넌트 매핑.
 * 새 화면을 추가할 때 여기에 등록만 하면 탭으로 열림.
 * tab prop: TabContent에서 전달 (tab.data에 productId 등)
 */
const registry: Record<string, ComponentType<{ tab?: TabItem }>> = {};

// 대시보드(Home) — 탭으로 열림
registry['/'] = HomePage;

function placeholder(name: string) {
  return function PlaceholderPage(_props?: { tab?: TabItem }) {
    return (
      <PageLayout title={name} lead="화면 준비 중입니다.">
        <div className="card shadow-none border">
          <div className="card-body">
            <p className="text-body-tertiary mb-0">준비 중인 화면입니다.</p>
          </div>
        </div>
      </PageLayout>
    );
  };
}

// BO — 기초정보 / 운영환경 설정 / 로그정보 (플레이스홀더)
registry['/basic/shipper'] = ShipperList;
registry['/basic/malls'] = MallList;
registry['/basic/users'] = UserList;
registry['/system/common-code'] = CommonCodeList;
registry['/system/menus'] = MenuManagePage;
registry['/system/authorities'] = AuthGroupManagePage;
registry['/log/audit'] = AuditLogPage;
registry['/log/error'] = placeholder('에러이력');

// 환경설정
registry['/settings'] = UserSettingsPage;

export function getPageComponent(path: string): ComponentType<{ tab?: TabItem }> | null {
  return registry[path] ?? null;
}
