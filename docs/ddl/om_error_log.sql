-- 시스템 예외·에러 이력 (감사 로그 om_log_m 과 별도)
-- 백엔드 구현: GlobalApiExceptionHandler(적재 트리거), ErrorLogService, OmErrorLogMapper,
--             AdminErrorLogController(GET /api/v1/admin/error-logs), RequestIdFilter
-- 테이블명: om_error_log_m
-- docs/guide/08-DB-표준.md 준수. append-only: 운영에서 UPDATE/DELETE는 정책에 따라 별도(예: 처리완료 플래그 추가 시 마이그레이션).
-- 목적: 백오피스 등에서 예외 건별 조회·통계. 스택·메시지는 애플리케이션에서 길이 제한·마스킹 후 저장 (docs/guide/05-로깅-표준, 06-보안-표준).

CREATE TABLE om_error_log_m (
    id                 BIGSERIAL     NOT NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exception_class    VARCHAR(256)  NOT NULL,
    exception_message  TEXT,
    stack_trace        TEXT,
    root_cause_class   VARCHAR(256),
    err_code           VARCHAR(64),
    http_status        SMALLINT,
    http_method        VARCHAR(16),
    api_path           VARCHAR(512),
    request_id         VARCHAR(64),
    actor_user_id      VARCHAR(48),
    client_path        VARCHAR(512),
    ip_addr            VARCHAR(45),
    user_agent         VARCHAR(512),
    app_profile        VARCHAR(32),
    error_fingerprint  VARCHAR(64),
    detail             JSONB         NOT NULL DEFAULT '{}',
    CONSTRAINT pk_om_error_log_m PRIMARY KEY (id)
);

COMMENT ON TABLE om_error_log_m IS '시스템 예외·에러 이력(조회·분석용, 감사 로그와 분리)';
COMMENT ON COLUMN om_error_log_m.id IS '에러 로그 PK (BIGSERIAL)';
COMMENT ON COLUMN om_error_log_m.created_at IS '에러 기록 시각 (TIMESTAMPTZ)';
COMMENT ON COLUMN om_error_log_m.exception_class IS '예외 클래스 FQCN 또는 단축명 (팀 규칙 통일)';
COMMENT ON COLUMN om_error_log_m.exception_message IS 'getMessage() 등 (민감정보 마스킹·길이 절단 후 저장)';
COMMENT ON COLUMN om_error_log_m.stack_trace IS '스택 트레이스 일부 (애플리케이션에서 상한 바이트/문자 절단)';
COMMENT ON COLUMN om_error_log_m.root_cause_class IS '근본 원인 예외 클래스 (있을 때)';
COMMENT ON COLUMN om_error_log_m.err_code IS 'API/비즈니스 에러 코드 (예: ERR_VALIDATION)';
COMMENT ON COLUMN om_error_log_m.http_status IS 'HTTP 응답 상태 코드 (있을 때)';
COMMENT ON COLUMN om_error_log_m.http_method IS 'HTTP 메서드';
COMMENT ON COLUMN om_error_log_m.api_path IS '요청 API 경로';
COMMENT ON COLUMN om_error_log_m.request_id IS '요청 상관 ID (로그·감사와 연계)';
COMMENT ON COLUMN om_error_log_m.actor_user_id IS '인증된 사용자 ID (비로그인 시 NULL)';
COMMENT ON COLUMN om_error_log_m.client_path IS '클라이언트 라우트 (선택)';
COMMENT ON COLUMN om_error_log_m.ip_addr IS '클라이언트 IP';
COMMENT ON COLUMN om_error_log_m.user_agent IS 'User-Agent (절단 저장)';
COMMENT ON COLUMN om_error_log_m.app_profile IS 'Spring profile 등 실행 환경 식별 (예: prod, dev)';
COMMENT ON COLUMN om_error_log_m.error_fingerprint IS '동일 장애 묶음용 해시 (예: exception_class + 첫 스택 라인 + err_code)';
COMMENT ON COLUMN om_error_log_m.detail IS '안전한 부가 컨텍스트 (JSONB, 요청 바디 전체 저장 금지)';

CREATE INDEX idx_om_error_log_m_created_at ON om_error_log_m (created_at DESC);
CREATE INDEX idx_om_error_log_m_exception_class_created_at ON om_error_log_m (exception_class, created_at DESC);
CREATE INDEX idx_om_error_log_m_err_code_created_at ON om_error_log_m (err_code, created_at DESC);
CREATE INDEX idx_om_error_log_m_request_id ON om_error_log_m (request_id);
CREATE INDEX idx_om_error_log_m_actor_user_id_created_at ON om_error_log_m (actor_user_id, created_at DESC);
CREATE INDEX idx_om_error_log_m_fingerprint_created_at ON om_error_log_m (error_fingerprint, created_at DESC);

-- ============================================================
-- detail JSONB 구조 정의
-- ============================================================
--
--  키(key)               | 타입       | 필수 | 설명                              | 예시 / 비고
-- -----------------------|-----------|------|----------------------------------|----------------------------------
--  handler               | string    | N    | 예외 처리 핸들러 식별              | "GlobalExceptionHandler"
--  validation_fields     | string[]  | N    | 검증 실패 필드명만 (값 제외)       | ["email", "qty"]
--  sql_state             | string    | N    | JDBC SQLState (있을 때)           | "23505"
--  external_system       | string    | N    | 외부 연동 대상 식별               | "PAYMENT_GATEWAY"
--  extra                 | object    | N    | 도메인별 안전한 키만              | {"orderId":"ORD001"}
--
-- 예시 데이터:
-- {
--   "handler": "GlobalExceptionHandler",
--   "validation_fields": ["main_cd", "sub_cd"],
--   "sql_state": "23505",
--   "external_system": null,
--   "extra": { "orderId": "ORD001" }
-- }
