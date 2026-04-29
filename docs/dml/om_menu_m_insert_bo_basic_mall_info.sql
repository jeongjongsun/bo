-- BO > 기초정보 > 쇼핑몰 정보 메뉴 1건 (om_mall_m 화면 진입점)
--
-- 선행 조건:
--   - om_code_m: SYSTEM / BO
--   - om_menu_m: menu_id = 'basic' (기초정보 그룹) — om_menu_m_seed_bo_from_sidebar.sql
--
-- 권장 URL: /basic/malls (목록·CRUD 화면, 기존 /basic/users·/basic/shipper 와 동일 패턴)
-- 권장 아이콘: FiShoppingBag (쇼핑몰 마스터 의미, react-icons/fi, boMenuFiIcon 에 등록됨)
--
-- 전체 BO 메뉴 재적용 시에는 om_menu_m_seed_bo_from_sidebar.sql 만 실행해도 본 행이 포함됩니다.

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
) VALUES (
    'basic-malls',
    'SYSTEM',
    'BO',
    'basic',
    '{"ko":"쇼핑몰 정보","en":"Mall Information","ja":"ショッピングモール情報","vi":"Thông tin sàn TMĐT"}'::jsonb,
    '/basic/malls',
    true,
    'FiShoppingBag',
    15,
    '{"menu_type":"PAGE"}'::jsonb,
    'om_mall_m; docs/ddl/om_mall_m.sql'
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
