-- 권한 그룹 마스터 테이블 DDL
-- 테이블명: om_auth_group_m (표준: 단수형·소문자·snake_case)
-- docs/08-DB-표준.md 준수
--
-- 용도: BO 사용자(om_user_m.user_info.auth_group)에 부여할 권한 그룹 정의.
--       화면의 권한그룹 select, 권한 검증 시 이 테이블과 조인·참조.

CREATE TABLE om_auth_group_m (
    auth_group_cd   VARCHAR(48)     NOT NULL,
    auth_group_nm   VARCHAR(200)    NOT NULL,
    auth_group_info JSONB          NOT NULL DEFAULT '{}',
    is_active       BOOLEAN         NOT NULL DEFAULT true,
    sort_seq        INTEGER         NOT NULL DEFAULT 0,
    remark          VARCHAR(500),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(48),
    updated_by      VARCHAR(48),
    is_deleted      BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT pk_om_auth_group_m PRIMARY KEY (auth_group_cd)
);

CREATE INDEX idx_om_auth_group_m_is_active ON om_auth_group_m (is_active) WHERE is_deleted = false;
CREATE INDEX idx_om_auth_group_m_sort_seq ON om_auth_group_m (sort_seq);

COMMENT ON TABLE om_auth_group_m IS '권한 그룹 마스터 (BO 메뉴/API 권한 묶음)';
COMMENT ON COLUMN om_auth_group_m.auth_group_cd IS '권한 그룹 코드 (om_user_m.user_info.auth_group 값과 일치)';
COMMENT ON COLUMN om_auth_group_m.auth_group_nm IS '권한 그룹 명';
COMMENT ON COLUMN om_auth_group_m.auth_group_info IS '권한 그룹 상세 (JSONB: 허용 메뉴·API·기능 플래그 등)';
COMMENT ON COLUMN om_auth_group_m.is_active IS '사용 여부';
COMMENT ON COLUMN om_auth_group_m.sort_seq IS '표시·정렬 순서';
COMMENT ON COLUMN om_auth_group_m.remark IS '관리용 비고';
COMMENT ON COLUMN om_auth_group_m.created_at IS '최초 생성 시각';
COMMENT ON COLUMN om_auth_group_m.updated_at IS '최종 수정 시각';
COMMENT ON COLUMN om_auth_group_m.created_by IS '생성자 식별자';
COMMENT ON COLUMN om_auth_group_m.updated_by IS '수정자 식별자';
COMMENT ON COLUMN om_auth_group_m.is_deleted IS '소프트 삭제 여부';

-- ============================================================
-- auth_group_info JSONB 구조 정의 (권장)
-- ============================================================
--
--  키(key)               | 타입       | 필수 | 설명                              | 예시 / 비고
-- -----------------------|-----------|------|----------------------------------|----------------------------------
--  menu_ids              | string[]  | N    | 허용 메뉴 ID 목록                  | ["USER", "ORDER"]
--  permission_codes      | string[]  | N    | 세분 권한 코드 (기능 단위)         | ["USER:READ", "USER:WRITE"]
--  api_prefix_allow      | string[]  | N    | 허용 API 경로 prefix               | ["/api/v1/users"]
--  description           | string    | N    | 그룹 설명 (운영자용)               | "주문 담당자"
--  data_scope            | string    | N    | 데이터 범위 (옵션)               | "ALL", "CORP", "SELF"
--
-- 예시 데이터:
-- {
--   "menu_ids": ["USER", "ORDER"],
--   "permission_codes": ["USER:READ", "ORDER:READ", "ORDER:WRITE"],
--   "api_prefix_allow": ["/api/v1/users", "/api/v1/orders"],
--   "description": "일반 운영자",
--   "data_scope": "CORP"
-- }
