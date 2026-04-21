-- 사용자별 환경설정 테이블 (한 사용자당 1행)
-- 테이블명: om_user_setting_m
-- docs/08-DB-표준.md 준수
-- 설정 항목은 setting_values JSONB로 관리 (항목 추가 시 컬럼 변경 없음).

CREATE TABLE om_user_setting_m (
    user_id         VARCHAR(48)  NOT NULL,
    setting_values  JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(48),
    updated_by      VARCHAR(48),
    CONSTRAINT pk_om_user_setting_m PRIMARY KEY (user_id),
    CONSTRAINT fk_user_setting_user FOREIGN KEY (user_id) REFERENCES om_user_m (user_id)
);

COMMENT ON TABLE om_user_setting_m IS '사용자별 환경설정 (1사용자 1행). 설정 항목은 setting_values JSONB로 관리.';
COMMENT ON COLUMN om_user_setting_m.user_id IS '사용자 아이디 (FK → om_user_m)';
COMMENT ON COLUMN om_user_setting_m.setting_values IS '환경설정 키-값 (JSON). 키: orderSimpleViewYn, defaultCorporationCd, defaultOrderDateType 등';
COMMENT ON COLUMN om_user_setting_m.created_at IS '최초 생성 시각';
COMMENT ON COLUMN om_user_setting_m.updated_at IS '최종 수정 시각';
COMMENT ON COLUMN om_user_setting_m.created_by IS '생성자 식별자';
COMMENT ON COLUMN om_user_setting_m.updated_by IS '수정자 식별자';
