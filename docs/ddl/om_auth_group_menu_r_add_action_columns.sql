-- 권한 그룹-메뉴 매핑 액션 권한 컬럼 추가
-- 대상: om_auth_group_menu_r

ALTER TABLE om_auth_group_menu_r
    ADD COLUMN IF NOT EXISTS can_view BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS can_create BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS can_update BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS can_delete BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS can_excel_download BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS can_approve BOOLEAN NOT NULL DEFAULT false;

UPDATE om_auth_group_menu_r
   SET can_view = true
 WHERE COALESCE(is_deleted, false) = false
   AND COALESCE(can_view, false) = false;
