-- 1) 쇼핑몰 정보 마스터
-- 테이블명: om_mall_m
--
-- 쇼핑몰아이디(mall_id), 쇼핑몰코드(mall_cd), 쇼핑몰명(mall_nm), 쇼핑몰 부가정보(mall_info JSONB)
-- mall_info: 쇼핑몰URL, API URL, 배송타입, 수집타입, 쇼핑몰 판매 구분

CREATE TABLE om_mall_m (
    mall_id     BIGSERIAL      PRIMARY KEY,
    mall_cd     VARCHAR(20)    NOT NULL,
    mall_nm     VARCHAR(200)   NOT NULL,
    mall_info   JSONB          DEFAULT '{}',
    is_active   BOOLEAN        NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(48),
    updated_by  VARCHAR(48)
);

CREATE UNIQUE INDEX uk_mall_cd ON om_mall_m (mall_cd);
CREATE INDEX idx_mall_is_active ON om_mall_m (is_active);

COMMENT ON TABLE om_mall_m IS '쇼핑몰 정보 마스터 (주문 수집 대상 쇼핑몰)';
COMMENT ON COLUMN om_mall_m.mall_id IS '쇼핑몰아이디 (PK)';
COMMENT ON COLUMN om_mall_m.mall_cd IS '쇼핑몰코드 (비즈니스 키)';
COMMENT ON COLUMN om_mall_m.mall_nm IS '쇼핑몰명';
COMMENT ON COLUMN om_mall_m.mall_info IS '쇼핑몰 부가정보 (JSONB: mall_url, api_url, delivery_type, collection_type, sales_type_cd)';
COMMENT ON COLUMN om_mall_m.is_active IS '사용 여부';
COMMENT ON COLUMN om_mall_m.created_at IS '생성 일시';
COMMENT ON COLUMN om_mall_m.updated_at IS '수정 일시';
COMMENT ON COLUMN om_mall_m.created_by IS '생성자';
COMMENT ON COLUMN om_mall_m.updated_by IS '수정자';

-- ============================================================
-- mall_info JSONB 구조 정의
-- ============================================================
--
--  키(key)           | 타입    | 필수 | 설명                    | 예시 / 비고
-- -------------------|--------|------|-------------------------|------------------
--  mall_url           | string | N    | 쇼핑몰 URL              | "https://mall.example.com"
--  api_url            | string | N    | API 연동 URL            | "https://api.mall.example.com"
--  delivery_type      | string | N    | 배송타입 코드           | 공통코드 연동
--  collection_type    | string | N    | 수집타입 코드           | 주문 수집 방식 구분
--  sales_type_cd      | string | N    | 쇼핑몰 판매 구분        | B2C_DOMESTIC(국내), B2C_OVERSEAS(해외), B2B_DOMESTIC, B2B_OVERSEAS, ETC(기타주문)
--
-- 예시 데이터:
-- {
--   "mall_url": "https://mall.example.com",
--   "api_url": "https://api.mall.example.com",
--   "delivery_type": "DIRECT",
--   "collection_type": "API",
--   "sales_type_cd": "B2C_DOMESTIC"
-- }
