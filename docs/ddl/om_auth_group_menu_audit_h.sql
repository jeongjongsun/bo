-- 권한 그룹 메뉴 변경 감사 이력 DDL
-- 테이블명: om_auth_group_menu_audit_h
-- docs/08-DB-표준.md 준수
--
-- 용도:
--   - 권한 그룹별 메뉴 권한 변경(저장/삭제/초기화)의 before/after를 감사 로그로 보관
--   - 누가/언제/무엇을 변경했는지 운영 추적 및 장애 분석 근거 제공

CREATE TABLE om_auth_group_menu_audit_h (
    id                   BIGSERIAL       NOT NULL,
    auth_group_cd        VARCHAR(48)     NOT NULL,
    action_type          VARCHAR(30)     NOT NULL,
    system_main_cd       VARCHAR(50)     NOT NULL DEFAULT 'SYSTEM',
    system_sub_cd        VARCHAR(50)     NOT NULL,
    before_menu_ids      JSONB           NOT NULL DEFAULT '[]',
    after_menu_ids       JSONB           NOT NULL DEFAULT '[]',
    affected_user_count  INTEGER         NOT NULL DEFAULT 0,
    change_reason        VARCHAR(500),
    request_id           VARCHAR(100),
    request_ip           VARCHAR(100),
    user_agent           VARCHAR(500),
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(48),
    CONSTRAINT pk_om_auth_group_menu_audit_h PRIMARY KEY (id),
    CONSTRAINT fk_om_auth_group_menu_audit_h_group
        FOREIGN KEY (auth_group_cd)
        REFERENCES om_auth_group_m (auth_group_cd)
        ON DELETE RESTRICT,
    CONSTRAINT fk_om_auth_group_menu_audit_h_system_code
        FOREIGN KEY (system_main_cd, system_sub_cd)
        REFERENCES om_code_m (main_cd, sub_cd),
    CONSTRAINT chk_om_auth_group_menu_audit_h_action_type
        CHECK (action_type IN ('UPSERT', 'DELETE_GROUP', 'CLEAR_USERS_AUTH_GROUP'))
);

CREATE INDEX idx_om_auth_group_menu_audit_h_group_created
    ON om_auth_group_menu_audit_h (auth_group_cd, created_at DESC);

CREATE INDEX idx_om_auth_group_menu_audit_h_created
    ON om_auth_group_menu_audit_h (created_at DESC);

COMMENT ON TABLE om_auth_group_menu_audit_h IS '권한 그룹 메뉴 변경 감사 이력';
COMMENT ON COLUMN om_auth_group_menu_audit_h.auth_group_cd IS '권한 그룹 코드';
COMMENT ON COLUMN om_auth_group_menu_audit_h.action_type IS '변경 유형(UPSERT/DELETE_GROUP/CLEAR_USERS_AUTH_GROUP)';
COMMENT ON COLUMN om_auth_group_menu_audit_h.system_main_cd IS '시스템 메인 코드';
COMMENT ON COLUMN om_auth_group_menu_audit_h.system_sub_cd IS '시스템 서브 코드(OM/BO)';
COMMENT ON COLUMN om_auth_group_menu_audit_h.before_menu_ids IS '변경 전 메뉴 ID 배열(JSONB)';
COMMENT ON COLUMN om_auth_group_menu_audit_h.after_menu_ids IS '변경 후 메뉴 ID 배열(JSONB)';
COMMENT ON COLUMN om_auth_group_menu_audit_h.affected_user_count IS '영향받은 사용자 수';
COMMENT ON COLUMN om_auth_group_menu_audit_h.change_reason IS '운영자 변경 사유';
COMMENT ON COLUMN om_auth_group_menu_audit_h.request_id IS '요청 추적 ID';
COMMENT ON COLUMN om_auth_group_menu_audit_h.request_ip IS '요청자 IP';
COMMENT ON COLUMN om_auth_group_menu_audit_h.user_agent IS '요청 User-Agent';
COMMENT ON COLUMN om_auth_group_menu_audit_h.created_at IS '로그 생성 시각';
COMMENT ON COLUMN om_auth_group_menu_audit_h.created_by IS '변경 수행자 식별자';
