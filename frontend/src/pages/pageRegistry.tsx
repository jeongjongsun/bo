import { type ComponentType } from 'react';
import type { TabItem } from '@/store/useTabStore';
import { PageLayout } from '@/components/layout/PageLayout';
import { HomePage } from '@/pages/HomePage';
import { ProductList } from '@/features/products/ProductList';
import { ProductEditPage } from '@/features/products/ProductEditPage';
import { UserSettingsPage } from '@/features/settings/UserSettingsPage';
import { MallList } from '@/features/malls/MallList';
import { OrderList } from '@/features/orders/OrderList';

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

// 주문 관리 (국내 B2C / 해외 B2C / 국내 B2B / 해외 B2B / 기타주문 = 동일 OrderList, sales_type_cd 로 그리드만 구분)
registry['/order'] = OrderList;
registry['/order/overseas-b2c'] = OrderList;
registry['/order/domestic-b2b'] = OrderList;
registry['/order/overseas-b2b'] = OrderList;
registry['/order/other'] = OrderList;
registry['/order/unmatched'] = placeholder('비매칭 주문');
registry['/order/claim'] = placeholder('클레임 주문');

// 상품 관리
registry['/product'] = ProductList;
registry['/product/edit'] = ProductEditPage;
registry['/product/gift'] = placeholder('사은품 지급 설정');
registry['/product/matching'] = placeholder('매칭 정보');

// 쇼핑몰 관리
registry['/mall'] = MallList;
registry['/mall/connection'] = placeholder('접속정보 관리');

// 환경설정
registry['/settings'] = UserSettingsPage;

export function getPageComponent(path: string): ComponentType | null {
  return registry[path] ?? null;
}
