-- 사용자 메인 테이블 생성 DDL
-- 테이블명: om_user_m (표준: 단수형·소문자·snake_case)
-- docs/08-DB-표준.md 준수

-- 테이블 생성
CREATE TABLE om_user_m (
    user_id         VARCHAR(48) NOT NULL,
    user_nm         VARCHAR(128) NOT NULL,
    user_info       JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(48),
    updated_by      VARCHAR(48),
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_om_user_m PRIMARY KEY (user_id)
);

-- 컬럼 코멘트
COMMENT ON TABLE om_user_m IS '사용자 메인 테이블';
COMMENT ON COLUMN om_user_m.user_id IS '사용자 아이디(로그인 ID, PK)';
COMMENT ON COLUMN om_user_m.user_nm IS '사용자 명';
COMMENT ON COLUMN om_user_m.user_info IS '사용자 부가정보 (JSONB: password, corporation_cd, grade_cd, password_fail_cnt, last_login_dtm, user_status, mobile_no, email_id, auth_group, privacy_access, second_auth_yn, access_ip_limit, access_ip)';
COMMENT ON COLUMN om_user_m.created_at IS '최초 생성 시각';
COMMENT ON COLUMN om_user_m.updated_at IS '최종 수정 시각';
COMMENT ON COLUMN om_user_m.created_by IS '생성자 식별자';
COMMENT ON COLUMN om_user_m.updated_by IS '수정자 식별자';
COMMENT ON COLUMN om_user_m.is_deleted IS '소프트 삭제 여부';

-- ============================================================
-- user_info JSONB 구조 정의
-- ============================================================
--
--  키(key)               | 타입       | 필수 | 설명                            | 예시 / 비고
-- -----------------------|-----------|------|--------------------------------|----------------------------------
--  password              | string    | Y    | 비밀번호 (bcrypt 해시)            | "$2a$10$..."
--  corporation_cd        | string    | N    | 법인(회사) 코드                   | "CORP001"
--  grade_cd              | string    | N    | 사용자 등급 코드                  | "ADMIN", "MANAGER", "USER"
--  password_fail_cnt     | integer   | N    | 비밀번호 연속 실패 횟수            | 0 ~ 5, 5회 초과 시 잠금 처리
--  last_login_dtm        | string    | N    | 최종 로그인 일시 (ISO 8601)       | "2026-02-20T14:30:00"
--  user_status           | string    | Y    | 사용자 상태                      | "ACTIVE", "INACTIVE", "LOCKED"
--  mobile_no             | string    | N    | 휴대전화 번호                    | "010-1234-5678"
--  email_id              | string    | N    | 이메일 주소                      | "user@example.com"
--  auth_group            | string    | Y    | 권한 그룹                        | "SUPER_ADMIN", "ORDER_MANAGER"
--  privacy_access        | string    | N    | 개인정보 접근 권한                | "Y", "N"
--  second_auth_yn        | string    | N    | 2차 인증 사용 여부               | "Y", "N"
--  access_ip_limit       | string    | N    | IP 접근 제한 사용 여부            | "Y", "N"
--  access_ip             | string[]  | N    | 허용 IP 목록 (배열)              | ["192.168.1.0/24", "10.0.0.1"]
--
-- 예시 데이터:
-- {
--   "password": "$2a$10$abcdefghijklmnopqrstuv",
--   "corporation_cd": "CORP001",
--   "grade_cd": "ADMIN",
--   "password_fail_cnt": 0,
--   "last_login_dtm": "2026-02-20T14:30:00",
--   "user_status": "ACTIVE",
--   "mobile_no": "010-1234-5678",
--   "email_id": "admin@shopeasy.com",
--   "auth_group": "SUPER_ADMIN",
--   "privacy_access": "Y",
--   "second_auth_yn": "N",
--   "access_ip_limit": "N",
--   "access_ip": []
-- }

