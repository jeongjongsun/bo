-- 전역(또는 단일 행) 운영 설정. 로그인 비밀번호 실패 상한 등.
CREATE TABLE IF NOT EXISTS om_config_m (
    id                        SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    max_password_fail_count   INT NOT NULL DEFAULT 5,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE om_config_m IS '운영 설정(단일 행 id=1)';
COMMENT ON COLUMN om_config_m.max_password_fail_count IS '비밀번호 연속 실패 허용 횟수(도달 시 LOCKED)';

INSERT INTO om_config_m (id, max_password_fail_count)
VALUES (1, 5)
ON CONFLICT (id) DO NOTHING;
