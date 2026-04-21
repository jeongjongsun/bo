-- 2) 쇼핑몰에 입점한 법인별 상점정보
-- 테이블명: om_mall_store_m
--
-- 쇼핑몰코드(mall_cd), 법인코드(corporation_cd), 상점코드(store_cd), 상점명(store_nm), 상점 부가정보(store_info JSONB)
-- store_info: 통화코드, GMT, WMS연동 여부, 상점구분코드(자사몰, 오픈마켓, 오프라인)

CREATE TABLE om_mall_store_m (
    store_id        BIGSERIAL      PRIMARY KEY,
    mall_cd         VARCHAR(20)    NOT NULL,
    corporation_cd VARCHAR(20)    NOT NULL,
    store_cd        VARCHAR(50)    NOT NULL,
    store_nm        VARCHAR(200)   NOT NULL,
    store_info      JSONB          DEFAULT '{}',
    is_active       BOOLEAN        NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(48),
    updated_by      VARCHAR(48),
    CONSTRAINT fk_mall_store_mall      FOREIGN KEY (mall_cd)         REFERENCES om_mall_m (mall_cd),
    CONSTRAINT fk_mall_store_corporation FOREIGN KEY (corporation_cd) REFERENCES om_corporation_m (corporation_cd),
    CONSTRAINT uk_mall_store_corp_store UNIQUE (mall_cd, corporation_cd, store_cd)
);

CREATE INDEX idx_mall_store_mall_cd ON om_mall_store_m (mall_cd);
CREATE INDEX idx_mall_store_corporation_cd ON om_mall_store_m (corporation_cd);
CREATE INDEX idx_mall_store_is_active ON om_mall_store_m (is_active);

COMMENT ON TABLE om_mall_store_m IS '쇼핑몰 입점 법인별 상점정보';
COMMENT ON COLUMN om_mall_store_m.store_id IS '상점 PK';
COMMENT ON COLUMN om_mall_store_m.mall_cd IS '쇼핑몰코드 (FK → om_mall_m)';
COMMENT ON COLUMN om_mall_store_m.corporation_cd IS '법인코드 (FK → om_corporation_m)';
COMMENT ON COLUMN om_mall_store_m.store_cd IS '상점코드 (쇼핑몰·법인 내 유일)';
COMMENT ON COLUMN om_mall_store_m.store_nm IS '상점명';
COMMENT ON COLUMN om_mall_store_m.store_info IS '상점 부가정보 (JSONB: currency_cd, gmt, wms_yn, store_type_cd)';
COMMENT ON COLUMN om_mall_store_m.is_active IS '사용 여부';
COMMENT ON COLUMN om_mall_store_m.created_at IS '생성 일시';
COMMENT ON COLUMN om_mall_store_m.updated_at IS '수정 일시';
COMMENT ON COLUMN om_mall_store_m.created_by IS '생성자';
COMMENT ON COLUMN om_mall_store_m.updated_by IS '수정자';

-- ============================================================
-- store_info JSONB 구조 정의
-- ============================================================
--
--  키(key)           | 타입    | 필수 | 설명                    | 예시 / 비고
-- -------------------|--------|------|-------------------------|------------------
--  currency_cd        | string | N    | 통화코드                | "KRW", "USD"
--  gmt                | string | N    | GMT/타임존              | "+09:00", "Asia/Seoul"
--  wms_yn             | string | N    | WMS 연동 여부           | "Y", "N"
--  store_type_cd      | string | N    | 상점구분코드            | OWN(자사몰), OPEN(오픈마켓), OFFLINE(오프라인)
--
-- 예시 데이터:
-- {
--   "currency_cd": "KRW",
--   "gmt": "+09:00",
--   "wms_yn": "Y",
--   "store_type_cd": "OPEN"
-- }
