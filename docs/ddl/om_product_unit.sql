-- 상품 단위/바코드 테이블 (단위/바코드 정보 분리)
-- 테이블명: OM_PRODUCT_UNIT
-- 상품 1건당 복수 행 (EA, CS, PLT 등 단위별 바코드·입수량)

CREATE TABLE OM_PRODUCT_UNIT (
    id            SERIAL         PRIMARY KEY,
    product_id    VARCHAR(48)    NOT NULL,
    unit_cd       VARCHAR(20)    NOT NULL,
    barcode       VARCHAR(50),
    pack_qty      INTEGER        NOT NULL DEFAULT 1,
    is_base_unit  BOOLEAN        NOT NULL DEFAULT false,
    sort_order    INTEGER        NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_unit_product FOREIGN KEY (product_id) REFERENCES OM_PRODUCT_M (product_id) ON DELETE CASCADE
);

CREATE INDEX idx_product_unit_product_id ON OM_PRODUCT_UNIT (product_id);
-- 상품별 기본단위 1건 조회 (목록/상세의 base_unit_cd 서브쿼리)
CREATE INDEX IF NOT EXISTS idx_product_unit_product_id_base ON om_product_unit (product_id, is_base_unit) WHERE is_base_unit = true;

COMMENT ON TABLE OM_PRODUCT_UNIT IS '상품 단위/바코드 (OM_PRODUCT_M 1:N)';
COMMENT ON COLUMN OM_PRODUCT_UNIT.product_id IS '상품 아이디';
COMMENT ON COLUMN OM_PRODUCT_UNIT.unit_cd IS '단위코드 (EA, CS, PLT 등)';
COMMENT ON COLUMN OM_PRODUCT_UNIT.barcode IS '바코드';
COMMENT ON COLUMN OM_PRODUCT_UNIT.pack_qty IS '입수량 (기본단위 환산)';
COMMENT ON COLUMN OM_PRODUCT_UNIT.is_base_unit IS '기본단위 여부';
