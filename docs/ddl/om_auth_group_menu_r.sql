-- 권한 그룹-메뉴 매핑 릴레이션 DDL
-- 테이블명: om_auth_group_menu_r
-- docs/08-DB-표준.md 준수
--
-- 용도:
--   - 권한 그룹(om_auth_group_m.auth_group_cd)별로 접속 가능한 메뉴(om_menu_m.menu_id)를 저장
--   - 시스템(OM/BO) 단위 탭 저장을 위해 system_main_cd/system_sub_cd를 함께 보관

CREATE TABLE om_auth_group_menu_r (
    auth_group_cd   VARCHAR(48)     NOT NULL,
    menu_id         VARCHAR(48)     NOT NULL,
    system_main_cd  VARCHAR(50)     NOT NULL DEFAULT 'SYSTEM',
    system_sub_cd   VARCHAR(50)     NOT NULL,
    can_view        BOOLEAN         NOT NULL DEFAULT true,
    can_create      BOOLEAN         NOT NULL DEFAULT false,
    can_update      BOOLEAN         NOT NULL DEFAULT false,
    can_delete      BOOLEAN         NOT NULL DEFAULT false,
    can_excel_download BOOLEAN      NOT NULL DEFAULT false,
    can_approve     BOOLEAN         NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(48),
    updated_by      VARCHAR(48),
    is_deleted      BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT pk_om_auth_group_menu_r PRIMARY KEY (auth_group_cd, menu_id),
    CONSTRAINT fk_om_auth_group_menu_r_group
        FOREIGN KEY (auth_group_cd)
        REFERENCES om_auth_group_m (auth_group_cd)
        ON DELETE RESTRICT,
    CONSTRAINT fk_om_auth_group_menu_r_menu
        FOREIGN KEY (menu_id)
        REFERENCES om_menu_m (menu_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_om_auth_group_menu_r_system_code
        FOREIGN KEY (system_main_cd, system_sub_cd)
        REFERENCES om_code_m (main_cd, sub_cd)
);

CREATE INDEX idx_om_auth_group_menu_r_group_system
    ON om_auth_group_menu_r (auth_group_cd, system_main_cd, system_sub_cd)
    WHERE is_deleted = false;

CREATE INDEX idx_om_auth_group_menu_r_menu
    ON om_auth_group_menu_r (menu_id)
    WHERE is_deleted = false;

COMMENT ON TABLE om_auth_group_menu_r IS '권한 그룹-메뉴 매핑 릴레이션(OM/BO 공통)';
COMMENT ON COLUMN om_auth_group_menu_r.auth_group_cd IS '권한 그룹 코드 (om_auth_group_m.auth_group_cd)';
COMMENT ON COLUMN om_auth_group_menu_r.menu_id IS '메뉴 ID (om_menu_m.menu_id)';
COMMENT ON COLUMN om_auth_group_menu_r.system_main_cd IS '시스템 메인 코드 (기본 SYSTEM)';
COMMENT ON COLUMN om_auth_group_menu_r.system_sub_cd IS '시스템 서브 코드 (OM/BO)';
COMMENT ON COLUMN om_auth_group_menu_r.can_view IS '조회 권한(메뉴 표시/접속 기본 권한)';
COMMENT ON COLUMN om_auth_group_menu_r.can_create IS '등록 권한';
COMMENT ON COLUMN om_auth_group_menu_r.can_update IS '수정 권한';
COMMENT ON COLUMN om_auth_group_menu_r.can_delete IS '삭제 권한';
COMMENT ON COLUMN om_auth_group_menu_r.can_excel_download IS '엑셀 다운로드 권한';
COMMENT ON COLUMN om_auth_group_menu_r.can_approve IS '승인 권한';
COMMENT ON COLUMN om_auth_group_menu_r.created_at IS '최초 생성 시각';
COMMENT ON COLUMN om_auth_group_menu_r.updated_at IS '최종 수정 시각';
COMMENT ON COLUMN om_auth_group_menu_r.created_by IS '생성자 식별자';
COMMENT ON COLUMN om_auth_group_menu_r.updated_by IS '수정자 식별자';
COMMENT ON COLUMN om_auth_group_menu_r.is_deleted IS '소프트 삭제 여부';
