-- 공통 감사 이력 DDL
-- 테이블명: om_audit_log_h
-- 용도: 서비스 계층 등록/수정/삭제(CREATE/UPDATE/DELETE) 이력 저장
-- 파티션: acted_at 기준 월 단위 RANGE 파티션

CREATE TABLE om_audit_log_h (
    id                  BIGSERIAL       NOT NULL,
    domain_type         VARCHAR(50)     NOT NULL,
    system_main_cd      VARCHAR(50)     NOT NULL DEFAULT 'SYSTEM',
    system_sub_cd       VARCHAR(50)     NOT NULL,
    menu_code           VARCHAR(100)    NOT NULL,
    menu_name_ko        VARCHAR(200)    NOT NULL,
    action_code         VARCHAR(20)     NOT NULL,
    action_name_ko      VARCHAR(20)     NOT NULL,
    entity_type         VARCHAR(100)    NOT NULL,
    entity_id           VARCHAR(200)    NOT NULL,
    before_data         JSONB           NOT NULL DEFAULT '{}'::jsonb,
    after_data          JSONB           NOT NULL DEFAULT '{}'::jsonb,
    changed_fields      JSONB           NOT NULL DEFAULT '[]'::jsonb,
    actor_user_id       VARCHAR(48)     NOT NULL,
    acted_at            TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_id          VARCHAR(100),
    request_ip          VARCHAR(100),
    user_agent          VARCHAR(500),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(48)     NOT NULL,
    CONSTRAINT pk_om_audit_log_h PRIMARY KEY (id, acted_at),
    CONSTRAINT chk_om_audit_log_h_action_code
        CHECK (action_code IN ('CREATE', 'UPDATE', 'DELETE')),
    CONSTRAINT chk_om_audit_log_h_action_name_ko
        CHECK (action_name_ko IN ('등록', '수정', '삭제'))
) PARTITION BY RANGE (acted_at);

-- 기본 파티션(미생성 월 데이터 유입 시 임시 수용)
CREATE TABLE om_audit_log_h_default
    PARTITION OF om_audit_log_h DEFAULT;

CREATE INDEX idx_om_audit_log_h_acted_at
    ON om_audit_log_h (acted_at DESC);

CREATE INDEX idx_om_audit_log_h_domain_acted
    ON om_audit_log_h (domain_type, acted_at DESC);

CREATE INDEX idx_om_audit_log_h_system_acted
    ON om_audit_log_h (system_main_cd, system_sub_cd, acted_at DESC);

CREATE INDEX idx_om_audit_log_h_actor_acted
    ON om_audit_log_h (actor_user_id, acted_at DESC);

CREATE INDEX idx_om_audit_log_h_entity
    ON om_audit_log_h (entity_type, entity_id, acted_at DESC);

COMMENT ON TABLE om_audit_log_h IS '서비스 등록/수정/삭제 공통 감사 이력';
COMMENT ON COLUMN om_audit_log_h.domain_type IS '도메인 구분(예: AUTH_GROUP, MENU, ORDER)';
COMMENT ON COLUMN om_audit_log_h.system_main_cd IS '시스템 메인 코드(예: SYSTEM)';
COMMENT ON COLUMN om_audit_log_h.system_sub_cd IS '시스템 서브 코드(BO/OM)';
COMMENT ON COLUMN om_audit_log_h.menu_code IS '메뉴 코드';
COMMENT ON COLUMN om_audit_log_h.menu_name_ko IS '메뉴 한글명';
COMMENT ON COLUMN om_audit_log_h.action_code IS '행위 코드(CREATE/UPDATE/DELETE)';
COMMENT ON COLUMN om_audit_log_h.action_name_ko IS '행위 한글명(등록/수정/삭제)';
COMMENT ON COLUMN om_audit_log_h.entity_type IS '변경 엔터티 유형(예: om_menu_m)';
COMMENT ON COLUMN om_audit_log_h.entity_id IS '변경 엔터티 식별자';
COMMENT ON COLUMN om_audit_log_h.before_data IS '변경 전 데이터(JSONB)';
COMMENT ON COLUMN om_audit_log_h.after_data IS '변경 후 데이터(JSONB)';
COMMENT ON COLUMN om_audit_log_h.changed_fields IS '변경 필드 목록(JSONB)';
COMMENT ON COLUMN om_audit_log_h.actor_user_id IS '행위 사용자 ID';
COMMENT ON COLUMN om_audit_log_h.acted_at IS '행위 시각';
COMMENT ON COLUMN om_audit_log_h.request_id IS '요청 추적 ID';
COMMENT ON COLUMN om_audit_log_h.request_ip IS '요청 IP';
COMMENT ON COLUMN om_audit_log_h.user_agent IS '요청 User-Agent';

-- ============================================================
-- before_data JSONB 구조 정의
-- ============================================================
--
--  키(key)               | 타입       | 필수 | 설명                            | 예시 / 비고
-- -----------------------|-----------|------|---------------------------------|------------------
--  도메인별_필드명       | string    | N    | 변경 전 필드값(도메인별 가변)    | "CS팀"
--  도메인별_숫자필드      | integer   | N    | 변경 전 숫자값(도메인별 가변)    | 10
--  도메인별_객체필드      | object    | N    | 변경 전 객체값(도메인별 가변)    | {"use_yn":"Y"}
--
-- 예시 데이터:
-- {
--   "authGroupNm": "CS팀",
--   "remark": "기존 비고"
-- }
--
-- ============================================================
-- after_data JSONB 구조 정의
-- ============================================================
--
--  키(key)               | 타입       | 필수 | 설명                            | 예시 / 비고
-- -----------------------|-----------|------|---------------------------------|------------------
--  도메인별_필드명       | string    | N    | 변경 후 필드값(도메인별 가변)    | "운영팀"
--  도메인별_숫자필드      | integer   | N    | 변경 후 숫자값(도메인별 가변)    | 20
--  도메인별_객체필드      | object    | N    | 변경 후 객체값(도메인별 가변)    | {"use_yn":"N"}
--
-- 예시 데이터:
-- {
--   "authGroupNm": "운영팀",
--   "remark": "수정 비고"
-- }
--
-- ============================================================
-- changed_fields JSONB 구조 정의
-- ============================================================
--
--  키(key)               | 타입       | 필수 | 설명                            | 예시 / 비고
-- -----------------------|-----------|------|---------------------------------|------------------
--  [0..n]                | string    | N    | 변경된 필드의 한글 라벨 목록      | "권한그룹명"
--
-- 예시 데이터:
-- ["권한그룹명", "비고"]

-- ============================================================
-- 월 파티션 생성 예시 (운영 시 스케줄 실행 권장)
-- ============================================================
-- 예: 2026-05 파티션
-- CREATE TABLE om_audit_log_h_2026_05
--     PARTITION OF om_audit_log_h
--     FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

-- ============================================================
-- 아카이브 테이블 + 운영 함수
-- ============================================================
CREATE TABLE om_audit_log_h_archive (LIKE om_audit_log_h INCLUDING ALL);

CREATE OR REPLACE FUNCTION fn_om_audit_log_h_create_month_partition(base_month DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    start_ts TIMESTAMPTZ := date_trunc('month', base_month)::timestamptz;
    end_ts   TIMESTAMPTZ := (date_trunc('month', base_month) + interval '1 month')::timestamptz;
    part_nm  TEXT := 'om_audit_log_h_' || to_char(base_month, 'YYYY_MM');
BEGIN
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF om_audit_log_h FOR VALUES FROM (%L) TO (%L)',
        part_nm, start_ts, end_ts
    );
END;
$$;

CREATE OR REPLACE FUNCTION fn_om_audit_log_h_archive_month(target_month DATE)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    start_ts      TIMESTAMPTZ := date_trunc('month', target_month)::timestamptz;
    end_ts        TIMESTAMPTZ := (date_trunc('month', target_month) + interval '1 month')::timestamptz;
    moved_count   BIGINT := 0;
BEGIN
    INSERT INTO om_audit_log_h_archive
    SELECT *
      FROM om_audit_log_h
     WHERE acted_at >= start_ts
       AND acted_at < end_ts;
    GET DIAGNOSTICS moved_count = ROW_COUNT;

    DELETE FROM om_audit_log_h
     WHERE acted_at >= start_ts
       AND acted_at < end_ts;

    RETURN moved_count;
END;
$$;
