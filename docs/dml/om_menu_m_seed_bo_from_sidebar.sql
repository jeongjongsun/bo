-- BO 사이드바 하드코딩 메뉴 → om_menu_m 시드
-- 근거 소스: frontend/src/components/layout/Sidebar.tsx (menuData, 대시보드)
--            frontend/src/pages/pageRegistry.tsx (경로·화면 매핑 참고)
--
-- 실행 순서:
--   1) docs/ddl/om_code_m.sql
--   2) docs/dml/om_code_m_data_system.sql  (SYSTEM/OM, SYSTEM/BO)
--   3) docs/ddl/om_menu_m.sql
--   4) 본 스크립트
--
-- 비고:
--   - system_sub_cd = 'BO' (백오피스). OMS 전용 메뉴는 별도 행으로 OM에 추가하면 됨.
--   - icon: react-icons/fi 의 export 이름 (Sidebar와 동일 문자열로 매핑 가능).
--   - menu_info.sidebar_section: UI 섹션 라벨(기초정보, Apps 등) 복원용.
--   - /product/edit 등 상세 라우트는 사이드바에 없으므로 미포함.

-- ---------------------------------------------------------------------------
-- 1depth: 대시보드 + 그룹 + 단일 메뉴(클레임)
-- ---------------------------------------------------------------------------
INSERT INTO om_menu_m (
    menu_id,
    system_main_cd,
    system_sub_cd,
    parent_menu_id,
    menu_nm,
    menu_url,
    is_active,
    icon,
    disp_seq,
    menu_info,
    remark
) VALUES
(
    'home',
    'SYSTEM',
    'BO',
    NULL,
    '{"ko":"대시보드","en":"Dashboard","ja":"ダッシュボード","vi":"Bảng điều khiển"}'::jsonb,
    '/',
    true,
    'FiPieChart',
    10,
    '{"menu_type":"PAGE","tab_id":"home","source":"Sidebar.tsx"}'::jsonb,
    'DASHBOARD_TAB_ID'
),
(
    'basic',
    'SYSTEM',
    'BO',
    NULL,
    '{"ko":"기초정보","en":"Master Data","ja":"基礎情報","vi":"Dữ liệu nền"}'::jsonb,
    NULL,
    true,
    'FiDatabase',
    20,
    '{"menu_type":"GROUP","sidebar_section":"기초정보"}'::jsonb,
    'Sidebar menuData id=basic'
),
(
    'system',
    'SYSTEM',
    'BO',
    NULL,
    '{"ko":"운영환경 설정","en":"System Settings","ja":"運用環境設定","vi":"Cấu hình vận hành"}'::jsonb,
    NULL,
    true,
    'FiSliders',
    30,
    '{"menu_type":"GROUP","sidebar_section":"운영환경 설정"}'::jsonb,
    'Sidebar menuData id=system'
),
(
    'logs',
    'SYSTEM',
    'BO',
    NULL,
    '{"ko":"로그정보","en":"Logs","ja":"ログ情報","vi":"Nhật ký"}'::jsonb,
    NULL,
    true,
    'FiFileText',
    40,
    '{"menu_type":"GROUP","sidebar_section":"로그정보"}'::jsonb,
    'Sidebar menuData id=logs'
),
(
    'order',
    'SYSTEM',
    'BO',
    NULL,
    '{"ko":"주문 관리","en":"Order Management","ja":"注文管理","vi":"Quản lý đơn hàng"}'::jsonb,
    NULL,
    true,
    'FiShoppingCart',
    50,
    '{"menu_type":"GROUP","sidebar_section":"Apps"}'::jsonb,
    'Sidebar menuData id=order'
),
(
    'order-claim',
    'SYSTEM',
    'BO',
    NULL,
    '{"ko":"클레임 주문","en":"Claim Orders","ja":"クレーム注文","vi":"Đơn khiếu nại"}'::jsonb,
    '/order/claim',
    true,
    'FiRefreshCw',
    60,
    '{"menu_type":"PAGE","sidebar_section":"Apps"}'::jsonb,
    'Sidebar single link'
),
(
    'mall',
    'SYSTEM',
    'BO',
    NULL,
    '{"ko":"쇼핑몰 관리","en":"Mall Management","ja":"ショッピングモール管理","vi":"Quản lý mall"}'::jsonb,
    NULL,
    true,
    'FiShoppingBag',
    70,
    '{"menu_type":"GROUP","sidebar_section":"Apps"}'::jsonb,
    'Sidebar menuData id=mall'
),
(
    'product',
    'SYSTEM',
    'BO',
    NULL,
    '{"ko":"상품 관리","en":"Product Management","ja":"商品管理","vi":"Quản lý sản phẩm"}'::jsonb,
    NULL,
    true,
    'FiPackage',
    80,
    '{"menu_type":"GROUP","sidebar_section":"Apps"}'::jsonb,
    'Sidebar menuData id=product'
)
ON CONFLICT (menu_id) DO UPDATE SET
    system_main_cd = EXCLUDED.system_main_cd,
    system_sub_cd = EXCLUDED.system_sub_cd,
    parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_url = EXCLUDED.menu_url,
    is_active = EXCLUDED.is_active,
    icon = EXCLUDED.icon,
    disp_seq = EXCLUDED.disp_seq,
    menu_info = EXCLUDED.menu_info,
    remark = EXCLUDED.remark,
    updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 2depth: 기초정보
-- ---------------------------------------------------------------------------
INSERT INTO om_menu_m (
    menu_id, system_main_cd, system_sub_cd, parent_menu_id,
    menu_nm, menu_url, is_active, icon, disp_seq, menu_info, remark
) VALUES
(
    'basic-shipper', 'SYSTEM', 'BO', 'basic',
    '{"ko":"화주(법인) 정보","en":"Shipper (Corporation)","ja":"荷主(法人)情報","vi":"Chủ hàng (pháp nhân)"}'::jsonb,
    '/basic/shipper', true, 'FiBriefcase', 10,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'basic-users', 'SYSTEM', 'BO', 'basic',
    '{"ko":"사용자 정보","en":"Users","ja":"ユーザー情報","vi":"Người dùng"}'::jsonb,
    '/basic/users', true, 'FiUsers', 20,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
)
ON CONFLICT (menu_id) DO UPDATE SET
    system_main_cd = EXCLUDED.system_main_cd,
    system_sub_cd = EXCLUDED.system_sub_cd,
    parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_url = EXCLUDED.menu_url,
    is_active = EXCLUDED.is_active,
    icon = EXCLUDED.icon,
    disp_seq = EXCLUDED.disp_seq,
    menu_info = EXCLUDED.menu_info,
    remark = EXCLUDED.remark,
    updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 2depth: 운영환경 설정
-- ---------------------------------------------------------------------------
INSERT INTO om_menu_m (
    menu_id, system_main_cd, system_sub_cd, parent_menu_id,
    menu_nm, menu_url, is_active, icon, disp_seq, menu_info, remark
) VALUES
(
    'system-common-code', 'SYSTEM', 'BO', 'system',
    '{"ko":"공통코드","en":"Common Codes","ja":"共通コード","vi":"Mã chung"}'::jsonb,
    '/system/common-code', true, 'FiHash', 10,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'system-menus', 'SYSTEM', 'BO', 'system',
    '{"ko":"메뉴관리","en":"Menu Management","ja":"メニュー管理","vi":"Quản lý menu"}'::jsonb,
    '/system/menus', true, 'FiMenu', 20,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'system-authorities', 'SYSTEM', 'BO', 'system',
    '{"ko":"권한관리","en":"Authorities","ja":"権限管理","vi":"Phân quyền"}'::jsonb,
    '/system/authorities', true, 'FiShield', 30,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'settings', 'SYSTEM', 'BO', 'system',
    '{"ko":"환경설정","en":"Settings","ja":"環境設定","vi":"Cài đặt"}'::jsonb,
    '/settings', true, 'FiSettings', 40,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
)
ON CONFLICT (menu_id) DO UPDATE SET
    system_main_cd = EXCLUDED.system_main_cd,
    system_sub_cd = EXCLUDED.system_sub_cd,
    parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_url = EXCLUDED.menu_url,
    is_active = EXCLUDED.is_active,
    icon = EXCLUDED.icon,
    disp_seq = EXCLUDED.disp_seq,
    menu_info = EXCLUDED.menu_info,
    remark = EXCLUDED.remark,
    updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 2depth: 로그정보
-- ---------------------------------------------------------------------------
INSERT INTO om_menu_m (
    menu_id, system_main_cd, system_sub_cd, parent_menu_id,
    menu_nm, menu_url, is_active, icon, disp_seq, menu_info, remark
) VALUES
(
    'log-audit', 'SYSTEM', 'BO', 'logs',
    '{"ko":"감사이력","en":"Audit Log","ja":"監査履歴","vi":"Nhật ký kiểm tra"}'::jsonb,
    '/log/audit', true, 'FiClipboard', 10,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'log-error', 'SYSTEM', 'BO', 'logs',
    '{"ko":"에러이력","en":"Error Log","ja":"エラー履歴","vi":"Nhật ký lỗi"}'::jsonb,
    '/log/error', true, 'FiAlertCircle', 20,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
)
ON CONFLICT (menu_id) DO UPDATE SET
    system_main_cd = EXCLUDED.system_main_cd,
    system_sub_cd = EXCLUDED.system_sub_cd,
    parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_url = EXCLUDED.menu_url,
    is_active = EXCLUDED.is_active,
    icon = EXCLUDED.icon,
    disp_seq = EXCLUDED.disp_seq,
    menu_info = EXCLUDED.menu_info,
    remark = EXCLUDED.remark,
    updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 2depth: 주문 관리
-- ---------------------------------------------------------------------------
INSERT INTO om_menu_m (
    menu_id, system_main_cd, system_sub_cd, parent_menu_id,
    menu_nm, menu_url, is_active, icon, disp_seq, menu_info, remark
) VALUES
(
    'order-domestic-b2c', 'SYSTEM', 'BO', 'order',
    '{"ko":"국내 B2C 주문","en":"Domestic B2C Orders","ja":"国内B2C注文","vi":"Đơn B2C nội địa"}'::jsonb,
    '/order', true, 'FiHome', 10,
    '{"menu_type":"PAGE"}'::jsonb,
    'OrderList sales_type_cd 구분'
),
(
    'order-overseas-b2c', 'SYSTEM', 'BO', 'order',
    '{"ko":"해외 B2C 주문","en":"Overseas B2C Orders","ja":"海外B2C注文","vi":"Đơn B2C xuyên biên giới"}'::jsonb,
    '/order/overseas-b2c', true, 'FiGlobe', 20,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'order-domestic-b2b', 'SYSTEM', 'BO', 'order',
    '{"ko":"국내 B2B 주문","en":"Domestic B2B Orders","ja":"国内B2B注文","vi":"Đơn B2B nội địa"}'::jsonb,
    '/order/domestic-b2b', true, 'FiBriefcase', 30,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'order-overseas-b2b', 'SYSTEM', 'BO', 'order',
    '{"ko":"해외 B2B 주문","en":"Overseas B2B Orders","ja":"海外B2B注文","vi":"Đơn B2B xuyên biên giới"}'::jsonb,
    '/order/overseas-b2b', true, 'FiMap', 40,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'order-other', 'SYSTEM', 'BO', 'order',
    '{"ko":"기타주문","en":"Other Orders","ja":"その他注文","vi":"Đơn khác"}'::jsonb,
    '/order/other', true, 'FiGrid', 50,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'order-unmatched', 'SYSTEM', 'BO', 'order',
    '{"ko":"비매칭 주문","en":"Unmatched Orders","ja":"非マッチング注文","vi":"Đơn chưa khớp"}'::jsonb,
    '/order/unmatched', true, 'FiXCircle', 60,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
)
ON CONFLICT (menu_id) DO UPDATE SET
    system_main_cd = EXCLUDED.system_main_cd,
    system_sub_cd = EXCLUDED.system_sub_cd,
    parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_url = EXCLUDED.menu_url,
    is_active = EXCLUDED.is_active,
    icon = EXCLUDED.icon,
    disp_seq = EXCLUDED.disp_seq,
    menu_info = EXCLUDED.menu_info,
    remark = EXCLUDED.remark,
    updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 2depth: 쇼핑몰 관리
-- ---------------------------------------------------------------------------
INSERT INTO om_menu_m (
    menu_id, system_main_cd, system_sub_cd, parent_menu_id,
    menu_nm, menu_url, is_active, icon, disp_seq, menu_info, remark
) VALUES
(
    'mall-list', 'SYSTEM', 'BO', 'mall',
    '{"ko":"쇼핑몰/상점 관리","en":"Mall / Store Management","ja":"ショッピングモール/店舗管理","vi":"Quản lý mall/cửa hàng"}'::jsonb,
    '/mall', true, 'FiLayers', 10,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'mall-connection', 'SYSTEM', 'BO', 'mall',
    '{"ko":"접속정보 관리","en":"Connection Settings","ja":"接続情報管理","vi":"Quản lý kết nối"}'::jsonb,
    '/mall/connection', true, 'FiKey', 20,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
)
ON CONFLICT (menu_id) DO UPDATE SET
    system_main_cd = EXCLUDED.system_main_cd,
    system_sub_cd = EXCLUDED.system_sub_cd,
    parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_url = EXCLUDED.menu_url,
    is_active = EXCLUDED.is_active,
    icon = EXCLUDED.icon,
    disp_seq = EXCLUDED.disp_seq,
    menu_info = EXCLUDED.menu_info,
    remark = EXCLUDED.remark,
    updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 2depth: 상품 관리
-- ---------------------------------------------------------------------------
INSERT INTO om_menu_m (
    menu_id, system_main_cd, system_sub_cd, parent_menu_id,
    menu_nm, menu_url, is_active, icon, disp_seq, menu_info, remark
) VALUES
(
    'product-info', 'SYSTEM', 'BO', 'product',
    '{"ko":"상품 정보","en":"Products","ja":"商品情報","vi":"Sản phẩm"}'::jsonb,
    '/product', true, 'FiList', 10,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'product-gift', 'SYSTEM', 'BO', 'product',
    '{"ko":"사은품 지급 설정","en":"Gift Settings","ja":"ノベルティ支給設定","vi":"Cài đặt quà tặng"}'::jsonb,
    '/product/gift', true, 'FiGift', 20,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
),
(
    'product-matching', 'SYSTEM', 'BO', 'product',
    '{"ko":"매칭 정보","en":"Matching","ja":"マッチング情報","vi":"Ghép nối"}'::jsonb,
    '/product/matching', true, 'FiLink', 30,
    '{"menu_type":"PAGE"}'::jsonb,
    NULL
)
ON CONFLICT (menu_id) DO UPDATE SET
    system_main_cd = EXCLUDED.system_main_cd,
    system_sub_cd = EXCLUDED.system_sub_cd,
    parent_menu_id = EXCLUDED.parent_menu_id,
    menu_nm = EXCLUDED.menu_nm,
    menu_url = EXCLUDED.menu_url,
    is_active = EXCLUDED.is_active,
    icon = EXCLUDED.icon,
    disp_seq = EXCLUDED.disp_seq,
    menu_info = EXCLUDED.menu_info,
    remark = EXCLUDED.remark,
    updated_at = CURRENT_TIMESTAMP;
