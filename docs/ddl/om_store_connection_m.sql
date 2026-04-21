-- 상점별 API 접속정보 (1:N)
-- 테이블명: om_store_connection_m
-- om_mall_store_m(store_id) 1 : N om_store_connection_m

CREATE TABLE om_store_connection_m (
    connection_id   BIGSERIAL      PRIMARY KEY,
    store_id        BIGINT         NOT NULL,
    connection_alias VARCHAR(100)  NOT NULL,
    api_id          VARCHAR(200),
    api_password    VARCHAR(500),
    client_id       VARCHAR(500),
    site_code       VARCHAR(100),
    redirect_uri    VARCHAR(1000),
    client_secret   VARCHAR(500),
    scope           VARCHAR(1000),
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(48),
    updated_by      VARCHAR(48),
    CONSTRAINT fk_store_connection_store FOREIGN KEY (store_id) REFERENCES om_mall_store_m (store_id) ON DELETE CASCADE
);

CREATE INDEX idx_store_connection_store_id ON om_store_connection_m (store_id);

COMMENT ON TABLE om_store_connection_m IS '상점별 API 접속정보 (1:N)';
COMMENT ON COLUMN om_store_connection_m.connection_id IS '접속정보 PK';
COMMENT ON COLUMN om_store_connection_m.store_id IS '상점 PK (FK → om_mall_store_m)';
COMMENT ON COLUMN om_store_connection_m.connection_alias IS '접속별칭';
COMMENT ON COLUMN om_store_connection_m.api_id IS 'API 아이디';
COMMENT ON COLUMN om_store_connection_m.api_password IS 'API 비밀번호';
COMMENT ON COLUMN om_store_connection_m.client_id IS 'OAuth clientId';
COMMENT ON COLUMN om_store_connection_m.site_code IS '사이트/상점 코드';
COMMENT ON COLUMN om_store_connection_m.redirect_uri IS 'OAuth redirectUri';
COMMENT ON COLUMN om_store_connection_m.client_secret IS 'OAuth clientSecret';
COMMENT ON COLUMN om_store_connection_m.scope IS 'OAuth scope';
