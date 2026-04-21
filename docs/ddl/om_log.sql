-- 비즈니스 감사 로그 (성공 커밋 후 증빙용)
-- 테이블명: om_log_m
-- docs/guide/08-DB-표준.md 준수. append-only: UPDATE/DELETE 미사용 가정.
-- 식별: menu_cd, action_cd, resource_type/resource_id + detail(JSONB)
-- 표시: message_key + detail → Locale 조회 시 MessageSource, description_snapshot은 증빙용 고정 문구(선택)

CREATE TABLE om_log_m (
    id                   BIGSERIAL     NOT NULL,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_user_id        VARCHAR(48)   NOT NULL,
    menu_cd              VARCHAR(64),
    action_cd            VARCHAR(128)  NOT NULL,
    message_key          VARCHAR(256),
    description_snapshot VARCHAR(2000),
    resource_type        VARCHAR(64),
    resource_id          VARCHAR(128),
    detail               JSONB         NOT NULL DEFAULT '{}',
    request_id           VARCHAR(64),
    client_path          VARCHAR(512),
    http_method          VARCHAR(16),
    api_path             VARCHAR(512),
    ip_addr              VARCHAR(45),
    user_agent           VARCHAR(512),
    CONSTRAINT pk_om_log_m PRIMARY KEY (id)
);

COMMENT ON TABLE om_log_m IS '비즈니스 감사 로그(성공 변경 증빙, append-only)';
COMMENT ON COLUMN om_log_m.id IS '감사 로그 PK (BIGSERIAL)';
COMMENT ON COLUMN om_log_m.created_at IS '이벤트 기록 시각(커밋 기준, TIMESTAMPTZ)';
COMMENT ON COLUMN om_log_m.actor_user_id IS '행위자 사용자 ID (로그인 ID 등, om_user_m.user_id와 동일 체계)';
COMMENT ON COLUMN om_log_m.menu_cd IS '화면/메뉴 식별 코드 (docs/guide/menu 등과 매핑, 예: MENU_COMMON_CODE)';
COMMENT ON COLUMN om_log_m.action_cd IS '비즈니스 액션 식별 코드 (예: COMMON_CODE_ITEM_UPDATE)';
COMMENT ON COLUMN om_log_m.message_key IS '다국어 메시지 키 (messages_*.properties, 조회 시 Locale로 해석)';
COMMENT ON COLUMN om_log_m.description_snapshot IS '기록 시점 증빙용 고정 설명문(한글 등, 선택)';
COMMENT ON COLUMN om_log_m.resource_type IS '대상 리소스 유형 (예: COMMON_CODE, ORDER)';
COMMENT ON COLUMN om_log_m.resource_id IS '대상 리소스 단일 식별자(복합키는 detail에 기술)';
COMMENT ON COLUMN om_log_m.detail IS '액션별 부가 정보·치환 파라미터·복합키 (JSONB)';
COMMENT ON COLUMN om_log_m.request_id IS '요청 상관 ID (로그·추적 연계)';
COMMENT ON COLUMN om_log_m.client_path IS '클라이언트 라우트 경로(선택, 어느 화면에서 호출했는지)';
COMMENT ON COLUMN om_log_m.http_method IS 'HTTP 메서드';
COMMENT ON COLUMN om_log_m.api_path IS 'API 경로 (예: /api/v1/admin/common-codes/...)';
COMMENT ON COLUMN om_log_m.ip_addr IS '클라이언트 IP (IPv4/IPv6)';
COMMENT ON COLUMN om_log_m.user_agent IS 'User-Agent (길이 초과 시 애플리케이션에서 절단 저장)';

CREATE INDEX idx_om_log_m_created_at ON om_log_m (created_at DESC);
CREATE INDEX idx_om_log_m_actor_user_id_created_at ON om_log_m (actor_user_id, created_at DESC);
CREATE INDEX idx_om_log_m_action_cd_created_at ON om_log_m (action_cd, created_at DESC);
CREATE INDEX idx_om_log_m_resource ON om_log_m (resource_type, resource_id);
CREATE INDEX idx_om_log_m_menu_cd_created_at ON om_log_m (menu_cd, created_at DESC);

-- ============================================================
-- detail JSONB 구조 정의
-- ============================================================
--
--  키(key)               | 타입       | 필수 | 설명                              | 예시 / 비고
-- -----------------------|-----------|------|----------------------------------|----------------------------------
--  params                | object    | N    | message_key 치환용                | {"codeGroup":"ORDER_STATUS"}
--  main_cd               | string    | N    | 공통코드 그룹 등                  | "ORDER_STATUS"
--  sub_cd                | string    | N    | 공통코드 값 등                    | "SHIPPING"
--  before                | object    | N    | 변경 전 요약(민감정보 금지)       | {"use_yn":"Y"}
--  after                 | object    | N    | 변경 후 요약(민감정보 금지)       | {"use_yn":"N"}
--  affected_cnt          | integer   | N    | 반영 건수(배치 시)                | 10
--  extra                 | object    | N    | 도메인별 임의 확장                | {"orderId":"ORD001"}
--
-- 예시 데이터:
-- {
--   "params": { "codeGroup": "ORDER_STATUS", "subCd": "SHIPPING" },
--   "main_cd": "ORDER_STATUS",
--   "sub_cd": "SHIPPING",
--   "before": { "use_yn": "Y", "disp_seq": 5 },
--   "after": { "use_yn": "N", "disp_seq": 5 },
--   "affected_cnt": 1,
--   "extra": {}
-- }
