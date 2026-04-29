-- 전역(또는 단일 행) 운영 설정. BO/OM 공통 보안·메일 환경 변수.
CREATE TABLE IF NOT EXISTS om_config_m (
    id                        SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    max_password_fail_count   INT NOT NULL DEFAULT 5,
    max_inactive_login_days   INT NOT NULL DEFAULT 90,
    allow_duplicate_login     BOOLEAN NOT NULL DEFAULT FALSE,
    smtp_host                 VARCHAR(255),
    smtp_port                 INT,
    smtp_username             VARCHAR(255),
    smtp_password_enc         TEXT,
    smtp_from_email           VARCHAR(255),
    smtp_from_name            VARCHAR(255),
    smtp_use_tls              BOOLEAN NOT NULL DEFAULT TRUE,
    smtp_use_ssl              BOOLEAN NOT NULL DEFAULT FALSE,
    smtp_auth_required        BOOLEAN NOT NULL DEFAULT TRUE,
    smtp_connection_timeout_ms INT NOT NULL DEFAULT 10000,
    smtp_read_timeout_ms      INT NOT NULL DEFAULT 10000,
    smtp_write_timeout_ms     INT NOT NULL DEFAULT 10000,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE om_config_m IS '운영 설정(단일 행 id=1)';
COMMENT ON COLUMN om_config_m.max_password_fail_count IS '비밀번호 연속 실패 허용 횟수(도달 시 LOCKED)';
COMMENT ON COLUMN om_config_m.max_inactive_login_days IS '장기 미접속 허용 일수(초과 시 로그인 차단)';
COMMENT ON COLUMN om_config_m.allow_duplicate_login IS '중복 로그인 허용 여부(BO/OM 공통)';
COMMENT ON COLUMN om_config_m.smtp_host IS 'SMTP 서버 호스트';
COMMENT ON COLUMN om_config_m.smtp_port IS 'SMTP 서버 포트';
COMMENT ON COLUMN om_config_m.smtp_username IS 'SMTP 인증 계정';
COMMENT ON COLUMN om_config_m.smtp_password_enc IS 'SMTP 인증 비밀번호(암호화 저장)';
COMMENT ON COLUMN om_config_m.smtp_from_email IS '기본 발신 이메일';
COMMENT ON COLUMN om_config_m.smtp_from_name IS '기본 발신자 이름';
COMMENT ON COLUMN om_config_m.smtp_use_tls IS 'SMTP STARTTLS 사용 여부';
COMMENT ON COLUMN om_config_m.smtp_use_ssl IS 'SMTP SSL 사용 여부';
COMMENT ON COLUMN om_config_m.smtp_auth_required IS 'SMTP 인증 필요 여부';
COMMENT ON COLUMN om_config_m.smtp_connection_timeout_ms IS 'SMTP 연결 타임아웃(ms)';
COMMENT ON COLUMN om_config_m.smtp_read_timeout_ms IS 'SMTP 읽기 타임아웃(ms)';
COMMENT ON COLUMN om_config_m.smtp_write_timeout_ms IS 'SMTP 쓰기 타임아웃(ms)';

INSERT INTO om_config_m (
    id,
    max_password_fail_count,
    max_inactive_login_days,
    allow_duplicate_login,
    smtp_use_tls,
    smtp_use_ssl,
    smtp_auth_required,
    smtp_connection_timeout_ms,
    smtp_read_timeout_ms,
    smtp_write_timeout_ms
)
VALUES (1, 5, 90, FALSE, TRUE, FALSE, TRUE, 10000, 10000, 10000)
ON CONFLICT (id) DO NOTHING;
